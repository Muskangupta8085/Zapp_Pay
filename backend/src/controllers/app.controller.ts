import { Request, Response } from 'express';
import { AppConfig } from '../models/appConfig.model.js';

export class AppController {
  private static async getOrCreateConfig() {
    let config = await AppConfig.findOne();
    if (!config) {
      config = await AppConfig.create({
        minAppVersion: '1.0.0',
        latestAppVersion: '1.4.2',
        forceUpdate: false,
        maintenanceMode: false,
        maintenanceMessage: 'Zapp Pay system is undergoing brief scheduled maintenance. Please check back shortly.',
        activeBanners: [
          {
            id: 'banner_1',
            title: 'Zero P2P Escrow Fees',
            subtitle: 'Trade xCoin & USDT with zero platform gas fees this month.',
            bannerType: 'Promo',
            ctaText: 'Start Trading',
            ctaAction: 'TRADE_NOW',
            isActive: true,
          },
          {
            id: 'banner_2',
            title: 'Instant Bank & UPI Settlement',
            subtitle: 'Direct IMPS payout in under 60 seconds with bank verification.',
            bannerType: 'Notice',
            ctaText: 'Link Account',
            ctaAction: 'LINK_BANK',
            isActive: true,
          },
        ],
        termsOfService: 'Zapp Pay Terms of Service v1.4. Compliant peer-to-peer crypto liquidity intermediary node.',
        privacyPolicy: 'Zapp Pay End-to-End Cryptographic Privacy Charter. Your personal identity is strictly encrypted and secure.',
      });
    }
    return config;
  }

  static async getConfig(req: Request, res: Response): Promise<void> {
    try {
      const clientVersion = (req.query.version as string) || '1.0.0';
      const config = await AppController.getOrCreateConfig();

      const isOutdated = clientVersion < config.minAppVersion;

      res.status(200).json({
        success: true,
        data: {
          latestAppVersion: config.latestAppVersion,
          minAppVersion: config.minAppVersion,
          clientVersion,
          forceUpdate: config.forceUpdate && isOutdated,
          shouldUpdate: clientVersion < config.latestAppVersion,
          maintenanceMode: config.maintenanceMode,
          maintenanceMessage: config.maintenanceMessage,
          activeBanners: config.activeBanners.filter((b) => b.isActive),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to fetch app configuration' });
    }
  }

  static async getPolicies(_req: Request, res: Response): Promise<void> {
    try {
      const config = await AppController.getOrCreateConfig();
      res.status(200).json({
        success: true,
        data: {
          termsOfService: config.termsOfService,
          privacyPolicy: config.privacyPolicy,
          supportEmail: 'support@zapppay.io',
          disclaimer: 'Crypto trading involves market risk. Escrow guarantees funds delivery once payment is verified.',
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to fetch policies' });
    }
  }

  static async updateConfig(req: Request, res: Response): Promise<void> {
    try {
      const { minAppVersion, latestAppVersion, forceUpdate, maintenanceMode, maintenanceMessage, activeBanners } = req.body;
      const config = await AppController.getOrCreateConfig();

      if (minAppVersion !== undefined) config.minAppVersion = minAppVersion;
      if (latestAppVersion !== undefined) config.latestAppVersion = latestAppVersion;
      if (forceUpdate !== undefined) config.forceUpdate = forceUpdate;
      if (maintenanceMode !== undefined) config.maintenanceMode = maintenanceMode;
      if (maintenanceMessage !== undefined) config.maintenanceMessage = maintenanceMessage;
      if (activeBanners !== undefined) config.activeBanners = activeBanners;

      await config.save();
      res.status(200).json({ success: true, message: 'App configuration updated', data: config });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to update config' });
    }
  }
}
