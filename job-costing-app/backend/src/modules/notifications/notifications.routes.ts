import { Router } from 'express';
import notificationsController from './notifications.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('notifications:read'), notificationsController.getNotifications.bind(notificationsController));
router.patch('/:id/read', requirePermission('notifications:read'), notificationsController.markAsRead.bind(notificationsController));
router.patch('/read-all', requirePermission('notifications:read'), notificationsController.markAllAsRead.bind(notificationsController));
router.delete('/:id', requirePermission('notifications:write'), notificationsController.deleteNotification.bind(notificationsController));

export default router;