import { Router } from 'express';
import { TeamController } from '../controllers/team.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/overview', TeamController.getOverview);
router.post('/claim-commission', TeamController.claimCommission);
router.post('/boost/:memberId', TeamController.boostMember);

export default router;
