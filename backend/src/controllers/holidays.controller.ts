import { Request, Response, NextFunction } from 'express';
import * as holidayService from '../services/holiday.service';
import { AppError } from '../middleware/error-handler';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const year = req.query.year
      ? parseInt(req.query.year as string, 10)
      : new Date().getFullYear();
    const holidays = await holidayService.getHolidays(year);
    res.json(holidays);
  } catch (err) {
    next(err);
  }
}

export async function generate(req: Request, res: Response, next: NextFunction) {
  try {
    const year = parseInt(String(req.params.year), 10);
    if (isNaN(year) || year < 2000 || year > 2100) {
      throw new AppError(400, 'Invalid year');
    }
    const holidays = await holidayService.generateHolidays(year);
    res.json(holidays);
  } catch (err) {
    next(err);
  }
}

export async function addCustom(req: Request, res: Response, next: NextFunction) {
  try {
    const holiday = await holidayService.addCustomHoliday(req.body);
    res.status(201).json(holiday);
  } catch (err: any) {
    if (err.code === 'P2002') {
      next(new AppError(409, 'A holiday already exists for this date'));
    } else {
      next(err);
    }
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await holidayService.deleteHoliday(String(req.params.id));
    res.status(204).end();
  } catch (err: any) {
    if (err.code === 'P2025') {
      next(new AppError(404, 'Holiday not found'));
    } else {
      next(err);
    }
  }
}
