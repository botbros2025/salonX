import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { sendWhatsAppMessage } from '../services/whatsapp.js';
import { updateLoyaltyTier } from './client.js';
import { CreateAppointmentRequest, UpdateAppointmentStatusRequest, AuthenticatedRequest } from '../types/index.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all appointments
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { status, staffId, clientId, startDate, endDate, branchId } = req.query;
    
    const where: any = {
      tenantId: authReq.tenantId
    };
    
    if (status) where.status = status;
    if (staffId) where.staffId = staffId;
    if (clientId) where.clientId = clientId;
    if (branchId) where.branchId = branchId;
    if (startDate || endDate) {
      where.scheduledAt = {};
      if (startDate) where.scheduledAt.gte = new Date(startDate as string);
      if (endDate) where.scheduledAt.lte = new Date(endDate as string);
    }
    
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: true,
        service: true,
        staff: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        branch: {
          select: {
            name: true
          }
        },
        invoice: true
      },
      orderBy: { scheduledAt: 'desc' }
    });

    res.json({ appointments });
  } catch (error) {
    next(error);
  }
});

// Get single appointment
router.get('/:id', authenticate, async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: req.params.id,
        tenantId: authReq.tenantId
      },
      include: {
        client: true,
        service: {
          include: {
            serviceItems: {
              include: {
                inventoryItem: true
              }
            }
          }
        },
        staff: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        branch: true,
        invoice: true
      }
    });

    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }

    res.json({ appointment });
  } catch (error) {
    next(error);
  }
});

// Create appointment
router.post('/', authenticate, async (req: Request<{}, {}, CreateAppointmentRequest>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { clientId, clientPhone, clientName, serviceId, staffId, branchId, scheduledAt, notes } = req.body;
    
    let finalClientId = clientId;
    
    // If no clientId, create or find client by phone
    if (!finalClientId && clientPhone) {
      let client = await prisma.client.findUnique({
        where: {
          tenantId_phone: {
            tenantId: authReq.tenantId,
            phone: clientPhone
          }
        }
      });
      
      if (!client) {
        client = await prisma.client.create({
          data: {
            tenantId: authReq.tenantId,
            name: clientName || 'New Client',
            phone: clientPhone
          }
        });
      }
      
      finalClientId = client.id;
    }
    
    if (!finalClientId) {
      res.status(400).json({ error: 'Client ID or phone number is required' });
      return;
    }
    
    // Check staff availability
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        staffId,
        branchId,
        status: {
          in: ['booked', 'ongoing']
        },
        scheduledAt: {
          gte: new Date(new Date(scheduledAt).getTime() - 30 * 60 * 1000), // 30 min before
          lte: new Date(new Date(scheduledAt).getTime() + 30 * 60 * 1000)  // 30 min after
        }
      }
    });
    
    if (conflictingAppointment) {
      res.status(409).json({ error: 'Staff is not available at this time' });
      return;
    }
    
    const appointment = await prisma.appointment.create({
      data: {
        tenantId: authReq.tenantId,
        branchId,
        clientId: finalClientId,
        serviceId,
        staffId,
        scheduledAt: new Date(scheduledAt),
        notes,
        status: 'booked'
      },
      include: {
        client: true,
        service: true,
        staff: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        branch: true
      }
    });
    
    // Update client visit count
    await prisma.client.update({
      where: { id: finalClientId },
      data: {
        totalVisits: { increment: 1 }
      }
    });
    
    // Send WhatsApp confirmation
    try {
      const service = await prisma.service.findUnique({ where: { id: serviceId } });
      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
        include: { user: true }
      });
      
      if (service && staff) {
        const message = `Hi ${appointment.client.name}, your appointment for ${service.name} is confirmed with ${staff.user.name} at ${new Date(scheduledAt).toLocaleString()}.`;
        await sendWhatsAppMessage(appointment.client.phone, message);
      }
    } catch (whatsappError) {
      console.error('WhatsApp notification failed:', whatsappError);
      // Don't fail the appointment creation if WhatsApp fails
    }
    
    res.status(201).json({ appointment });
  } catch (error) {
    next(error);
  }
});

// Update appointment status
router.patch('/:id/status', authenticate, async (req: Request<{ id: string }, {}, UpdateAppointmentStatusRequest>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { status } = req.body;
    const appointmentId = req.params.id;
    
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        tenantId: authReq.tenantId
      },
      include: {
        service: {
          include: {
            serviceItems: {
              include: {
                inventoryItem: true
              }
            }
          }
        }
      }
    });
    
    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
    
    const updateData: any = { status };
    
    if (status === 'completed' && !appointment.completedAt) {
      updateData.completedAt = new Date();
      
      // Deduct inventory
      for (const item of appointment.service.serviceItems) {
        await prisma.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        });
        
        // Check threshold and alert
        const inventory = await prisma.inventoryItem.findUnique({
          where: { id: item.inventoryItemId }
        });
        
        if (inventory && inventory.quantity <= inventory.threshold) {
          // Trigger low stock alert (implement notification service)
          console.log(`Low stock alert: ${inventory.name} (${inventory.quantity} left)`);
        }
      }
      
      // Update staff performance
      const staffPerformance = await prisma.staffPerformance.findUnique({
        where: { staffId: appointment.staffId }
      });
      
      if (staffPerformance) {
        await prisma.staffPerformance.update({
          where: { staffId: appointment.staffId },
          data: {
            servicesCompleted: { increment: 1 },
            revenueGenerated: { increment: appointment.service.price }
          }
        });
      }
    }
    
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        client: true,
        service: true,
        staff: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
    
    res.json({ appointment: updatedAppointment });
  } catch (error) {
    next(error);
  }
});

// Cancel appointment
router.patch('/:id/cancel', authenticate, async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: req.params.id,
        tenantId: authReq.tenantId
      },
      include: {
        client: true,
        service: true
      }
    });
    
    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
    
    const updatedAppointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' },
      include: {
        client: true,
        service: true
      }
    });
    
    // Send cancellation notification
    try {
      const message = `Your appointment for ${appointment.service.name} has been cancelled.`;
      await sendWhatsAppMessage(appointment.client.phone, message);
    } catch (error) {
      console.error('WhatsApp notification failed:', error);
    }
    
    res.json({ appointment: updatedAppointment });
  } catch (error) {
    next(error);
  }
});

// Get available time slots
router.get('/availability/slots', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { staffId, branchId, date } = req.query;
    
    if (!staffId || !branchId || !date) {
      res.status(400).json({ error: 'staffId, branchId, and date are required' });
      return;
    }
    
    const selectedDate = new Date(date as string);
    
    // Get staff shift timings
    const staff = await prisma.staff.findUnique({
      where: { id: staffId as string },
      include: { branch: true }
    });
    
    if (!staff) {
      res.status(404).json({ error: 'Staff not found' });
      return;
    }
    
    // Get existing appointments for the day
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const appointments = await prisma.appointment.findMany({
      where: {
        staffId: staffId as string,
        branchId: branchId as string,
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          in: ['booked', 'ongoing']
        }
      }
    });
    
    // Generate available slots (assuming 30-minute intervals)
    const shiftStart = staff.shiftStart ? parseInt(staff.shiftStart.split(':')[0]) : 9;
    const shiftEnd = staff.shiftEnd ? parseInt(staff.shiftEnd.split(':')[0]) : 18;
    
    const slots: string[] = [];
    for (let hour = shiftStart; hour < shiftEnd; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotTime = new Date(selectedDate);
        slotTime.setHours(hour, minute, 0, 0);
        
        const isBooked = appointments.some(apt => {
          const aptTime = new Date(apt.scheduledAt);
          return Math.abs(aptTime.getTime() - slotTime.getTime()) < 30 * 60 * 1000;
        });
        
        if (!isBooked && slotTime > new Date()) {
          slots.push(slotTime.toISOString());
        }
      }
    }
    
    res.json({ slots });
  } catch (error) {
    next(error);
  }
});

export default router;

