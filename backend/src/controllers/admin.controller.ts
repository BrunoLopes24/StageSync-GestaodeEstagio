import { Request, Response, NextFunction } from 'express';
import * as adminService from '../services/admin.service';
import { auditLog } from '../utils/audit-logger';
import { AppError } from '../middleware/error-handler';

export async function dashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await adminService.getAdminDashboard();
    auditLog('ADMIN_VIEW_DASHBOARD', { userId: req.userId });
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

export async function listStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const active = req.query.active !== undefined
      ? req.query.active === 'true'
      : undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const result = await adminService.listStudents({ active, page, limit });
    auditLog('ADMIN_LIST_STUDENTS', { userId: req.userId });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listWorkLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string | undefined;
    const userId = req.query.userId as string | undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const result = await adminService.listAllWorkLogs({ status, userId, page, limit });
    auditLog('ADMIN_VIEW_LOGS', { userId: req.userId });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function approveWorkLog(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const log = await adminService.approveWorkLog(id);
    auditLog('ADMIN_APPROVE_LOG', { userId: req.userId, targetId: id });
    res.json(log);
  } catch (err: any) {
    if (err.code === 'P2025') {
      next(new AppError(404, 'Work log not found'));
    } else {
      next(err);
    }
  }
}

export async function rejectWorkLog(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const reason = req.body?.reason ? String(req.body.reason) : undefined;
    const log = await adminService.rejectWorkLog(id, reason);
    auditLog('ADMIN_REJECT_LOG', {
      userId: req.userId,
      targetId: id,
      details: reason,
    });
    res.json(log);
  } catch (err: any) {
    if (err.code === 'P2025') {
      next(new AppError(404, 'Work log not found'));
    } else {
      next(err);
    }
  }
}

export async function listSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const sessions = await adminService.listActiveSessions();
    auditLog('ADMIN_VIEW_SESSIONS', { userId: req.userId });
    res.json(sessions);
  } catch (err) {
    next(err);
  }
}

export async function revokeSession(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    await adminService.revokeSession(id);
    auditLog('ADMIN_REVOKE_SESSION', { userId: req.userId, targetId: id });
    res.status(204).end();
  } catch (err: any) {
    if (err.code === 'P2025') {
      next(new AppError(404, 'Session not found'));
    } else {
      next(err);
    }
  }
}
