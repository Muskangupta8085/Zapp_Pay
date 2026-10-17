import { Notification } from '../models/notification.model.js';
import { AppConfig } from '../models/appConfig.model.js';
import { PricingService } from './pricing.service.js';

export class HomeService {
  /**
   * Returns consolidated dashboard data for the mobile HomeScreen
   */
  static async getDashboard(userId?: string) {
    const rates: Record<string, number> = (await PricingService.getInrRates().catch(() => ({}))) as any;
    const xCoinPrice = rates.ZAP || rates.XCOIN || 108.37;
    const usdtPrice = rates.USDT || 87.42;

    const tickers = [
      {
        id: 'xcoin',
        symbol: 'xCoin',
        name: 'Zapp Pay Native',
        price: `₹ ${xCoinPrice.toFixed(2)}`,
        rawPrice: xCoinPrice,
        change: '+14.28%',
        isPositive: true,
        volume: '₹ 14.8 Cr',
        isZappPay: true,
        tag: 'Native',
      },
      {
        id: 'usdt',
        symbol: 'USDT',
        name: 'Tether USD',
        price: `₹ ${usdtPrice.toFixed(2)}`,
        rawPrice: usdtPrice,
        change: '+0.05%',
        isPositive: true,
        volume: '₹ 95 Cr',
        glyph: '₮',
        badgeColor: '#10B981',
      },
      {
        id: 'xrp',
        symbol: 'XRP',
        name: 'Ripple',
        price: '₹ 54.10',
        rawPrice: 54.10,
        change: '+2.18%',
        isPositive: true,
        volume: '₹ 32 Cr',
        glyph: 'XRP',
        badgeColor: '#0F172A',
        isTextBadge: true,
      },
    ];

    const config = await AppConfig.findOne().lean();
    const banners = config?.activeBanners?.filter((b) => b.isActive) || [
      {
        id: 'b1',
        title: 'Zero Gas Fees on xCoin',
        subtitle: 'Enjoy 0% platform fee on all spot trades & transfers',
        bannerType: 'Promo',
        ctaText: 'Trade Now',
        isActive: true,
      },
      {
        id: 'b2',
        title: 'Instant 60s UPI Settlement',
        subtitle: 'Direct INR deposits processed automatically via ICICI Node',
        bannerType: 'Notice',
        ctaText: 'Deposit',
        isActive: true,
      },
    ];

    const networkStatus = {
      status: 'Operational',
      network: 'Zapp Pay Mainnet v1.4',
      tps: '4,820 TPS',
      gasFee: '0.00 xCoin (Free)',
      blockSync: '100%',
      nodeLatency: '18ms',
      activeNodes: 124,
    };

    let unreadNotificationsCount = 0;
    if (userId) {
      unreadNotificationsCount = await Notification.countDocuments({
        userId,
        isRead: false,
      });
    }

    return {
      tickers,
      banners,
      networkStatus,
      unreadNotificationsCount,
    };
  }

  /**
   * Fetch user notifications (auto-seeds defaults if fresh user)
   */
  static async getNotifications(userId: string, unreadOnly: boolean = false) {
    let count = await Notification.countDocuments({ userId });
    if (count === 0) {
      // Seed initial helpful notifications for the user
      await Notification.insertMany([
        {
          userId,
          title: 'Welcome Bonus Activated',
          message: '100.00 xCoin welcome bounty credited to your decentralized wallet.',
          type: 'deposit',
          isRead: false,
        },
        {
          userId,
          title: 'xCoin New ATH Alert',
          message: 'Zapp Pay (xCoin) surged +14.28% to ₹108.37 with ₹14.8 Cr 24h volume!',
          type: 'surge',
          isRead: false,
        },
        {
          userId,
          title: 'VIP 1 Trader Status',
          message: 'Verified Member privileges active. 0.05% maker fee discount enabled.',
          type: 'vip',
          isRead: true,
        },
        {
          userId,
          title: 'Biometric Security Enabled',
          message: 'Face ID & Biometric security verified for instant mobile unlock.',
          type: 'security',
          isRead: true,
        },
      ]);
    }

    const query: any = { userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return notifications;
  }

  static async markNotificationRead(userId: string, notificationId: string) {
    const updated = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
    return updated;
  }

  static async markAllNotificationsRead(userId: string) {
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    return true;
  }
}
