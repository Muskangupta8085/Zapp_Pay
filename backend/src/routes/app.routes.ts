import { Router } from 'express';
import { AppController } from '../controllers/app.controller.js';

const router = Router();

router.get('/config', AppController.getConfig);
router.get('/policies', AppController.getPolicies);
router.put('/config', AppController.updateConfig);

export default router;
