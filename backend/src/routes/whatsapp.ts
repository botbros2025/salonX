import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendWhatsAppMessage } from '../services/whatsapp.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = express.Router();
const prisma = new PrismaClient();

interface WhatsAppWebhookRequest {
  From: string;
  Body: string;
  MessageSid?: string;
}

// Webhook endpoint for receiving WhatsApp messages
router.post('/webhook', async (req: Request<{}, {}, WhatsAppWebhookRequest>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { From, Body } = req.body;
    
    // Extract phone number (remove whatsapp: prefix if present)
    const phoneNumber = From.replace('whatsapp:', '').trim();
    const message = Body.trim().toLowerCase();
    
    // Simple keyword matching for auto-booking
    // In production, use a more sophisticated NLP or intent recognition
    
    // Example: "I want a haircut today at 5 PM"
    const keywords = {
      'haircut': 'haircut',
      'hair cut': 'haircut',
      'pedicure': 'pedicure',
      'manicure': 'manicure',
      'facial': 'facial',
      'massage': 'massage'
    };
    
    let detectedService: string | null = null;
    for (const [keyword, service] of Object.entries(keywords)) {
      if (message.includes(keyword)) {
        detectedService = service;
        break;
      }
    }
    
    if (detectedService) {
      // Find tenant by phone number (in production, maintain a mapping)
      // For now, send a generic response
      const reply = `Thank you for your interest in ${detectedService}! Please provide your preferred date and time, or call us for immediate booking.`;
      await sendWhatsAppMessage(phoneNumber, reply);
    } else {
      const reply = 'Thank you for contacting us! How can we help you today? Reply with a service name to book an appointment.';
      await sendWhatsAppMessage(phoneNumber, reply);
    }
    
    res.status(200).json({ status: 'ok' });
  } catch (error) {
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

