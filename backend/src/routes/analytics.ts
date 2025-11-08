import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { AuthenticatedRequest, SalesOverview, StaffLeaderboardEntry, ServicePopularity } from '../types/index.js';

const router = express.Router();
const prisma = new PrismaClient();

// Sales overview
router.get('/sales', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { startDate, endDate } = req.query;
    
    const where: any = {
      tenantId: authReq.tenantId,
      paymentStatus: 'paid'
    };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }
    
    const allInvoices = await prisma.invoice.findMany({
      where,
      select: {
        total: true,
        createdAt: true
      }
    });
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const daily = allInvoices
      .filter(inv => new Date(inv.createdAt) >= today)
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const weekly = allInvoices
      .filter(inv => new Date(inv.createdAt) >= weekStart)
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const monthly = allInvoices
      .filter(inv => new Date(inv.createdAt) >= monthStart)
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const total = allInvoices.reduce((sum, inv) => sum + inv.total, 0);
    
    const overview: SalesOverview = {
      daily,
      weekly,
      monthly,
      total
    };
    
    res.json({ overview });
  } catch (error) {
    next(error);
  }
});

// Staff leaderboard
router.get('/staff/leaderboard', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
        performance: true,
        appointments: {
          where: {
            status: 'completed',
            ...(period === 'week' && {
              completedAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              }
            }),
            ...(period === 'month' && {
              completedAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            })
          }
        }
      }
    });
    
    const leaderboard: StaffLeaderboardEntry[] = staff.map(s => ({
      staffId: s.id,
      staffName: s.user.name,
      revenue: s.performance?.revenueGenerated || 0,
      clientsServed: s.appointments.length,
      averageRating: s.performance?.averageRating || 0
    })).sort((a, b) => b.revenue - a.revenue);
    
    res.json({ leaderboard });
  } catch (error) {
    next(error);
  }
});

// Service popularity
router.get('/services/popularity', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
            },
            status: 'completed'
          }
        }
      }
    });
    
    const popularity: ServicePopularity[] = services.map(service => ({
      serviceId: service.id,
      serviceName: service.name,
      bookings: service._count.appointments,
      revenue: service.appointments.reduce((sum, apt) => sum + service.price, 0)
    })).sort((a, b) => b.bookings - a.bookings);
    
    res.json({ popularity });
  } catch (error) {
    next(error);
  }
});

// Customer insights
router.get('/customers', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { startDate, endDate } = req.query;
    
    const where: any = {
      tenantId: authReq.tenantId
    };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }
    
    const [newClients, repeatClients] = await Promise.all([
      prisma.client.count({
        where: {
          ...where,
          totalVisits: 1
        }
      }),
      prisma.client.count({
        where: {
          ...where,
          totalVisits: {
            gt: 1
          }
        }
      })
    ]);
    
    const totalClients = await prisma.client.count({ where });
    
    res.json({
      newClients,
      repeatClients,
      totalClients,
      retentionRate: totalClients > 0 ? (repeatClients / totalClients) * 100 : 0
    });
  } catch (error) {
    next(error);
  }
});

// Inventory insights
router.get('/inventory', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    const items = await prisma.inventoryItem.findMany({
      where: {
        tenantId: authReq.tenantId,
        isActive: true
      },
      include: {
        serviceItems: {
          include: {
            service: {
              include: {
                appointments: {
                  where: {
                    status: 'completed'
                  }
                }
              }
            }
          }
        }
      }
    });
    
    const lowStockItems = items.filter(item => item.quantity <= item.threshold);
    
    // Calculate consumption rate (simplified)
    const fastMovingItems = items
      .map(item => ({
        item,
        usage: item.serviceItems.reduce((sum, si) => {
          return sum + (si.service.appointments.length * si.quantity);
        }, 0)
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10)
      .map(({ item, usage }) => ({
        id: item.id,
        name: item.name,
        usage,
        quantity: item.quantity
      }));
    
    res.json({
      lowStockItems: lowStockItems.map(item => ({
        id: item.id,
        name: item.name,
        currentQuantity: item.quantity,
        threshold: item.threshold,
        unit: item.unit
      })),
      fastMovingItems
    });
  } catch (error) {
    next(error);
  }
});

export default router;

