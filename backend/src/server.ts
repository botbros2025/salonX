import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth.js';
import tenantRoutes from './routes/tenant.js';
import branchRoutes from './routes/branch.js';
import staffRoutes from './routes/staff.js';
import clientRoutes from './routes/client.js';
import serviceRoutes from './routes/service.js';
import appointmentRoutes from './routes/appointment.js';
import inventoryRoutes from './routes/inventory.js';
import invoiceRoutes from './routes/invoice.js';
import feedbackRoutes from './routes/feedback.js';
import analyticsRoutes from './routes/analytics.js';
import whatsappRoutes from './routes/whatsapp.js';
import uploadRoutes from './routes/upload.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { authenticate } from './middleware/auth.js';

// Import services
import { setupCronJobs } from './services/notifications.js';

dotenv.config();

const app: Express = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Protected routes
app.use('/api/tenants', authenticate, tenantRoutes);
app.use('/api/branches', authenticate, branchRoutes);
app.use('/api/staff', authenticate, staffRoutes);
app.use('/api/clients', authenticate, clientRoutes);
app.use('/api/services', authenticate, serviceRoutes);
app.use('/api/appointments', authenticate, appointmentRoutes);
app.use('/api/inventory', authenticate, inventoryRoutes);
app.use('/api/invoices', authenticate, invoiceRoutes);
app.use('/api/feedback', authenticate, feedbackRoutes);
app.use('/api/analytics', authenticate, analyticsRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling
app.use(errorHandler);

const PORT: number = parseInt(process.env.PORT || '3000', 10);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Setup cron jobs for notifications
  setupCronJobs();
  console.log('✅ Cron jobs initialized');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default app;

