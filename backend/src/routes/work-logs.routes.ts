import { Router } from 'express';
import express from 'express';
import multer from 'multer';
import * as controller from '../controllers/work-logs.controller';
import { validate } from '../middleware/validate';
import { createWorkLogSchema, updateWorkLogSchema } from '../schemas/work-log.schema';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireStudent } from '../middleware/require-student';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authMiddleware);
router.use(requireStudent);

router.get('/', controller.list);
router.get('/export-csv', controller.exportCsv);
router.post(
  '/import-csv',
  upload.single('file'),
  express.text({ type: ['text/csv', 'text/plain', 'application/csv'] }),
  controller.importCsv,
);
router.get('/:id', controller.getById);
router.post('/', validate(createWorkLogSchema), controller.create);
router.put('/:id', validate(updateWorkLogSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;
