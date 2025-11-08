import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { sendWhatsAppMessage } from '../services/whatsapp.js';
import { updateLoyaltyTier } from './client.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = express.Router();
const prisma = new PrismaClient();

interface CreateInvoiceRequest {
  appointmentId: string;
  subtotal: number;
  tax?: number;
  discount?: number;
  paymentMethod?: 'cash' | 'upi' | 'card' | 'credit';
  notes?: string;
  items?: Array<{
    itemType: 'service' | 'product';
    itemName: string;
    quantity: number;
    price: number;
  }>;
}

// Get all invoices
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { clientId, startDate, endDate, paymentStatus } = req.query;
    
    const where: any = {
      tenantId: authReq.tenantId
    };
    
    if (clientId) where.clientId = clientId;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }
    
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: true,
        appointment: {
          include: {
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
        },
        invoiceItems: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ invoices });
  } catch (error) {
    next(error);
  }
});

// Get single invoice
router.get('/:id', authenticate, async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id,
        tenantId: authReq.tenantId
      },
      include: {
        client: true,
        appointment: {
          include: {
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
        },
        invoiceItems: true
      }
    });

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    res.json({ invoice });
  } catch (error) {
    next(error);
  }
});

// Create invoice
router.post('/', authenticate, async (req: Request<{}, {}, CreateInvoiceRequest>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { appointmentId, subtotal, tax = 0, discount = 0, paymentMethod, notes, items } = req.body;
    
    // Get appointment
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
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
    
    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({
      where: { tenantId: authReq.tenantId }
    });
    const invoiceNumber = `INV-${Date.now()}-${invoiceCount + 1}`;
    
    const total = subtotal + tax - discount;
    
    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: authReq.tenantId,
        appointmentId,
        clientId: appointment.clientId,
        invoiceNumber,
        subtotal,
        tax,
        discount,
        total,
        paymentMethod,
        paymentStatus: paymentMethod ? 'paid' : 'pending',
        paidAt: paymentMethod ? new Date() : undefined,
        notes,
        invoiceItems: {
          create: items || [{
            itemType: 'service',
            itemName: appointment.service.name,
            quantity: 1,
            price: appointment.service.price,
            total: appointment.service.price
          }]
        }
      },
      include: {
        client: true,
        appointment: {
          include: {
            service: true
          }
        },
        invoiceItems: true
      }
    });
    
    // Update client total spend
    await prisma.client.update({
      where: { id: appointment.clientId },
      data: {
        totalSpend: { increment: total }
      }
    });
    
    // Update loyalty tier
    await updateLoyaltyTier(appointment.clientId, authReq.tenantId);
    
    // Send WhatsApp invoice
    try {
      const message = `Thank you ${appointment.client.name}! Your bill of ₹${total} for ${appointment.service.name} has been generated. Invoice: ${invoiceNumber}`;
      await sendWhatsAppMessage(appointment.client.phone, message);
    } catch (error) {
      console.error('WhatsApp notification failed:', error);
    }
    
    res.status(201).json({ invoice });
  } catch (error) {
    next(error);
  }
});

// Update payment status
router.patch('/:id/payment', authenticate, async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { paymentMethod, paymentStatus } = req.body;
    
    const invoice = await prisma.invoice.update({
      where: {
        id: req.params.id,
        tenantId: authReq.tenantId
      },
      data: {
        paymentMethod,
        paymentStatus,
        paidAt: paymentStatus === 'paid' ? new Date() : undefined
      },
      include: {
        client: true,
        appointment: true
      }
    });

    res.json({ invoice });
  } catch (error) {
    next(error);
  }
});

export default router;

