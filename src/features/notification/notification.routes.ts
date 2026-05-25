import { Router } from 'express';
import * as notificationController from './notification.controller';
import { authenticate } from '@/middleware/auth';

const router = Router();

router.get('/', authenticate, notificationController.getNotifications);
router.post('/:id/read', authenticate, notificationController.markAsRead);
router.post('/read-all', authenticate, notificationController.markAllAsRead);
router.delete('/:id', authenticate, notificationController.deleteNotification);

export default router;
