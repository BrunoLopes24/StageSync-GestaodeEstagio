import { Request, Response, NextFunction } from 'express';
import * as workLogService from '../services/work-log.service';
import { AppError } from '../middleware/error-handler';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    };
    const result = await workLogService.getWorkLogs(filters, req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const log = await workLogService.getWorkLogById(String(req.params.id), req.userId!);
    if (!log) throw new AppError(404, 'Work log not found');
    res.json(log);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const log = await workLogService.createWorkLog(req.body, req.userId!);
    res.status(201).json(log);
  } catch (err: any) {
    if (err.code === 'P2002') {
      next(new AppError(409, 'A work log already exists for this date'));
    } else {
      next(err);
    }
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const log = await workLogService.updateWorkLog(String(req.params.id), req.body, req.userId!);
    res.json(log);
  } catch (err: any) {
    if (err.code === 'P2025') {
      next(new AppError(404, 'Work log not found'));
    } else if (err.code === 'P2002') {
      next(new AppError(409, 'A work log already exists for this date'));
    } else {
      next(err);
    }
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await workLogService.deleteWorkLog(String(req.params.id), req.userId!);
    res.status(204).end();
  } catch (err: any) {
    if (err.code === 'P2025') {
      next(new AppError(404, 'Work log not found'));
    } else {
      next(err);
    }
  }
}

export async function exportCsv(req: Request, res: Response, next: NextFunction) {
  try {
    const csv = await workLogService.exportWorkLogsCsv(req.userId!);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="work-logs-backup.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

export async function importCsv(req: Request, res: Response, next: NextFunction) {
  try {
    let content = '';

    // multipart/form-data: file uploaded via multer
    if (req.file) {
      content = req.file.buffer.toString('utf-8');
    } else if (typeof req.body === 'string') {
      // text/csv or text/plain: raw body
      content = req.body;
    }

    if (!content.trim()) throw new AppError(400, 'CSV content is required');
    const result = await workLogService.importWorkLogsCsv(content, req.userId!);
    res.json(result);
  } catch (err: any) {
    if (err instanceof AppError) return next(err);
    console.error('CSV import error:', err);
    next(new AppError(400, err.message || 'Failed to import CSV'));
  }
}
