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
// 2. PROTECTED ADMIN BASE (admin, superadmin, moderator)
// ==========================================
router.use(authenticate, authorizeRoles('admin', 'superadmin', 'moderator'));

// Session Verification & Profile Management
router.get('/auth/me', AdminController.me);
router.patch('/profile', AdminController.updateProfile);

// Dashboard Metrics & Charts (Read-only for all staff)
router.get('/dashboard/stats', AdminController.getDashboardStats);
router.get('/dashboard/charts', AdminController.getDashboardCharts);
router.get('/dashboard/activities', AdminController.getRecentActivities);
router.get('/dashboard/recent-transactions', AdminController.getRecentTransactions);
router.get('/overview', AdminController.getDashboardStats);

// User & KYC Operations
router.get('/users', AdminController.listUsers);
router.get('/kyc', AdminController.listKycRequests);
router.patch('/kyc/:id/review', AdminController.reviewKyc);

// Transactions & Orders (Read-only)
router.get('/transactions', AdminController.listAllTransactions);
router.get('/orders', AdminController.listOrders);
router.get('/treasury/vaults', AdminController.getTreasuryVaults);
router.get('/team/referrals', AdminController.getTeamReferralsData);
router.get('/rewards', AdminController.getRewardsOverview);
router.get('/market/xcoin', AdminController.getXCoinMarketData);
router.get('/notifications', AdminController.listNotifications);
router.get('/audit-logs', AdminController.getAuditLogs);

// ==========================================
// 3. FINANCIAL MUTATIONS & PRIVILEGED ACTIONS (admin, superadmin ONLY)
// ==========================================
router.post(
  '/dashboard/quick-user',
  authorizeRoles('admin', 'superadmin'),
  validate(quickUserSchema),
  AdminController.quickCreateUser
);
router.post(
  '/dashboard/quick-deposit',
  authorizeRoles('admin', 'superadmin'),
  validate(quickDepositSchema),
  AdminController.quickApproveDeposit
);
router.post(
  '/dashboard/quick-withdrawal',
  authorizeRoles('admin', 'superadmin'),
  validate(quickWithdrawalSchema),
  AdminController.quickAuthorizeWithdrawal
);
router.patch(
  '/transactions/:id/status',
  authorizeRoles('admin', 'superadmin'),
  AdminController.updateTransactionStatus
);
router.post(
  '/team/referrals/bonus',
  authorizeRoles('admin', 'superadmin'),
  AdminController.creditReferralReward
);
router.post(
  '/rewards/tasks',
  authorizeRoles('admin', 'superadmin'),
  AdminController.addBountyTask
);
router.patch(
  '/rewards/tasks/:id/toggle',
  authorizeRoles('admin', 'superadmin'),
  AdminController.toggleBountyTask
);
router.delete(
  '/rewards/tasks/:id',
  authorizeRoles('admin', 'superadmin'),
  AdminController.deleteBountyTask
);
router.post(
  '/notifications',
  authorizeRoles('admin', 'superadmin'),
  AdminController.sendNotification
);
router.delete(
  '/notifications/:id',
  authorizeRoles('admin', 'superadmin'),
  AdminController.deleteNotification
);

// ==========================================
// 4. CRITICAL SYSTEM SETTINGS (superadmin ONLY)
// ==========================================
router.patch(
  '/market/xcoin',
  authorizeRoles('superadmin'),
  AdminController.updateXCoinSettings
);
router.put(
  '/rewards/streak',
  authorizeRoles('superadmin'),
  AdminController.updateStreakConfig
);
router.post(
  '/rewards/airdrop',
  authorizeRoles('superadmin'),
  AdminController.airdropReward
);

export default router;
