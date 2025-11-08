import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get tenant details
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: authReq.tenantId },
      include: {
        branches: true,
        _count: {
          select: {
            users: true,
            clients: true,
            services: true,
            appointments: true
          }
        }
      }
    });

    res.json({ tenant });
  } catch (error) {
    next(error);
  }
});

// Update tenant
router.put('/', authenticate, authorize('owner', 'admin'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { businessName, logo } = req.body;
    
    const tenant = await prisma.tenant.update({
      where: { id: authReq.tenantId },
      data: {
        businessName,
        logo
      }
    });

    res.json({ tenant });
  } catch (error) {
    next(error);
  }
});

// Subscription management
router.post('/subscription', authenticate, authorize('owner'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { plan, paymentId } = req.body;
    
    // In production, verify payment with Razorpay/Stripe
    const subscriptionEndsAt = new Date();
    subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1); // 1 month subscription
    
    const tenant = await prisma.tenant.update({
      where: { id: authReq.tenantId },
      data: {
        subscriptionStatus: 'active',
        subscriptionPlan: plan,
        subscriptionEndsAt
      }
    });

    res.json({ tenant });
  } catch (error) {
    next(error);
  }
});

export default router;

