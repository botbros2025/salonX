import { UserWithRelations } from './index.js';

declare global {
  namespace Express {
    interface Request {
      user?: UserWithRelations;
      tenantId?: string;
    }
  }
}

export {};

