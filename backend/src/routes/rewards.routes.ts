import { Router } from 'express';
import { RewardsController } from '../controllers/rewards.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/overview', RewardsController.getOverview);
router.post('/checkin', RewardsController.checkIn);
router.post('/claim/:missionKey', RewardsController.claimMission);
router.post('/mystery-box/open', RewardsController.openMysteryBox);
router.post('/claim-all', RewardsController.claimAll);

export default router;
