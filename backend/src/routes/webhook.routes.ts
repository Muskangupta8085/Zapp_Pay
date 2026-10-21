import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller.js';

const router = Router();

// Public webhook receiver endpoint
router.post('/payment', WebhookController.handlePaymentWebhook);

export default router;
