import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';

// Middleware to ensure tenant data isolation
export const tenantIsolation = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.tenantId) {
    res.status(403).json({ error: 'Tenant context required' });
    return;
  }
  next();
};

// Helper to add tenant filter to Prisma queries
export const withTenant = (tenantId: string): { tenantId: string } => ({
  tenantId
});

