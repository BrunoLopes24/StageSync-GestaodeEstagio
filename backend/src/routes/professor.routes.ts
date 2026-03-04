import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireStudent } from '../middleware/require-student';
import { requireProfessor } from '../middleware/require-professor';
import { professorLoginRateLimiter } from '../middleware/rate-limiter';
import { validate } from '../middleware/validate';
import { professorLoginSchema } from '../schemas/professor.schema';
import { professorLoginHandler } from '../controllers/professor-auth.controller';
import * as professorController from '../controllers/professor.controller';

const router = Router();

// ─── Professor login (public, rate-limited) ─────────────
router.post(
  '/login',
  professorLoginRateLimiter,
  validate(professorLoginSchema),
  professorLoginHandler,
);

// ─── Student: manage professor access code ──────────────
router.get('/access-code', authMiddleware, requireStudent, professorController.getCodeStatus);
router.post('/access-code', authMiddleware, requireStudent, professorController.generateCode);
router.delete('/access-code', authMiddleware, requireStudent, professorController.revokeCode);

// ─── Student: manage supervision link ───────────────────
router.get('/link', authMiddleware, requireStudent, professorController.getLink);
router.delete('/link', authMiddleware, requireStudent, professorController.revokeLink);

// ─── Professor: read-only student data ──────────────────
router.get('/students', authMiddleware, requireProfessor, professorController.listStudents);
router.get('/dashboard', authMiddleware, requireProfessor, professorController.aggregatedDashboard);
router.get('/dashboard/:studentId', authMiddleware, requireProfessor, professorController.studentDashboard);
router.get('/work-logs/:studentId', authMiddleware, requireProfessor, professorController.studentWorkLogs);

export default router;
