import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';
import { hashPassword } from '../utils/password.js';
import { CreateStaffRequest, AuthenticatedRequest } from '../types/index.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all staff
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    const staff = await prisma.staff.findMany({
      where: {
        user: {
          tenantId: authReq.tenantId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        performance: true
      }
    });

    res.json({ staff });
  } catch (error) {
    next(error);
  }
});

// Get single staff
router.get('/:id', authenticate, async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    const staff = await prisma.staff.findFirst({
      where: {
        id: req.params.id,
        user: {
          tenantId: authReq.tenantId
        }
      },
      include: {
        user: true,
        branch: true,
        performance: true,
        appointments: {
          take: 10,
          orderBy: { scheduledAt: 'desc' },
          include: {
            client: true,
            service: true
          }
        }
      }
    });

    if (!staff) {
      res.status(404).json({ error: 'Staff not found' });
      return;
    }

    res.json({ staff });
  } catch (error) {
    next(error);
  }
});

// Create staff
router.post('/', authenticate, authorize('owner', 'admin'), async (req: Request<{}, {}, CreateStaffRequest>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, email, phone, password, role, branchId, shiftStart, shiftEnd, salary, joiningDate } = req.body;
    
    // Create user first
    const user = await prisma.user.create({
      data: {
        email,
        password: await hashPassword(password || 'default123'),
        name,
        phone,
        role: 'staff',
        tenantId: authReq.tenantId,
        branchId
      }
    });

    // Create staff record
    const staff = await prisma.staff.create({
      data: {
        userId: user.id,
        branchId,
        role,
        shiftStart,
        shiftEnd,
        salary,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        branch: true
      }
    });

    // Initialize performance
    await prisma.staffPerformance.create({
      data: {
        staffId: staff.id
      }
    });

    res.status(201).json({ staff });
  } catch (error) {
    next(error);
  }
});

// Update staff
router.put('/:id', authenticate, authorize('owner', 'admin'), async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role, shiftStart, shiftEnd, salary, isActive } = req.body;
    
    const staff = await prisma.staff.update({
      where: { id: req.params.id },
      data: {
        role,
        shiftStart,
        shiftEnd,
        salary,
        isActive
      },
      include: {
        user: true,
        branch: true
      }
    });

    res.json({ staff });
  } catch (error) {
    next(error);
  }
});

// Staff leaderboard
router.get('/leaderboard', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { period = 'month' } = req.query;
    
    const staff = await prisma.staff.findMany({
      where: {
        user: {
          tenantId: authReq.tenantId
        },
        isActive: true
      },
      include: {
        user: {
          select: {
            name: true
          }
        },
        performance: true
      },
      orderBy: {
        performance: {
          revenueGenerated: 'desc'
        }
      },
      take: 10
    });

    res.json({ staff });
  } catch (error) {
    next(error);
  }
});

export default router;

