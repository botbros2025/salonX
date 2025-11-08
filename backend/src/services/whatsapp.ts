import twilio from 'twilio';
import { WhatsAppMessage } from '../types/index.js';

const accountSid = process.env.WHATSAPP_ACCOUNT_SID;
const authToken = process.env.WHATSAPP_AUTH_TOKEN;
const fromNumber = process.env.WHATSAPP_PHONE_NUMBER;

let client: twilio.Twilio | null = null;

if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

export const sendWhatsAppMessage = async (to: string, body: string): Promise<void> => {
  if (!client || !fromNumber) {
    console.warn('WhatsApp not configured. Message would be:', { to, body });
    // In development, just log the message
    return;
  }
  
  try {
    // Format phone number (ensure it starts with whatsapp:)
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const formattedFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
    
    await client.messages.create({
      from: formattedFrom,
      to: formattedTo,
      body
    });
    
    console.log(`WhatsApp message sent to ${to}`);
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
};

export const sendBulkWhatsAppMessages = async (messages: WhatsAppMessage[]): Promise<void> => {
  await Promise.all(messages.map(msg => sendWhatsAppMessage(msg.to, msg.body)));
};

