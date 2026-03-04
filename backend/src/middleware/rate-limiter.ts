import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { AppError } from './error-handler';

export const professorLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req: Request) => {
    const email = req.body?.email || 'unknown';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `prof:${email}:${ip}`;
  },

  handler: (_req, _res, next) => {
    next(new AppError(429, 'Too many login attempts. Please try again later.'));
  },
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req: Request) => {
    const identifier = req.body?.identifier || 'unknown';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `${identifier}:${ip}`;
  },

  handler: (_req, _res, next) => {
    next(new AppError(429, 'Too many login attempts. Please try again later.'));
  },
});
