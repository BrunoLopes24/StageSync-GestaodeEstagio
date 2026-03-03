import { Router } from 'express';
import * as controller from '../controllers/settings.controller';
import { validate } from '../middleware/validate';
import { updateSettingsSchema } from '../schemas/settings.schema';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireStudent } from '../middleware/require-student';

const router = Router();

router.use(authMiddleware);
router.use(requireStudent);

router.get('/', controller.get);
router.put('/', validate(updateSettingsSchema), controller.update);

export default router;
