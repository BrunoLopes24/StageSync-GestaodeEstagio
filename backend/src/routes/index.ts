import { Router } from 'express';
import workLogsRoutes from './work-logs.routes';
import settingsRoutes from './settings.routes';
import holidaysRoutes from './holidays.routes';
import dashboardRoutes from './dashboard.routes';
import reportsRoutes from './reports.routes';

const router = Router();

router.use('/work-logs', workLogsRoutes);
router.use('/settings', settingsRoutes);
router.use('/holidays', holidaysRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportsRoutes);

export default router;
