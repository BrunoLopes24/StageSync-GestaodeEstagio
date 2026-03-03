import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler';

export function requireStudent(req: Request, _res: Response, next: NextFunction) {
  if (req.userRole !== 'STUDENT') {
    throw new AppError(403, 'Student access required');
  }
  next();
}
