import { Router } from 'express';
import { OrdersController } from '../controllers/orders.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { enforceIdempotency } from '../middleware/idempotency.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', OrdersController.getOrders);
router.post('/buy', enforceIdempotency(), OrdersController.executeBuy);
router.post('/sell', enforceIdempotency(), OrdersController.executeSell);
router.post('/export', OrdersController.exportOrders);
router.get('/:id', OrdersController.getOrderDetails);
router.post('/:id/cancel', OrdersController.cancelOrder);

export default router;
