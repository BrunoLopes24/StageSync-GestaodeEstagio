import { Router } from 'express';
import * as controller from '../controllers/work-logs.controller';
import { validate } from '../middleware/validate';
import { createWorkLogSchema, updateWorkLogSchema } from '../schemas/work-log.schema';
import { authPlaceholder } from '../middleware/auth-placeholder';

const router = Router();

router.use(authPlaceholder);

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', validate(createWorkLogSchema), controller.create);
router.put('/:id', validate(updateWorkLogSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;
