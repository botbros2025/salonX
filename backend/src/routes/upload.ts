import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Upload salon logo
router.post(
  '/tenant/logo',
  authenticate,
  authorize('owner', 'admin'),
  upload.single('logo'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }
      
      const fileUrl = `/uploads/${req.file.filename}`;
      
      const tenant = await prisma.tenant.update({
        where: { id: authReq.tenantId },
        data: { logo: fileUrl },
      });
      
      res.json({ tenant, logoUrl: fileUrl });
    } catch (error) {
      next(error);
    }
  }
);

// Upload client photo
router.post(
  '/client/:clientId/photo',
  authenticate,
  upload.single('photo'),
  async (req: Request<{ clientId: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }
      
      const fileUrl = `/uploads/${req.file.filename}`;
      
      // In production, add photoUrl field to Client model
      // For now, store in notes or create a separate table
      const client = await prisma.client.update({
        where: {
          id: req.params.clientId,
          tenantId: authReq.tenantId,
        },
        data: {
          notes: `Photo: ${fileUrl}`, // Temporary solution
        },
      });
      
      res.json({ client, photoUrl: fileUrl });
    } catch (error) {
      next(error);
    }
  }
);

// Upload service image
router.post(
  '/service/:serviceId/image',
  authenticate,
  authorize('owner', 'admin'),
  upload.single('image'),
  async (req: Request<{ serviceId: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }
      
      const fileUrl = `/uploads/${req.file.filename}`;
      
      // In production, add imageUrl field to Service model
      const service = await prisma.service.update({
        where: {
          id: req.params.serviceId,
          tenantId: authReq.tenantId,
        },
        data: {
          description: `${req.body.description || ''}\n[Image: ${fileUrl}]`, // Temporary
        },
      });
      
      res.json({ service, imageUrl: fileUrl });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

