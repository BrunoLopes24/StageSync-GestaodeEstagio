import { Request, Response, NextFunction } from 'express';
import { professorLogin } from '../services/professor-access.service';

export async function professorLoginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, code } = req.body;
    const context = {
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
    };

    const result = await professorLogin(email, code, context);

    res.status(200).json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: {
        id: result.professorId,
        role: 'PROFESSOR',
      },
    });
  } catch (err) {
    next(err);
  }
}
