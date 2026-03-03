import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler';

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.userRole !== 'ADMIN') {
    throw new AppError(403, 'Admin access required');
  }
  next();
}
