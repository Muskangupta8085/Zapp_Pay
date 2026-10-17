import { Router } from 'express';
import { HomeController } from '../controllers/home.controller.js';
import { authenticateOptional } from '../middleware/auth.middleware.js';

const router = Router();

// Public / optionally authenticated dashboard
router.get('/dashboard', authenticateOptional, HomeController.getDashboard);
router.get('/tickers', HomeController.getTickers);
router.get('/network-status', HomeController.getNetworkStatus);
router.get('/network', HomeController.getNetworkStatus);

export default router;
