import { Request, Response, NextFunction } from 'express';
import { calculateDashboardStats } from '../services/time-engine.service';

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await calculateDashboardStats(req.userId!);
    res.json(stats);
  } catch (err) {
    next(err);
  }
}
