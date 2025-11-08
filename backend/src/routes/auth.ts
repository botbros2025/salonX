import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { authenticate } from '../middleware/auth.js';
import { SignupRequest, LoginRequest, AuthResponse, AuthenticatedRequest } from '../types/index.js';

const router = express.Router();
const prisma = new PrismaClient();

// Salon Owner Signup
router.post('/signup', async (req: Request<{}, AuthResponse, SignupRequest>, res: Response<AuthResponse>, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name, phone, businessName, logo, branchName, staffCount } = req.body;

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        businessName,
        logo,
        subscriptionStatus: 'trial',
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        users: {
          create: {
            email,
            password: await hashPassword(password),
            name,
            phone,
            role: 'owner'
          }
        },
        branches: {
          create: {
            name: branchName || 'Main Branch'
          }
        }
      },
      include: {
        users: true,
        branches: true
      }
    });

    const user = tenant.users[0];
    if (!user) {
      res.status(500).json({ error: 'Failed to create user' } as any);
      return;
    }

    const token = generateToken(user.id, tenant.id);

    res.status(201).json({
      message: 'Signup successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId
      },
      tenant: {
        id: tenant.id,
        businessName: tenant.businessName
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req: Request<{}, AuthResponse, LoginRequest>, res: Response<AuthResponse>, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
        branch: true,
        staff: true
      }
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid credentials' } as any);
      return;
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' } as any);
      return;
    }

    const token = generateToken(user.id, user.tenantId);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        branchId: user.branchId
      },
      tenant: {
        id: user.tenant.id,
        businessName: user.tenant.businessName,
        subscriptionStatus: user.tenant.subscriptionStatus
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    const user = await prisma.user.findUnique({
      where: { id: authReq.user.id },
      include: {
        tenant: true,
        branch: true,
        staff: {
          include: {
            performance: true
          }
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        tenantId: true,
        branchId: true,
        tenant: {
          select: {
            id: true,
            businessName: true,
            logo: true,
            subscriptionStatus: true
          }
        },
        branch: true,
        staff: true
      }
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;

