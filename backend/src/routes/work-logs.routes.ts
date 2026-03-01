import { Router } from 'express';
import express from 'express';
import * as controller from '../controllers/work-logs.controller';
import { validate } from '../middleware/validate';
import { createWorkLogSchema, updateWorkLogSchema } from '../schemas/work-log.schema';
import { authPlaceholder } from '../middleware/auth-placeholder';

const router = Router();

router.use(authPlaceholder);

router.get('/', controller.list);
router.get('/export-csv', controller.exportCsv);
router.post('/import-csv', express.text({ type: ['text/csv', 'text/plain', 'application/csv'] }), controller.importCsv);
router.get('/:id', controller.getById);
router.post('/', validate(createWorkLogSchema), controller.create);
router.put('/:id', validate(updateWorkLogSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;
