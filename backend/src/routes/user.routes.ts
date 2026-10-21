import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { ProfileController } from '../controllers/profile.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { pinRateLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.use(authenticate);

// Profile Information
router.patch('/profile', UserController.updateProfile);
router.get('/referrals', UserController.getReferrals);

// Bank & UPI Settlement Accounts
router.get('/bank-accounts', ProfileController.getBankAccounts);
router.post('/bank-accounts', ProfileController.addBankAccount);
router.patch('/bank-accounts/:id/default', ProfileController.setDefaultBankAccount);
router.delete('/bank-accounts/:id', ProfileController.deleteBankAccount);

// Security & Transaction PIN (Protected with pinRateLimiter)
router.post('/pin/request-otp', pinRateLimiter, ProfileController.requestPinResetOtp);
router.post('/pin/set', ProfileController.setTransactionPin);
router.post('/pin/verify', pinRateLimiter, ProfileController.verifyTransactionPin);
router.patch('/security-preferences', ProfileController.updateSecurityPreferences);

// Support Desk
router.post('/support/tickets', ProfileController.submitSupportTicket);
router.get('/support/tickets', ProfileController.getSupportTickets);

export default router;
