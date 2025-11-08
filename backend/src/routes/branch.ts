import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = express.Router();
const prisma = new PrismaClient();

interface CreateBranchRequest {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface UpdateBranchRequest {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
}

// Get all branches
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    const branches = await prisma.branch.findMany({
      where: { tenantId: authReq.tenantId },
      include: {
        _count: {
          select: {
            staff: true,
            appointments: true
          }
        }
      }
    });

    res.json({ branches });
  } catch (error) {
    next(error);
  }
});

// Get single branch
router.get('/:id', authenticate, async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    const branch = await prisma.branch.findFirst({
      where: {
        id: req.params.id,
        tenantId: authReq.tenantId
      },
      include: {
        staff: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    if (!branch) {
      res.status(404).json({ error: 'Branch not found' });
      return;
    }

    res.json({ branch });
  } catch (error) {
    next(error);
  }
});

// Create branch
router.post('/', authenticate, authorize('owner', 'admin'), async (req: Request<{}, {}, CreateBranchRequest>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, address, phone, email } = req.body;
    
    const branch = await prisma.branch.create({
      data: {
        name,
        address,
        phone,
        email,
        tenantId: authReq.tenantId
      }
    });

    res.status(201).json({ branch });
  } catch (error) {
    next(error);
  }
});

// Update branch
router.put('/:id', authenticate, authorize('owner', 'admin'), async (req: Request<{ id: string }, {}, UpdateBranchRequest>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, address, phone, email } = req.body;
    
    const branch = await prisma.branch.update({
      where: {
        id: req.params.id,
        tenantId: authReq.tenantId
      },
      data: {
        name,
        address,
        phone,
        email
      }
    });

    res.json({ branch });
  } catch (error) {
    next(error);
  }
});

// Delete branch
router.delete('/:id', authenticate, authorize('owner'), async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    await prisma.branch.delete({
      where: {
        id: req.params.id,
        tenantId: authReq.tenantId
      }
    });

    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

