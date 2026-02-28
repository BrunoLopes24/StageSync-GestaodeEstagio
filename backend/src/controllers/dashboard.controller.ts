import { Request, Response, NextFunction } from 'express';
import { calculateDashboardStats } from '../services/time-engine.service';

export async function getStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await calculateDashboardStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}
