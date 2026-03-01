import { Request, Response, NextFunction } from 'express';
import * as reportService from '../services/report.service';
import { AppError } from '../middleware/error-handler';

export async function weekly(req: Request, res: Response, next: NextFunction) {
  try {
    const date = req.query.date as string;
    if (!date) throw new AppError(400, 'date query parameter is required');
    const summary = await reportService.getWeeklySummary(date);
    res.json(summary);
  } catch (err) {
    next(err);
  }
}

export async function monthly(req: Request, res: Response, next: NextFunction) {
  try {
    const month = req.query.month as string;
    if (!month) throw new AppError(400, 'month query parameter is required (YYYY-MM)');
    const summary = await reportService.getMonthlySummary(month);
    res.json(summary);
  } catch (err) {
    next(err);
  }
}

export async function midtermPdf(_req: Request, res: Response, next: NextFunction) {
  try {
    const pdf = await reportService.generateMidtermReportPdf();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="midterm-report.pdf"');
    res.send(pdf);
  } catch (err) {
    next(err);
  }
}
