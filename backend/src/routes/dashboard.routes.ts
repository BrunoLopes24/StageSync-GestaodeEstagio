import { Router } from 'express';
import * as controller from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireStudent } from '../middleware/require-student';

const router = Router();

router.use(authMiddleware);
router.use(requireStudent);

router.get('/stats', controller.getStats);

export default router;
