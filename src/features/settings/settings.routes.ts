import { Router } from 'express';
import * as settingsController from './settings.controller';
import { authenticate } from '@/middleware/auth';

const router = Router();

router.get('/', authenticate, settingsController.getSettings);
router.put('/notifications', authenticate, settingsController.updateNotificationPreferences);
router.put('/appearance', authenticate, settingsController.updateAppearanceSettings);
router.post('/logout-all', authenticate, settingsController.logoutAllSessions);

export default router;
