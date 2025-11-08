import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendWhatsAppMessage } from './whatsapp.js';

const prisma = new PrismaClient();

// Send appointment reminders (1 hour before)
export const setupAppointmentReminders = (): void => {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
      const now = new Date();
      
      const appointments = await prisma.appointment.findMany({
        where: {
          status: 'booked',
          scheduledAt: {
            gte: now,
            lte: oneHourFromNow
          }
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
          }
        }
      });
      
      for (const appointment of appointments) {
        const message = `Reminder: Your appointment for ${appointment.service.name} with ${appointment.staff.user.name} is in 1 hour at ${appointment.scheduledAt.toLocaleString()}.`;
        await sendWhatsAppMessage(appointment.client.phone, message);
      }
    } catch (error) {
      console.error('Error sending appointment reminders:', error);
    }
  });
};

// Send low stock alerts
export const checkLowStockAlerts = async (tenantId: string): Promise<void> => {
  try {
    const items = await prisma.inventoryItem.findMany({
      where: {
        tenantId,
        isActive: true
      }
    });
    
    const lowStockItems = items.filter(item => item.quantity <= item.threshold);
    
    if (lowStockItems.length > 0) {
      // Get tenant owner/admin
      const admin = await prisma.user.findFirst({
        where: {
          tenantId,
          role: {
            in: ['owner', 'admin']
          }
        }
      });
      
      if (admin) {
        const itemsList = lowStockItems.map(item => `${item.name} (${item.quantity} ${item.unit} left)`).join(', ');
        const message = `Stock Alert: ${itemsList} are below threshold.`;
        await sendWhatsAppMessage(admin.phone, message);
      }
    }
  } catch (error) {
    console.error('Error checking low stock alerts:', error);
  }
};

// Send birthday messages
export const sendBirthdayMessages = async (): Promise<void> => {
  try {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    
    const clients = await prisma.client.findMany({
      where: {
        dateOfBirth: {
          not: null
        }
      }
    });
    
    for (const client of clients) {
      if (client.dateOfBirth) {
        const birthDate = new Date(client.dateOfBirth);
        if (birthDate.getMonth() + 1 === month && birthDate.getDate() === day) {
          const message = `Happy Birthday ${client.name}! 🎉 Enjoy a special discount on your next visit. Use code BIRTHDAY20 for 20% off!`;
          await sendWhatsAppMessage(client.phone, message);
        }
      }
    }
  } catch (error) {
    console.error('Error sending birthday messages:', error);
  }
};

// Daily sales summary
export const sendDailySalesSummary = async (tenantId: string): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: today,
          lt: tomorrow
        },
        paymentStatus: 'paid'
      }
    });
    
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalAppointments = invoices.length;
    
    const admin = await prisma.user.findFirst({
      where: {
        tenantId,
        role: {
          in: ['owner', 'admin']
        }
      }
    });
    
    if (admin) {
      const message = `Daily Summary - ${today.toLocaleDateString()}\nRevenue: ₹${totalRevenue}\nAppointments: ${totalAppointments}`;
      await sendWhatsAppMessage(admin.phone, message);
    }
  } catch (error) {
    console.error('Error sending daily sales summary:', error);
  }
};

// Setup cron jobs
export const setupCronJobs = (): void => {
  setupAppointmentReminders();
  
  // Check low stock daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    const tenants = await prisma.tenant.findMany({
      select: { id: true }
    });
    
    for (const tenant of tenants) {
      await checkLowStockAlerts(tenant.id);
    }
  });
  
  // Send birthday messages daily at 10 AM
  cron.schedule('0 10 * * *', sendBirthdayMessages);
  
  // Send daily sales summary at 9 PM
  cron.schedule('0 21 * * *', async () => {
    const tenants = await prisma.tenant.findMany({
      select: { id: true }
    });
    
    for (const tenant of tenants) {
      await sendDailySalesSummary(tenant.id);
    }
  });
};

