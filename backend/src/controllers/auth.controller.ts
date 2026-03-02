import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { LoginInput, RefreshInput, LogoutInput } from '../schemas/auth.schema';
import { auditLog } from '../utils/audit-logger';

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { identifier, password } = req.body as LoginInput;

    const context = {
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
    };

    const { tokens, isNewAccount, user } = await authService.login(identifier, password, context);

    res.status(200).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
      isNewAccount,
      user,
    });
  } catch (err) {
    next(err);
  }
}

export async function refreshHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body as RefreshInput;

    const context = {
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
    };

    const tokens = await authService.refreshTokens(refreshToken, context);

    auditLog('TOKEN_REFRESH', { ip: context.ip });

    res.status(200).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });
  } catch (err) {
    auditLog('TOKEN_REFRESH_FAILED', {
      ip: req.ip || 'unknown',
      reason: err instanceof Error ? err.message : 'unknown',
    });
    next(err);
  }
}

export async function logoutHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body as LogoutInput;

    await authService.logout(refreshToken);

    auditLog('LOGOUT', {
      ip: req.ip || req.socket.remoteAddress || 'unknown',
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}
