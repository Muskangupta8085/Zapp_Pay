import { Router } from 'express';
import { MarketController } from '../controllers/market.controller.js';

const router = Router();

router.get('/prices', MarketController.getPrices);
router.get('/chart/:symbol', MarketController.getChartData);

export default router;
