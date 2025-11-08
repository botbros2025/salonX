import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';
import { sendWhatsAppMessage } from '../services/whatsapp.js';
import { CreateInventoryItemRequest, AuthenticatedRequest } from '../types/index.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all inventory items
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { lowStock, search } = req.query;
    
    const where: any = {
      tenantId: authReq.tenantId
    };
    
    if (lowStock === 'true') {
      // Prisma doesn't support direct comparison, so we'll filter in memory
      // For production, use raw query or filter after fetch
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { supplier: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    let items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    // Filter low stock items if requested
    if (lowStock === 'true') {
      items = items.filter(item => item.quantity <= item.threshold);
    }

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

// Get single item
router.get('/:id', authenticate, async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id: req.params.id,
        tenantId: authReq.tenantId
      },
      include: {
        serviceItems: {
          include: {
            service: true
          }
        }
      }
    });

    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    res.json({ item });
  } catch (error) {
    next(error);
  }
});

// Create inventory item
router.post('/', authenticate, authorize('owner', 'admin'), async (req: Request<{}, {}, CreateInventoryItemRequest>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, unit, quantity, threshold, supplier, costPrice, sellingPrice } = req.body;
    
    const item = await prisma.inventoryItem.create({
      data: {
        tenantId: authReq.tenantId,
        name,
        unit,
        quantity,
        threshold,
        supplier,
        costPrice,
        sellingPrice
      }
    });

    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});

// Update inventory item
router.put('/:id', authenticate, authorize('owner', 'admin'), async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, unit, quantity, threshold, supplier, costPrice, sellingPrice, isActive } = req.body;
    
    const item = await prisma.inventoryItem.update({
      where: {
        id: req.params.id,
        tenantId: authReq.tenantId
      },
      data: {
        name,
        unit,
        quantity,
        threshold,
        supplier,
        costPrice,
        sellingPrice,
        isActive
      }
    });

    res.json({ item });
  } catch (error) {
    next(error);
  }
});

// Get low stock items
router.get('/alerts/low-stock', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    const items = await prisma.inventoryItem.findMany({
      where: {
        tenantId: authReq.tenantId,
        isActive: true
      }
    });
    
    const lowStockItems = items.filter(item => item.quantity <= item.threshold);
    
    res.json({ items: lowStockItems });
  } catch (error) {
    next(error);
  }
});

// Generate purchase order
router.post('/purchase-order', authenticate, authorize('owner', 'admin'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    const items = await prisma.inventoryItem.findMany({
      where: {
        tenantId: authReq.tenantId,
        isActive: true
      }
    });
    
    const lowStockItems = items.filter(item => item.quantity <= item.threshold);
    
    // In production, generate PDF using pdf-lib
    const poData = {
      items: lowStockItems.map(item => ({
        name: item.name,
        currentQuantity: item.quantity,
        threshold: item.threshold,
        supplier: item.supplier,
        unit: item.unit
      })),
      generatedAt: new Date().toISOString()
    };
    
    res.json({ purchaseOrder: poData });
  } catch (error) {
    next(error);
  }
});

export default router;

