import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  adminLoginSchema,
  quickUserSchema,
  quickDepositSchema,
  quickWithdrawalSchema,
} from '../validations/admin.validation.js';

const router = Router();

// ==========================================
// 1. PUBLIC ADMIN AUTH ROUTE
// ==========================================
router.post('/auth/login', validate(adminLoginSchema), AdminController.login);

// ==========================================
// 2. PROTECTED ADMIN ROUTES
// ==========================================
router.use(authenticate, authorizeRoles('admin', 'superadmin', 'moderator'));

// Session Verification & Profile Management
router.get('/auth/me', AdminController.me);
router.patch('/profile', AdminController.updateProfile);

// Dashboard Metrics & Charts
router.get('/dashboard/stats', AdminController.getDashboardStats);
router.get('/dashboard/charts', AdminController.getDashboardCharts);
router.get('/dashboard/activities', AdminController.getRecentActivities);
router.get('/dashboard/recent-transactions', AdminController.getRecentTransactions);

// Dashboard Quick Actions
router.post('/dashboard/quick-user', validate(quickUserSchema), AdminController.quickCreateUser);
router.post('/dashboard/quick-deposit', validate(quickDepositSchema), AdminController.quickApproveDeposit);
router.post('/dashboard/quick-withdrawal', validate(quickWithdrawalSchema), AdminController.quickAuthorizeWithdrawal);

// Legacy/Compatibility Overview
router.get('/overview', AdminController.getDashboardStats);

// User & KYC Operations
router.get('/users', AdminController.listUsers);
router.get('/kyc', AdminController.listKycRequests);
router.patch('/kyc/:id/review', AdminController.reviewKyc);

// Transactions & Orders
router.get('/transactions', AdminController.listAllTransactions);
router.patch('/transactions/:id/status', AdminController.updateTransactionStatus);
router.get('/orders', AdminController.listOrders);


// Treasury Vaults & Reserves
router.get('/treasury/vaults', AdminController.getTreasuryVaults);

// xCoin Market & Engine
router.get('/market/xcoin', AdminController.getXCoinMarketData);
router.patch('/market/xcoin', AdminController.updateXCoinSettings);

// Team & Referrals
router.get('/team/referrals', AdminController.getTeamReferralsData);
router.post('/team/referrals/bonus', AdminController.creditReferralReward);

// Rewards & Engagement Hub
router.get('/rewards', AdminController.getRewardsOverview);
router.put('/rewards/streak', AdminController.updateStreakConfig);
router.post('/rewards/tasks', AdminController.addBountyTask);
router.patch('/rewards/tasks/:id/toggle', AdminController.toggleBountyTask);
router.delete('/rewards/tasks/:id', AdminController.deleteBountyTask);
router.post('/rewards/airdrop', AdminController.airdropReward);

// Notifications & Broadcasts
router.get('/notifications', AdminController.listNotifications);
router.post('/notifications', AdminController.sendNotification);
router.delete('/notifications/:id', AdminController.deleteNotification);

export default router;



