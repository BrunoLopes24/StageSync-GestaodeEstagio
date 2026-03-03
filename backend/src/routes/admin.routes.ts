import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/require-admin';
import { requireFeature } from '../utils/feature-flags';
import * as adminController from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authMiddleware);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', requireFeature('view_students'), adminController.dashboard);

// Students
router.get('/students', requireFeature('view_students'), adminController.listStudents);

// Work Logs
router.get('/work-logs', requireFeature('view_logs'), adminController.listWorkLogs);
router.patch('/work-logs/:id/approve', requireFeature('approve_logs'), adminController.approveWorkLog);
router.patch('/work-logs/:id/reject', requireFeature('approve_logs'), adminController.rejectWorkLog);

// Sessions
router.get('/sessions', requireFeature('session_management'), adminController.listSessions);
router.delete('/sessions/:id', requireFeature('session_management'), adminController.revokeSession);

export default router;
