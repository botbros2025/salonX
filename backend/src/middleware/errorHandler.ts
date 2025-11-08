import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types/index.js';

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation error',
      details: err.message
    });
    return;
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      res.status(409).json({
        error: 'Duplicate entry',
        details: 'A record with this information already exists'
      });
      return;
    }
    if (prismaError.code === 'P2025') {
      res.status(404).json({
        error: 'Record not found'
      });
      return;
    }
  }

  const status = (err as ApiError).status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

