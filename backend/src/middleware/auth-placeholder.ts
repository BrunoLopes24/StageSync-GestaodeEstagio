import { Request, Response, NextFunction } from 'express';

/**
 * Temporary placeholder – mirrors the real authMiddleware request shape
 * so that route handlers work the same way in both dev and production.
 * Replace with authMiddleware when ready.
 */
export function authPlaceholder(req: Request, _res: Response, next: NextFunction) {
  req.userId = 'default';
  req.userRole = 'STUDENT';
  req.studentNumber = '00000';
  req.userEmail = 'placeholder@example.com';
  req.sessionId = 'placeholder-session';
  next();
}
