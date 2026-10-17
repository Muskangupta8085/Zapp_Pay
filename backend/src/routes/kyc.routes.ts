import { Router } from 'express';
import { KycController } from '../controllers/kyc.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { submitKycSchema } from '../validations/kyc.validation.js';

const router = Router();

router.use(authenticate);

router.post('/submit', validate(submitKycSchema), KycController.submit);
router.get('/status', KycController.getStatus);

export default router;
