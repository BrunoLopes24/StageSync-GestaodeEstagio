import { Router } from 'express';
import * as controller from '../controllers/holidays.controller';
import { authPlaceholder } from '../middleware/auth-placeholder';

const router = Router();

router.use(authPlaceholder);

router.get('/', controller.list);
router.post('/generate/:year', controller.generate);
router.post('/', controller.addCustom);
router.delete('/:id', controller.remove);

export default router;
