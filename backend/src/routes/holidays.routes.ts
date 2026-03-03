import { Router } from 'express';
import * as controller from '../controllers/holidays.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireStudent } from '../middleware/require-student';

const router = Router();

router.use(authMiddleware);
router.use(requireStudent);

router.get('/', controller.list);
router.post('/generate/:year', controller.generate);
router.post('/', controller.addCustom);
router.delete('/:id', controller.remove);

export default router;
