import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

export function authPlaceholder(req: Request, _res: Response, next: NextFunction) {
  req.user = { id: 'default' };
  next();
}
