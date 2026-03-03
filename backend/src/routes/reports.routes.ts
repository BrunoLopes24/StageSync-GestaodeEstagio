import { Router } from 'express';
import * as controller from '../controllers/reports.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireStudent } from '../middleware/require-student';

const router = Router();

router.use(authMiddleware);
router.use(requireStudent);

router.get('/weekly', controller.weekly);
router.get('/monthly', controller.monthly);
router.get('/midterm-pdf', controller.midtermPdf);

export default router;
