import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { enforceIdempotency } from '../middleware/idempotency.middleware.js';
import {
  sendTransferSchema,
  withdrawSchema,
  payRequestSchema,
} from '../validations/wallet.validation.js';

const router = Router();

router.use(authenticate);

// Portfolio & Vault Overview
router.get('/overview', WalletController.getOverview);
router.get('/receive-address', WalletController.getReceiveAddress);
router.get('/transactions', WalletController.getTransactions);

// Financial Transfers & Withdrawals
router.post('/send', enforceIdempotency(), validate(sendTransferSchema), WalletController.send);
router.post('/withdraw', enforceIdempotency(), validate(withdrawSchema), WalletController.withdraw);

// Payment Requests (In-app & UPI Intent)
router.post('/request', enforceIdempotency(), WalletController.createRequest);
router.get('/requests', WalletController.getRequests);
router.delete('/requests/:id', WalletController.cancelRequest);
router.post('/requests/:id/pay', enforceIdempotency(), validate(payRequestSchema), WalletController.payRequest);

export default router;

