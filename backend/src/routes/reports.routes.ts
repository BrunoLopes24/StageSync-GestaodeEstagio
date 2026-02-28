import { Router } from 'express';
import * as controller from '../controllers/reports.controller';
import { authPlaceholder } from '../middleware/auth-placeholder';

const router = Router();

router.use(authPlaceholder);

router.get('/weekly', controller.weekly);
router.get('/monthly', controller.monthly);

export default router;
