import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import walletRoutes from './wallet.routes.js';
import transactionRoutes from './transaction.routes.js';
import kycRoutes from './kyc.routes.js';
import marketRoutes from './market.routes.js';
import adminRoutes from './admin.routes.js';
import homeRoutes from './home.routes.js';
import notificationRoutes from './notification.routes.js';
import ordersRoutes from './orders.routes.js';
import rewardsRoutes from './rewards.routes.js';
import teamRoutes from './team.routes.js';
import appRoutes from './app.routes.js';
import webhookRoutes from './webhook.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/users', userRoutes);
router.use('/wallet', walletRoutes);
router.use('/wallets', walletRoutes);
router.use('/transactions', transactionRoutes);
router.use('/kyc', kycRoutes);
router.use('/market', marketRoutes);
router.use('/admin', adminRoutes);
router.use('/webhooks', webhookRoutes);

// New Screen Endpoints
router.use('/home', homeRoutes);
router.use('/notifications', notificationRoutes);
router.use('/orders', ordersRoutes);
router.use('/rewards', rewardsRoutes);
router.use('/team', teamRoutes);
router.use('/app', appRoutes);

export default router;
