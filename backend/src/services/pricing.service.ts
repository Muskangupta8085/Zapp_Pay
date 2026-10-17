import { Token } from '../models/token.model.js';
import { ENV } from '../config/env.js';

export type InrRates = Record<string, number>;

export class PricingService {
  /**
   * INR value of one unit of each asset. Live Token prices (USD) from the DB
   * take precedence; env-configured fallbacks cover assets with no Token record.
   */
  static async getInrRates(): Promise<InrRates> {
    const rates: InrRates = {
      INR: 1,
      USDT: ENV.USD_INR_RATE,
      ZAP: ENV.ZAP_INR_PRICE,
    };

    const tokens = await Token.find({ isActive: true }).select('symbol currentPriceUsd').lean();
    tokens.forEach((t) => {
      if (t.currentPriceUsd > 0) {
        rates[t.symbol.toUpperCase()] = t.currentPriceUsd * ENV.USD_INR_RATE;
      }
    });

    return rates;
  }
}
