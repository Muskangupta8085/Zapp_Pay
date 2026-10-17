import { Router } from 'express';
import { HomeController } from '../controllers/home.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', HomeController.getNotifications);
router.patch('/read-all', HomeController.markAllNotificationsRead);
router.post('/read-all', HomeController.markAllNotificationsRead);
router.patch('/:id/read', HomeController.markNotificationRead);

export default router;
