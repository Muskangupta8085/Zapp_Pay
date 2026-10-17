import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { sendTransferSchema } from '../validations/wallet.validation.js';

const router = Router();

router.use(authenticate);

router.get('/overview', WalletController.getOverview);
router.get('/receive-address', WalletController.getReceiveAddress);
router.post('/send', validate(sendTransferSchema), WalletController.send);
router.post('/request', WalletController.createRequest);
router.get('/requests', WalletController.getRequests);
router.delete('/requests/:id', WalletController.cancelRequest);

export default router;

