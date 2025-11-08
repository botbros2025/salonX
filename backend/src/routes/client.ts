import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { CreateClientRequest, AuthenticatedRequest, PaginatedResponse, ClientWithRelations } from '../types/index.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all clients
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { search, loyaltyTier, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const where: any = {
      tenantId: authReq.tenantId
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (loyaltyTier) {
      where.loyaltyTier = loyaltyTier;
    }
    
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              appointments: true,
              invoices: true
            }
          }
        }
      }),
      prisma.client.count({ where })
    ]);

    res.json({
      clients,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get single client
router.get('/:id', authenticate, async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    const client = await prisma.client.findFirst({
      where: {
        id: req.params.id,
        tenantId: authReq.tenantId
      },
      include: {
        appointments: {
          orderBy: { scheduledAt: 'desc' },
          include: {
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
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        feedbacks: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!client) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    res.json({ client });
  } catch (error) {
    next(error);
  }
});

// Create or find client
router.post('/', authenticate, async (req: Request<{}, {}, CreateClientRequest>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, phone, email, dateOfBirth, address, notes } = req.body;
    
    // Check if client exists
    let client = await prisma.client.findUnique({
      where: {
        tenantId_phone: {
          tenantId: authReq.tenantId,
          phone
        }
      }
    });

    if (client) {
      // Update existing client
      client = await prisma.client.update({
        where: { id: client.id },
        data: {
          name,
          email,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          address,
          notes
        }
      });
    } else {
      // Create new client
      client = await prisma.client.create({
        data: {
          tenantId: authReq.tenantId,
          name,
          phone,
          email,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          address,
          notes
        }
      });
    }

    res.status(201).json({ client });
  } catch (error) {
    next(error);
  }
});

// Update client
router.put('/:id', authenticate, async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, email, dateOfBirth, address, notes, loyaltyTier } = req.body;
    
    const client = await prisma.client.update({
      where: {
        id: req.params.id,
        tenantId: authReq.tenantId
      },
      data: {
        name,
        email,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        address,
        notes,
        loyaltyTier
      }
    });

    res.json({ client });
  } catch (error) {
    next(error);
  }
});

// Update loyalty tier based on spend
export const updateLoyaltyTier = async (clientId: string, tenantId: string): Promise<void> => {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      invoices: {
        where: {
          paymentStatus: 'paid'
        }
      }
    }
  });

  if (!client) return;

  const totalSpend = client.invoices.reduce((sum, inv) => sum + inv.total, 0);
  let loyaltyTier: 'Silver' | 'Gold' | 'Platinum' = 'Silver';
  
  if (totalSpend >= 50000) {
    loyaltyTier = 'Platinum';
  } else if (totalSpend >= 20000) {
    loyaltyTier = 'Gold';
  }

  await prisma.client.update({
    where: { id: clientId },
    data: {
      totalSpend,
      loyaltyTier
    }
  });
};

export default router;

