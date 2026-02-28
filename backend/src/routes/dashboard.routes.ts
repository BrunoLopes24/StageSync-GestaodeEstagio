import { Router } from 'express';
import * as controller from '../controllers/dashboard.controller';
import { authPlaceholder } from '../middleware/auth-placeholder';

const router = Router();

router.use(authPlaceholder);

router.get('/stats', controller.getStats);

export default router;
