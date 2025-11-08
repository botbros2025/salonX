import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

let transporter: nodemailer.Transporter | null = null;

if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  if (!transporter) {
    console.warn('Email not configured. Email would be:', options);
    return;
  }
  
  try {
    await transporter.sendMail({
      from: `"Salon360" <${smtpUser}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    });
    
    console.log(`Email sent to ${options.to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Email templates
export const emailTemplates = {
  appointmentConfirmation: (data: {
    clientName: string;
    serviceName: string;
    staffName: string;
    dateTime: string;
    salonName: string;
  }) => ({
    subject: `Appointment Confirmation - ${data.salonName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Appointment Confirmed!</h2>
        <p>Hi ${data.clientName},</p>
        <p>Your appointment has been confirmed:</p>
        <ul>
          <li><strong>Service:</strong> ${data.serviceName}</li>
          <li><strong>Staff:</strong> ${data.staffName}</li>
          <li><strong>Date & Time:</strong> ${data.dateTime}</li>
        </ul>
        <p>We look forward to seeing you!</p>
        <p>Best regards,<br>${data.salonName}</p>
      </div>
    `,
  }),
  
  invoice: (data: {
    clientName: string;
    invoiceNumber: string;
    total: number;
    salonName: string;
    invoiceUrl?: string;
  }) => ({
    subject: `Invoice ${data.invoiceNumber} - ${data.salonName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Invoice</h2>
        <p>Hi ${data.clientName},</p>
        <p>Thank you for your visit! Your invoice is ready:</p>
        <ul>
          <li><strong>Invoice Number:</strong> ${data.invoiceNumber}</li>
          <li><strong>Total Amount:</strong> ₹${data.total}</li>
        </ul>
        ${data.invoiceUrl ? `<p><a href="${data.invoiceUrl}" style="background: #8b5cf6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Invoice</a></p>` : ''}
        <p>Best regards,<br>${data.salonName}</p>
      </div>
    `,
  }),
  
  dailySummary: (data: {
    ownerName: string;
    salonName: string;
    dailyRevenue: number;
    appointments: number;
    date: string;
  }) => ({
    subject: `Daily Summary - ${data.date}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Daily Summary</h2>
        <p>Hi ${data.ownerName},</p>
        <p>Here's your business summary for ${data.date}:</p>
        <ul>
          <li><strong>Revenue:</strong> ₹${data.dailyRevenue}</li>
          <li><strong>Appointments:</strong> ${data.appointments}</li>
        </ul>
        <p>Best regards,<br>Salon360 Team</p>
      </div>
    `,
  }),
};

