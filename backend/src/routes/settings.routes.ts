import { Router } from 'express';
import * as controller from '../controllers/settings.controller';
import { validate } from '../middleware/validate';
import { updateSettingsSchema } from '../schemas/settings.schema';
import { authPlaceholder } from '../middleware/auth-placeholder';

const router = Router();

router.use(authPlaceholder);

router.get('/', controller.get);
router.put('/', validate(updateSettingsSchema), controller.update);

export default router;
