import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';
import { CreateServiceRequest, AuthenticatedRequest } from '../types/index.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all services
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    const services = await prisma.service.findMany({
      where: {
        tenantId: authReq.tenantId,
        isActive: true
      },
      include: {
        serviceItems: {
          include: {
            inventoryItem: true
          }
        },
        serviceStaff: {
          include: {
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
        _count: {
          select: {
            appointments: true
          }
        }
      }
    });

    res.json({ services });
  } catch (error) {
    next(error);
  }
});

// Get single service
router.get('/:id', authenticate, async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    const service = await prisma.service.findFirst({
      where: {
        id: req.params.id,
        tenantId: authReq.tenantId
      },
      include: {
        serviceItems: {
          include: {
            inventoryItem: true
          }
        },
        serviceStaff: {
          include: {
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
        }
      }
    });

    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    res.json({ service });
  } catch (error) {
    next(error);
  }
});

// Create service
router.post('/', authenticate, authorize('owner', 'admin'), async (req: Request<{}, {}, CreateServiceRequest>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, description, duration, price, inventoryItems, staffIds } = req.body;
    
    const service = await prisma.service.create({
      data: {
        tenantId: authReq.tenantId,
        name,
        description,
        duration,
        price,
        serviceItems: {
          create: inventoryItems?.map(item => ({
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
            unit: item.unit
          })) || []
        },
        serviceStaff: {
          create: staffIds?.map(staffId => ({
            staffId
          })) || []
        }
      },
      include: {
        serviceItems: {
          include: {
            inventoryItem: true
          }
        },
        serviceStaff: true
      }
    });

    res.status(201).json({ service });
  } catch (error) {
    next(error);
  }
});

// Update service
router.put('/:id', authenticate, authorize('owner', 'admin'), async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, description, duration, price, isActive, inventoryItems, staffIds } = req.body;
    
    // Delete existing service items and staff links
    await Promise.all([
      prisma.serviceItem.deleteMany({
        where: { serviceId: req.params.id }
      }),
      prisma.serviceStaff.deleteMany({
        where: { serviceId: req.params.id }
      })
    ]);
    
    const service = await prisma.service.update({
      where: {
        id: req.params.id,
        tenantId: authReq.tenantId
      },
      data: {
        name,
        description,
        duration,
        price,
        isActive,
        serviceItems: {
          create: inventoryItems?.map(item => ({
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
            unit: item.unit
          })) || []
        },
        serviceStaff: {
          create: staffIds?.map(staffId => ({
            staffId
          })) || []
        }
      },
      include: {
        serviceItems: {
          include: {
            inventoryItem: true
          }
        },
        serviceStaff: true
      }
    });

    res.json({ service });
  } catch (error) {
    next(error);
  }
});

// Service popularity analytics
router.get('/analytics/popularity', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { startDate, endDate } = req.query;
    
    const services = await prisma.service.findMany({
      where: {
        tenantId: authReq.tenantId,
        appointments: {
          some: {
            scheduledAt: {
              gte: startDate ? new Date(startDate as string) : undefined,
              lte: endDate ? new Date(endDate as string) : undefined
            }
          }
        }
      },
      include: {
        _count: {
          select: {
            appointments: true
          }
        },
        appointments: {
          where: {
            scheduledAt: {
              gte: startDate ? new Date(startDate as string) : undefined,
              lte: endDate ? new Date(endDate as string) : undefined
            }
          }
        }
      },
      orderBy: {
        appointments: {
          _count: 'desc'
        }
      }
    });

    const popularity = services.map(service => ({
      id: service.id,
      name: service.name,
      bookings: service._count.appointments,
      revenue: service.appointments
        .filter(apt => apt.status === 'completed')
        .reduce((sum, apt) => sum + service.price, 0)
    }));

    res.json({ popularity });
  } catch (error) {
    next(error);
  }
});

export default router;

