import { Request, Response, NextFunction } from 'express';
import { assertProfessorOwnsStudent } from '../middleware/require-professor';
import { AppError } from '../middleware/error-handler';
import { auditLog } from '../utils/audit-logger';
import * as professorService from '../services/professor.service';

// ─── Student endpoints: manage professor access ─────────

export async function generateCode(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await professorService.generateAccessCode(req.userId!);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getCodeStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const status = await professorService.getActiveCodeStatus(req.userId!);
    res.json(status);
  } catch (err) {
    next(err);
  }
}

export async function revokeCode(req: Request, res: Response, next: NextFunction) {
  try {
    throw new AppError(403, 'Revogar código de acesso não é permitido');
  } catch (err) {
    next(err);
  }
}

export async function getLink(req: Request, res: Response, next: NextFunction) {
  try {
    const link = await professorService.getLinkedProfessor(req.userId!);
    res.json(link);
  } catch (err) {
    next(err);
  }
}

export async function revokeLink(req: Request, res: Response, next: NextFunction) {
  try {
    await professorService.revokeLink(req.userId!);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// ─── Professor endpoints: read-only student data ────────

export async function listStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const students = await professorService.getSupervisedStudents(req.userId!);
    res.json(students);
  } catch (err) {
    next(err);
  }
}

export async function aggregatedDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await professorService.getAggregatedDashboard(req.userId!);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function studentDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.params.studentId as string;
    assertProfessorOwnsStudent(req, studentId);

    auditLog('PROFESSOR_VIEW_DASHBOARD', {
      userId: req.userId,
      targetId: studentId,
    });

    const data = await professorService.getStudentDashboard(studentId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function studentWorkLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.params.studentId as string;
    assertProfessorOwnsStudent(req, studentId);

    auditLog('PROFESSOR_VIEW_LOGS', {
      userId: req.userId,
      targetId: studentId,
    });

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const data = await professorService.getStudentWorkLogs(studentId, { page, limit });
    res.json(data);
  } catch (err) {
    next(err);
  }
}
