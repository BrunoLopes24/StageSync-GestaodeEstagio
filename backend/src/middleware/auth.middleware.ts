import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from './error-handler';
import { prisma } from '../lib/prisma';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      studentNumber?: string;
      userEmail?: string;
      sessionId?: string;
    }
  }
}

interface AccessTokenPayload {
  sub: string;
  role: string;
  studentNumber: string;
  email: string;
  iat: number;
  exp: number;
}

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError(401, 'Authentication required');
    }

    const decoded = jwt.verify(token, config.jwtAccessSecret) as AccessTokenPayload;

    const activeSession = await prisma.session.findFirst({
      where: {
        userId: decoded.sub,
        expiresAt: { gt: new Date() },
      },
    });

    if (!activeSession) {
      throw new AppError(401, 'Session expired');
    }

    req.userId = decoded.sub;
    req.userRole = decoded.role;
    req.studentNumber = decoded.studentNumber;
    req.userEmail = decoded.email;
    req.sessionId = activeSession.id;

    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
    } else if (err instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'Invalid token'));
    } else if (err instanceof jwt.TokenExpiredError) {
      next(new AppError(401, 'Token expired'));
    } else {
      next(err);
    }
  }
}
