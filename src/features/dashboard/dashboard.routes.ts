import { Router } from 'express';
import * as dashboardController from './dashboard.controller';
import { authenticate } from '@/middleware/auth';

const router = Router();

router.get('/stats', authenticate, dashboardController.getStats);
router.get('/full', authenticate, dashboardController.getFullDashboard);

export default router;
