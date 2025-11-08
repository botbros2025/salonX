import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = express.Router();
const prisma = new PrismaClient();

interface CreateFeedbackRequest {
  clientId: string;
  appointmentId?: string;
  staffId?: string;
  rating: number;
  comment?: string;
  isPublic?: boolean;
}

// Get all feedback
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { staffId, minRating, startDate, endDate } = req.query;
    
    const where: any = {
      tenantId: authReq.tenantId
    };
    
    if (staffId) where.staffId = staffId;
    if (minRating) where.rating = { gte: parseInt(minRating as string) };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }
    
    const feedbacks = await prisma.feedback.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ feedbacks });
  } catch (error) {
    next(error);
  }
});

// Get single feedback
router.get('/:id', authenticate, async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    const feedback = await prisma.feedback.findFirst({
      where: {
        id: req.params.id,
        tenantId: authReq.tenantId
      },
      include: {
        client: true
      }
    });

    if (!feedback) {
      res.status(404).json({ error: 'Feedback not found' });
      return;
    }

    res.json({ feedback });
  } catch (error) {
    next(error);
  }
});

// Create feedback
router.post('/', authenticate, async (req: Request<{}, {}, CreateFeedbackRequest>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { clientId, appointmentId, staffId, rating, comment, isPublic = false } = req.body;
    
    if (rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5' });
      return;
    }
    
    const feedback = await prisma.feedback.create({
      data: {
        tenantId: authReq.tenantId,
        clientId,
        appointmentId,
        staffId,
        rating,
        comment,
        isPublic
      },
      include: {
        client: true
      }
    });
    
    // Update staff average rating if staffId provided
    if (staffId) {
      const staffPerformance = await prisma.staffPerformance.findUnique({
        where: { staffId }
      });
      
      if (staffPerformance) {
        const newTotalRatings = staffPerformance.totalRatings + 1;
        const newAverageRating = 
          (staffPerformance.averageRating * staffPerformance.totalRatings + rating) / newTotalRatings;
        
        await prisma.staffPerformance.update({
          where: { staffId },
          data: {
            totalRatings: newTotalRatings,
            averageRating: newAverageRating
          }
        });
      }
    }
    
    res.status(201).json({ feedback });
  } catch (error) {
    next(error);
  }
});

// Update feedback
router.put('/:id', authenticate, async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { rating, comment, isPublic } = req.body;
    
    const feedback = await prisma.feedback.update({
      where: {
        id: req.params.id,
        tenantId: authReq.tenantId
      },
      data: {
        rating,
        comment,
        isPublic
      }
    });

    res.json({ feedback });
  } catch (error) {
    next(error);
  }
});

export default router;

