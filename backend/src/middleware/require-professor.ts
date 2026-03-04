import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from './error-handler';

export function assertProfessorOwnsStudent(req: Request, studentId: string): void {
  if (!req.supervisedStudentIds?.includes(studentId)) {
    throw new AppError(403, 'You do not have access to this student');
  }
}

export async function requireProfessor(req: Request, _res: Response, next: NextFunction) {
  try {
    if (req.userRole !== 'PROFESSOR') {
      throw new AppError(403, 'Professor access required');
    }

    // Always reload active links from DB — no caching
    const links = await prisma.professorStudentLink.findMany({
      where: { professorId: req.userId!, isActive: true },
      select: { studentId: true },
    });

    if (links.length === 0) {
      throw new AppError(403, 'No active supervision links');
    }

    req.supervisedStudentIds = links.map((l) => l.studentId);
    next();
  } catch (err) {
    next(err);
  }
}
