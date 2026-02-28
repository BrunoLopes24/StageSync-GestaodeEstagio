import { Request, Response, NextFunction } from 'express';
import * as settingsService from '../services/settings.service';

export async function get(_req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.getSettings();
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await settingsService.updateSettings(req.body);
    res.json(settings);
  } catch (err) {
    next(err);
  }
}
