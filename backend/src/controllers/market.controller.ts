import { Request, Response, NextFunction } from 'express';
import { Token } from '../models/token.model.js';
import { sendResponse } from '../utils/apiResponse.js';

export class MarketController {
  static async getPrices(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let tokens = await Token.find({ isActive: true });
      // If no tokens in DB yet, return default mock list for immediate frontend usability
      if (!tokens.length) {
        tokens = [
          {
            name: 'Zapp Pay',
            symbol: 'ZAP',
            decimals: 18,
            currentPriceUsd: 1.25,
            change24h: 5.4,
            network: 'ZappChain',
            isActive: true,
            isTradable: true,
          } as any,
          {
            name: 'Tether USD',
            symbol: 'USDT',
            decimals: 6,
            currentPriceUsd: 1.0,
            change24h: 0.02,
            network: 'Ethereum',
            isActive: true,
            isTradable: true,
          } as any,
          {
            name: 'Bitcoin',
            symbol: 'BTC',
            decimals: 8,
            currentPriceUsd: 87500.0,
            change24h: 2.1,
            network: 'Bitcoin',
            isActive: true,
            isTradable: true,
          } as any,
          {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
            currentPriceUsd: 3200.0,
            change24h: -1.3,
            network: 'Ethereum',
            isActive: true,
            isTradable: true,
          } as any,
        ];
      }

      sendResponse({
        res,
        message: 'Market prices fetched successfully',
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getChartData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { symbol } = req.params;
      // Return 24h sample data points for chart
      const now = Date.now();
      const points = Array.from({ length: 24 }).map((_, i) => ({
        timestamp: now - (23 - i) * 3600 * 1000,
        price: Number((Math.random() * 5 + (symbol.toUpperCase() === 'BTC' ? 87000 : 1.2)).toFixed(2)),
      }));

      sendResponse({
        res,
        message: `Chart data for ${symbol}`,
        data: points,
      });
    } catch (error) {
      next(error);
    }
  }
}
