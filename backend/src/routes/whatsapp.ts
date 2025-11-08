import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendWhatsAppMessage } from '../services/whatsapp.js';
import { processWhatsAppBooking } from '../services/whatsappBot.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = express.Router();
const prisma = new PrismaClient();

interface WhatsAppWebhookRequest {
  From: string;
  Body: string;
  MessageSid?: string;
  To?: string;
}

// Webhook endpoint for receiving WhatsApp messages
router.post('/webhook', async (req: Request<{}, {}, WhatsAppWebhookRequest>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { From, Body, To } = req.body;
    
    // Extract phone number (remove whatsapp: prefix if present)
    const phoneNumber = From.replace('whatsapp:', '').trim();
    const message = Body.trim();
    
    // Find tenant by WhatsApp number (in production, maintain a mapping table)
    // For now, try to find by matching phone number or use first tenant
    const tenant = await prisma.tenant.findFirst({
      where: {
        // In production, add a whatsappPhone field to Tenant model
        // For now, use first tenant or match by business phone
      },
      take: 1,
    });
    
    if (!tenant) {
      await sendWhatsAppMessage(phoneNumber, 'Sorry, salon not found. Please contact the salon directly.');
      res.status(200).json({ status: 'ok' });
      return;
    }
    
    // Check if user is in booking flow
    const lowerMessage = message.toLowerCase();
    const isBookingIntent =
      lowerMessage.includes('book') ||
      lowerMessage.includes('appointment') ||
      lowerMessage.includes('schedule') ||
      lowerMessage.includes('haircut') ||
      lowerMessage.includes('hair cut') ||
      lowerMessage.includes('pedicure') ||
      lowerMessage.includes('manicure') ||
      lowerMessage.includes('facial') ||
      lowerMessage.includes('massage') ||
      lowerMessage.includes('service');
    
    if (isBookingIntent) {
      // Process booking flow
      const reply = await processWhatsAppBooking(phoneNumber, message, tenant.id);
      await sendWhatsAppMessage(phoneNumber, reply);
    } else {
      // Generic response
      const reply = `Hello! 👋 Welcome to ${tenant.businessName}.\n\nTo book an appointment, reply with:\n• Service name (e.g., "haircut")\n• Or type "book" to start booking\n\nWe'll guide you through the process!`;
      await sendWhatsAppMessage(phoneNumber, reply);
    }
    
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    next(error);
  }
});

// Send test message (for development)
router.post('/send', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      res.status(400).json({ error: 'to and message are required' });
      return;
    }
    
    await sendWhatsAppMessage(to, message);
    res.json({ status: 'sent' });
  } catch (error) {
    next(error);
  }
});

export default router;

