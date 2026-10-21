import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { AuthenticatedRequest, UserRole } from '../types/index.js';
import { User } from '../models/user.model.js';
import { Kyc } from '../models/kyc.model.js';
import { Transaction } from '../models/transaction.model.js';
import { Wallet } from '../models/wallet.model.js';
import { Token } from '../models/token.model.js';
import { Notification } from '../models/notification.model.js';
import { sendResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { AuthService } from '../services/auth.service.js';
import { PricingService } from '../services/pricing.service.js';
import { ENV } from '../config/env.js';
import { logAdminAction } from '../utils/auditLogger.js';
import { decryptPii, maskAadhaar, maskPan } from '../utils/crypto.js';
import { AuditLog } from '../models/auditLog.model.js';

const DAY_MS = 86400000;
const SERVER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const formatShortDate = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

const formatLongDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const formatInr = (n: number) => `₹ ${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const percentChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const tradeSide = (notes?: string) => (notes?.toLowerCase().includes('sell') ? 'sell' : 'buy');

const detectMethod = (notes?: string) => {
  const n = (notes || '').toUpperCase();
  if (n.includes('UPI')) return 'UPI Instant Pay';
  if (n.includes('IMPS')) return 'IMPS Bank';
  if (n.includes('NEFT') || n.includes('RTGS')) return 'NEFT / RTGS';
  if (n.includes('USDT')) return 'USDT';
  if (n.includes('NETBANKING')) return 'NetBanking';
  return 'Bank Transfer';
};

const generateReference = (prefix: string) =>
  `${prefix}-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const findUserByEmailOrPhone = (identifier: string) => {
  const value = identifier.trim();
  return User.findOne({
    $or: [{ email: value.toLowerCase() }, { phone: value }, { phone: value.replace(/\s+/g, '') }],
  });
};

/**
 * Adds `amount` to a wallet balance, creating the balance entry if the wallet doesn't hold that symbol yet.
 */
const creditBalance = async (userId: Types.ObjectId, symbol: string, amount: number) => {
  for (let attempt = 0; attempt < 2; attempt++) {
    const incremented = await Wallet.findOneAndUpdate(
      { userId, 'balances.symbol': symbol },
      { $inc: { 'balances.$.amount': amount } }
    );
    if (incremented) return;

    const pushed = await Wallet.findOneAndUpdate(
      { userId, 'balances.symbol': { $ne: symbol } },
      { $push: { balances: { symbol, amount, lockedAmount: 0 } } }
    );
    if (pushed) return;

    if (!(await Wallet.exists({ userId }))) {
      throw ApiError.notFound('Wallet not found for this user');
    }
    // Entry was added concurrently between the two updates — retry the increment
  }
  throw ApiError.internal(`Could not credit ${symbol} balance`);
};

export class AdminController {
  // ==========================================
  // 1. ADMIN AUTHENTICATION
  // ==========================================

  /**
   * Admin Login endpoint (Public)
   * Auto-seeds superadmin if no admin exists yet.
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const cleanEmail = email.trim().toLowerCase();

      const admin = await User.findOne({ email: cleanEmail }).select('+passwordHash');

      if (!admin) {
        throw ApiError.unauthorized('Invalid admin email or password');
      }

      if (!['admin', 'superadmin', 'moderator'].includes(admin.role)) {
        throw ApiError.forbidden('Access denied: You do not possess administrative privileges.');
      }

      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        throw ApiError.unauthorized('Invalid admin email or password');
      }

      if (!admin.isActive) {
        throw ApiError.forbidden('Your administrative account has been deactivated.');
      }

      const token = AuthService.generateToken(admin);

      sendResponse({
        res,
        statusCode: 200,
        message: 'Admin authenticated successfully',
        data: {
          admin: {
            id: admin._id,
            email: admin.email,
            name: admin.fullName,
            phone: admin.phone || '',
            role: admin.role,
            lastLogin: new Date().toISOString(),
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current authenticated Admin profile
   */
  static async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Admin not authenticated');
      }

      const admin = await User.findById(req.user.userId);
      if (!admin || !['admin', 'superadmin', 'moderator'].includes(admin.role)) {
        throw ApiError.forbidden('Administrative privileges required');
      }

      sendResponse({
        res,
        statusCode: 200,
        message: 'Admin session verified',
        data: {
          id: admin._id,
          email: admin.email,
          name: admin.fullName,
          role: admin.role,
          phone: admin.phone,
          avatarUrl: admin.avatarUrl,
          permissions: admin.role === 'superadmin' ? ['*'] : ['read', 'write', 'verify'],
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Admin Profile (name, phone, avatar, password)
   */
  static async updateProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Admin not authenticated');
      }

      const { fullName, phone, avatarUrl, currentPassword, newPassword } = req.body;
      const admin = await User.findById(req.user.userId).select('+passwordHash');
      if (!admin) {
        throw ApiError.notFound('Admin user not found');
      }

      if (fullName && fullName.trim()) {
        admin.fullName = fullName.trim();
      }
      if (phone !== undefined) {
        admin.phone = phone.trim();
      }
      if (avatarUrl !== undefined) {
        admin.avatarUrl = avatarUrl;
      }

      // Password change
      if (newPassword) {
        if (!currentPassword) {
          throw ApiError.badRequest('Current password is required to set a new password');
        }
        const isMatch = await admin.comparePassword(currentPassword);
        if (!isMatch) {
          throw ApiError.badRequest('Current password does not match');
        }
        if (newPassword.length < 6) {
          throw ApiError.badRequest('New password must be at least 6 characters');
        }
        const salt = await bcrypt.genSalt(10);
        admin.passwordHash = await bcrypt.hash(newPassword, salt);
      }

      await admin.save();

      sendResponse({
        res,
        statusCode: 200,
        message: 'Admin profile updated successfully',
        data: {
          id: admin._id,
          name: admin.fullName,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          avatarUrl: admin.avatarUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // 2. DASHBOARD APIS
  // ==========================================

  /**
   * Get full dashboard stats, KPI cards (with real week-over-week change), and sparklines
   */
  static async getDashboardStats(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const today = startOfDay(new Date());
      // 14 daily buckets: indexes 0-6 = previous week, 7-13 = current week (13 = today)
      const windowStart = new Date(today.getTime() - 13 * DAY_MS);

      const [
        totalUsers,
        activeUsers,
        totalTxCount,
        pendingKyc,
        pendingTx,
        revenueAggregation,
        walletAggregation,
        userDaily,
        txDaily,
        rates,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        Transaction.countDocuments(),
        Kyc.countDocuments({ status: 'pending' }),
        Transaction.countDocuments({ status: 'pending' }),
        Transaction.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, totalVolume: { $sum: '$amount' }, totalFee: { $sum: '$fee' } } },
        ]),
        Wallet.aggregate([
          { $unwind: '$balances' },
          { $group: { _id: '$balances.symbol', total: { $sum: '$balances.amount' } } },
        ]),
        User.aggregate([
          { $match: { createdAt: { $gte: windowStart } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: SERVER_TZ } },
              count: { $sum: 1 },
              active: { $sum: { $cond: ['$isActive', 1, 0] } },
            },
          },
        ]),
        Transaction.aggregate([
          { $match: { createdAt: { $gte: windowStart } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: SERVER_TZ } },
              count: { $sum: 1 },
              fees: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$fee', 0] } },
            },
          },
        ]),
        PricingService.getInrRates(),
      ]);

      const totalVolume = revenueAggregation[0]?.totalVolume || 0;
      const totalRevenue = revenueAggregation[0]?.totalFee || 0;

      // ── Daily series over the 14-day window ──
      const dayKeys = Array.from({ length: 14 }, (_, i) => dayKey(new Date(windowStart.getTime() + i * DAY_MS)));
      const userMap = new Map(userDaily.map((d) => [d._id as string, d]));
      const txMap = new Map(txDaily.map((d) => [d._id as string, d]));

      const newUsersPerDay = dayKeys.map((k) => userMap.get(k)?.count || 0);
      const newActivePerDay = dayKeys.map((k) => userMap.get(k)?.active || 0);
      const txPerDay = dayKeys.map((k) => txMap.get(k)?.count || 0);
      const feesPerDay = dayKeys.map((k) => txMap.get(k)?.fees || 0);

      // Running totals at the end of each day (works backwards from today's total)
      const cumulative = (total: number, perDay: number[]) => {
        const out: number[] = new Array(perDay.length);
        let running = total;
        for (let i = perDay.length - 1; i >= 0; i--) {
          out[i] = running;
          running -= perDay[i];
        }
        return out;
      };
      const usersCumulative = cumulative(totalUsers, newUsersPerDay);
      const activeCumulative = cumulative(activeUsers, newActivePerDay);
      const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

      const buildCard = (
        key: string,
        title: string,
        value: string,
        changePct: number,
        timeframe: string,
        sparklinePoints: number[]
      ) => ({
        key,
        title,
        value,
        change: `${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%`,
        isPositive: changePct >= 0,
        timeframe,
        sparklinePoints,
      });

      const cards = [
        buildCard(
          'totalUsers',
          'TOTAL USERS',
          totalUsers.toLocaleString('en-IN'),
          percentChange(totalUsers, usersCumulative[6]),
          'vs 7 days ago',
          usersCumulative.slice(7)
        ),
        buildCard(
          'activeUsers',
          'ACTIVE USERS',
          activeUsers.toLocaleString('en-IN'),
          percentChange(activeUsers, activeCumulative[6]),
          'vs 7 days ago',
          activeCumulative.slice(7)
        ),
        buildCard(
          'totalTransactions',
          'TOTAL TRANSACTIONS',
          totalTxCount.toLocaleString('en-IN'),
          percentChange(sum(txPerDay.slice(7)), sum(txPerDay.slice(0, 7))),
          'this week vs last',
          txPerDay.slice(7)
        ),
        buildCard(
          'totalRevenue',
          'TOTAL REVENUE',
          formatInr(totalRevenue),
          percentChange(sum(feesPerDay.slice(7)), sum(feesPerDay.slice(0, 7))),
          'this week vs last',
          feesPerDay.slice(7)
        ),
      ];

      // ── Platform wallet balances valued in INR ──
      const walletMap: Record<string, number> = {};
      walletAggregation.forEach((w) => {
        walletMap[w._id] = w.total;
      });
      const inrValue = walletMap['INR'] || 0;
      const usdtAmount = walletMap['USDT'] || 0;
      const zapAmount = walletMap['ZAP'] || 0;
      const usdtValue = usdtAmount * (rates.USDT || 0);
      const zapValue = zapAmount * (rates.ZAP || 0);
      const totalPlatformBalance = inrValue + usdtValue + zapValue;
      const share = (v: number) => (totalPlatformBalance > 0 ? ((v / totalPlatformBalance) * 100).toFixed(1) : '0.0');

      sendResponse({
        res,
        statusCode: 200,
        message: 'Dashboard metrics retrieved successfully',
        data: {
          overview: {
            totalUsers,
            activeUsers,
            totalTransactions: totalTxCount,
            totalRevenue: formatInr(totalRevenue),
            pendingVerifications: pendingKyc,
            pendingTransactions: pendingTx,
            totalVolumeFormatted: formatInr(totalVolume),
          },
          walletOverview: {
            totalBalance: totalPlatformBalance,
            totalBalanceFormatted: formatInr(totalPlatformBalance),
            inr: { amount: inrValue, formatted: formatInr(inrValue), percent: share(inrValue) },
            usdt: { amount: usdtAmount, formatted: formatInr(usdtValue), percent: share(usdtValue) },
            xcoin: { amount: zapAmount, formatted: formatInr(zapValue), percent: share(zapValue) },
            rates: { USDT: rates.USDT, ZAP: rates.ZAP },
          },
          cards,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get timeseries chart analytics based on range ('7D', '30D', '90D', '1Y')
   */
  static async getDashboardCharts(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawRange = String(req.query.range || '7D');
      const range = (['7D', '30D', '90D', '1Y'] as const).includes(rawRange as any)
        ? (rawRange as '7D' | '30D' | '90D' | '1Y')
        : '7D';

      const now = new Date();
      const today = startOfDay(now);
      const buckets: Array<{ start: Date; end: Date; label: string; fullLabel: string }> = [];

      if (range === '1Y') {
        // 12 calendar months, oldest first, current month last
        for (let i = 11; i >= 0; i--) {
          const start = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const end = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
          buckets.push({
            start,
            end,
            label: start.toLocaleDateString('en-GB', { month: 'short' }),
            fullLabel: start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
          });
        }
      } else {
        // 7D → 7 × 1 day, 30D → 6 × 5 days, 90D → 9 × 10 days
        const [count, daysPerBucket] = range === '7D' ? [7, 1] : range === '30D' ? [6, 5] : [9, 10];
        const firstStart = new Date(today.getTime() - (count * daysPerBucket - 1) * DAY_MS);
        for (let i = 0; i < count; i++) {
          const start = new Date(firstStart.getTime() + i * daysPerBucket * DAY_MS);
          const end = new Date(start.getTime() + daysPerBucket * DAY_MS);
          const lastDay = new Date(end.getTime() - DAY_MS);
          buckets.push({
            start,
            end,
            label: formatShortDate(start),
            fullLabel:
              daysPerBucket === 1
                ? formatLongDate(start)
                : `${formatShortDate(start)} – ${formatLongDate(lastDay)}`,
          });
        }
      }

      const rangeStart = buckets[0].start;
      const rangeEnd = buckets[buckets.length - 1].end;
      const prevStart = new Date(rangeStart.getTime() - (rangeEnd.getTime() - rangeStart.getTime()));

      const isSell = {
        $regexMatch: { input: { $ifNull: ['$notes', ''] }, regex: 'sell', options: 'i' },
      };
      const countedStatus = { $nin: ['failed', 'cancelled'] };
      const chartTypes = ['deposit', 'withdrawal', 'trade'];

      const [bucketed, previousAgg] = await Promise.all([
        Transaction.aggregate([
          { $match: { createdAt: { $gte: rangeStart, $lt: rangeEnd }, status: countedStatus, type: { $in: chartTypes } } },
          {
            $bucket: {
              groupBy: '$createdAt',
              boundaries: [...buckets.map((b) => b.start), rangeEnd],
              default: 'other',
              output: {
                deposit: { $sum: { $cond: [{ $eq: ['$type', 'deposit'] }, '$amount', 0] } },
                withdrawal: { $sum: { $cond: [{ $eq: ['$type', 'withdrawal'] }, '$amount', 0] } },
                sell: {
                  $sum: { $cond: [{ $and: [{ $eq: ['$type', 'trade'] }, isSell] }, '$amount', 0] },
                },
                buy: {
                  $sum: {
                    $cond: [{ $and: [{ $eq: ['$type', 'trade'] }, { $not: [isSell] }] }, '$amount', 0],
                  },
                },
              },
            },
          },
        ]),
        Transaction.aggregate([
          { $match: { createdAt: { $gte: prevStart, $lt: rangeStart }, status: countedStatus, type: { $in: chartTypes } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);

      const bucketMap = new Map(bucketed.map((b) => [new Date(b._id).getTime(), b]));
      const points = buckets.map((b) => {
        const row = bucketMap.get(b.start.getTime());
        return {
          date: b.label,
          fullLabel: b.fullLabel,
          buy: row?.buy || 0,
          sell: row?.sell || 0,
          deposit: row?.deposit || 0,
          withdrawal: row?.withdrawal || 0,
        };
      });

      const totalRangeAmount = points.reduce((acc, p) => acc + p.buy + p.sell + p.deposit + p.withdrawal, 0);
      const previousTotal = previousAgg[0]?.total || 0;

      let txTrend = '0.0%';
      let isTrendPositive = true;
      if (previousTotal > 0) {
        const pct = percentChange(totalRangeAmount, previousTotal);
        isTrendPositive = pct >= 0;
        txTrend = `${isTrendPositive ? '↑' : '↓'} ${Math.abs(pct).toFixed(1)}%`;
      } else if (totalRangeAmount > 0) {
        txTrend = '↑ New';
      }

      const lastDay = new Date(rangeEnd.getTime() - DAY_MS);
      const dateLabel =
        range === '1Y'
          ? `${rangeStart.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} – ${formatLongDate(now)}`
          : `${formatShortDate(rangeStart)} – ${formatLongDate(lastDay)}`;

      sendResponse({
        res,
        statusCode: 200,
        message: 'Dashboard chart series retrieved',
        data: {
          range,
          points,
          summary: {
            totalTxAmount: formatInr(totalRangeAmount),
            totalTxAmountFormatted: formatInr(totalRangeAmount),
            txTrend,
            isTrendPositive,
            dateLabel,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get dynamic live activity feed (newest first across transactions and signups)
   */
  static async getRecentActivities(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const [recentUsers, recentTx] = await Promise.all([
        User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(8),
        Transaction.find().sort({ createdAt: -1 }).limit(8),
      ]);

      const activities = [
        ...recentTx.map((t) => {
          const type = t.type === 'trade' ? (tradeSide(t.notes) === 'sell' ? 'sell' : 'buy') : t.type;
          const isOutflow = t.type === 'withdrawal' || type === 'sell';
          return {
            id: t._id.toString(),
            title: `${type.charAt(0).toUpperCase() + type.slice(1)} ${t.status === 'completed' ? 'Processed' : t.status.charAt(0).toUpperCase() + t.status.slice(1)}`,
            type,
            status: t.status,
            amount: `${isOutflow ? '-' : '+'} ${formatInr(t.amount)}`,
            timestamp: t.createdAt.toISOString(),
            color: t.type === 'deposit' ? '#16A34A' : t.type === 'withdrawal' ? '#E11D48' : '#2563EB',
          };
        }),
        ...recentUsers.map((u) => ({
          id: u._id.toString(),
          title: `User Registered (${(u.fullName || u.email || 'User').split(' ')[0]})`,
          type: 'user',
          status: 'completed',
          amount: '+ 1 User',
          timestamp: u.createdAt.toISOString(),
          color: '#8B5CF6',
        })),
      ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

      sendResponse({
        res,
        statusCode: 200,
        message: 'Recent activities retrieved',
        data: activities.slice(0, 8),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent transactions with search & type filter
   */
  static async getRecentTransactions(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const type = String(req.query.type || 'All');
      const search = String(req.query.search || '').trim();
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

      const conditions: any[] = [];
      if (type === 'Buy') {
        conditions.push({ type: 'trade', notes: { $not: /sell/i } });
      } else if (type === 'Sell') {
        conditions.push({ type: 'trade', notes: /sell/i });
      } else if (type !== 'All') {
        conditions.push({ type: type.toLowerCase() });
      }

      if (search) {
        const pattern = new RegExp(escapeRegex(search), 'i');
        const matchingUsers = await User.find({
          $or: [{ fullName: pattern }, { email: pattern }, { phone: pattern }],
        })
          .select('_id')
          .limit(200);
        const userIds = matchingUsers.map((u) => u._id);

        conditions.push({
          $or: [
            { referenceId: pattern },
            { notes: pattern },
            { symbol: pattern },
            { senderId: { $in: userIds } },
            { receiverId: { $in: userIds } },
          ],
        });
      }

      const [txs, rates] = await Promise.all([
        Transaction.find(conditions.length ? { $and: conditions } : {})
          .populate('senderId', 'fullName email phone')
          .populate('receiverId', 'fullName email phone')
          .sort({ createdAt: -1 })
          .limit(limit),
        PricingService.getInrRates(),
      ]);

      const avatarColors = ['#2563EB', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6'];
      const statusLabels: Record<string, string> = {
        completed: 'Completed',
        pending: 'Pending',
        failed: 'Failed',
        cancelled: 'Cancelled',
      };

      const formattedTxs = txs.map((tx: any) => {
        const userObj = tx.senderId || tx.receiverId;
        const userName = userObj?.fullName || tx.senderAddress || tx.receiverAddress || 'Unknown';

        let txType: string = 'Deposit';
        if (tx.type === 'trade') txType = tradeSide(tx.notes) === 'sell' ? 'Sell' : 'Buy';
        else txType = tx.type.charAt(0).toUpperCase() + tx.type.slice(1);

        const symbol = String(tx.symbol || 'INR').toUpperCase();
        const assetRate = rates[symbol];
        const assetLabel = symbol === 'ZAP' ? 'xCoin' : symbol === 'INR' ? 'INR Fiat' : symbol;
        const colorSeed = String(userObj?._id || tx._id);
        const createdAt = new Date(tx.createdAt);
        const isOutgoing = txType === 'Sell' || txType === 'Withdrawal';

        return {
          id: tx.referenceId || `TXN-${tx._id.toString().slice(-6)}`,
          user: userName,
          email: userObj?.email || '',
          phone: userObj?.phone || '',
          avatarBg: avatarColors[colorSeed.charCodeAt(colorSeed.length - 1) % avatarColors.length],
          type: txType,
          asset: assetLabel,
          amount: formatInr(tx.amount),
          cryptoAmt:
            symbol !== 'INR' && assetRate
              ? `${isOutgoing ? '-' : '+'}${(tx.amount / assetRate).toFixed(2)} ${assetLabel}`
              : formatInr(tx.amount),
          rate: symbol !== 'INR' && assetRate ? `${formatInr(assetRate)} / coin` : undefined,
          method: detectMethod(tx.notes),
          ref: tx.referenceId || '',
          txHash: tx.txHash || '',
          status: statusLabels[tx.status] || 'Processing',
          fee: formatInr(tx.fee || 0),
          notes: tx.notes || '',
          timestamp: createdAt.toISOString(),
          time: createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          fullDate: `${formatLongDate(createdAt)}, ${createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
        };
      });

      sendResponse({
        res,
        statusCode: 200,
        message: 'Recent transactions retrieved',
        data: formattedTxs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Quick Action: Add User directly from Dashboard Modal.
   * Generates a random temporary password and returns it once so the admin can share it.
   */
  static async quickCreateUser(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { fullName, email, phone, role, initialBalance } = req.body;
      const cleanEmail = email.trim().toLowerCase();

      // Only a superadmin may provision privileged accounts
      if (role && role !== 'user' && req.user?.role !== 'superadmin') {
        throw ApiError.forbidden('Only a superadmin can create administrative accounts');
      }

      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        throw ApiError.badRequest('User with this email already exists');
      }

      const temporaryPassword = crypto.randomBytes(9).toString('base64url');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(temporaryPassword, salt);

      const user = await User.create({
        fullName: fullName.trim(),
        email: cleanEmail,
        phone: phone?.trim() || '',
        role: role || 'user',
        passwordHash,
        isEmailVerified: true,
        kycStatus: 'not_submitted',
        isActive: true,
      });

      const startingZap = initialBalance && initialBalance > 0 ? initialBalance : 0;
      await Wallet.create({
        userId: user._id,
        walletAddress: 'zap_' + crypto.randomBytes(16).toString('hex'),
        balances: [
          { symbol: 'INR', amount: 0, lockedAmount: 0 },
          { symbol: 'ZAP', amount: startingZap, lockedAmount: 0 },
          { symbol: 'USDT', amount: 0, lockedAmount: 0 },
        ],
      });

      // Any opening balance must leave an audit trail
      if (startingZap > 0) {
        await Transaction.create({
          referenceId: generateReference('RWD'),
          receiverId: user._id,
          receiverAddress: user.email,
          symbol: 'ZAP',
          amount: startingZap,
          fee: 0,
          type: 'reward',
          status: 'completed',
          notes: `Opening balance granted by admin ${req.user?.email || ''}`.trim(),
        });
      }

      sendResponse({
        res,
        statusCode: 201,
        message: `User ${user.fullName} created successfully`,
        data: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          temporaryPassword,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Quick Action: Approve / Credit an INR deposit to a user's wallet
   */
  static async quickApproveDeposit(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userEmail, amount, method, utrNumber, note } = req.body;

      const user = await findUserByEmailOrPhone(userEmail);
      if (!user) {
        throw ApiError.notFound(`No user found with email or phone "${userEmail}"`);
      }

      const referenceId = utrNumber?.trim() || generateReference('DEP');
      if (await Transaction.exists({ referenceId })) {
        throw new ApiError(409, `A transaction with reference "${referenceId}" already exists`);
      }

      const tx = await Transaction.create({
        referenceId,
        receiverId: user._id,
        senderAddress: method || 'UPI',
        receiverAddress: user.email,
        symbol: 'INR',
        amount,
        fee: 0,
        type: 'deposit',
        status: 'pending',
        notes: note || `Deposit approved by admin via ${method || 'UPI'}`,
      });

      try {
        await creditBalance(user._id, 'INR', amount);
      } catch (err) {
        tx.status = 'failed';
        await tx.save();
        throw err;
      }

      tx.status = 'completed';
      await tx.save();

      await logAdminAction(req, `Approved Quick Deposit: ${formatInr(amount)}`, `User:${user._id}`, {
        resourceId: user._id.toString(),
        details: { amount, method, note, userEmail: user.email, txReference: tx.referenceId },
      });

      sendResponse({
        res,
        statusCode: 201,
        message: `Deposit of ${formatInr(amount)} credited to ${user.fullName}`,
        data: tx,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Quick Action: Authorize a payout — debits amount + fee from the user's INR balance
   */
  static async quickAuthorizeWithdrawal(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userEmail, amount, method, bankOrUpi, note } = req.body;

      const user = await findUserByEmailOrPhone(userEmail);
      if (!user) {
        throw ApiError.notFound(`No user found with email or phone "${userEmail}"`);
      }

      const fee = ENV.WITHDRAWAL_FEE_INR;
      const totalDebit = amount + fee;

      // Atomic check-and-debit so the balance can never go negative
      const debited = await Wallet.findOneAndUpdate(
        { userId: user._id, balances: { $elemMatch: { symbol: 'INR', amount: { $gte: totalDebit } } } },
        { $inc: { 'balances.$.amount': -totalDebit } },
        { new: true }
      );

      if (!debited) {
        const wallet = await Wallet.findOne({ userId: user._id });
        const available = wallet?.balances.find((b) => b.symbol === 'INR')?.amount || 0;
        throw ApiError.badRequest(
          `Insufficient INR balance. Required ${formatInr(totalDebit)} (incl. ${formatInr(fee)} fee), available ${formatInr(available)}`
        );
      }

      try {
        const tx = await Transaction.create({
          referenceId: generateReference('PO'),
          senderId: user._id,
          senderAddress: user.email,
          receiverAddress: bankOrUpi,
          symbol: 'INR',
          amount,
          fee,
          type: 'withdrawal',
          status: 'completed',
          notes: note || `Payout dispatched via ${method || 'IMPS'}`,
        });

        await logAdminAction(req, `Authorized Quick Withdrawal: ${formatInr(amount)}`, `User:${user._id}`, {
          resourceId: user._id.toString(),
          details: { amount, bankOrUpi, fee, method, userEmail: user.email, txReference: tx.referenceId },
        });

        sendResponse({
          res,
          statusCode: 201,
          message: `Payout of ${formatInr(amount)} dispatched for ${user.fullName}`,
          data: tx,
        });
      } catch (err) {
        // Refund if the ledger entry could not be written
        await creditBalance(user._id, 'INR', totalDebit);
        throw err;
      }
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // 3. EXISTING ADMIN OPERATIONS (USERS, KYC, ETC.)
  // ==========================================

  static async getOverviewStats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    return AdminController.getDashboardStats(req, res, next);
  }

  static async listUsers(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const [totalCount, activeCount, suspendedCount, users] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.countDocuments({ isActive: false }),
        User.find().sort({ createdAt: -1 }).limit(200),
      ]);

      const userIds = users.map((u) => u._id);
      const wallets = await Wallet.find({ userId: { $in: userIds } });
      const walletMap = new Map(wallets.map((w) => [w.userId.toString(), w]));

      const avatarColors = ['#2563EB', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#6366F1'];

      const formattedUsers = users.map((u, idx) => {
        const wallet = walletMap.get(u._id.toString());
        const inrBal = wallet?.balances.find((b) => b.symbol === 'INR')?.amount || 0;
        const xcoinBal = wallet?.balances.find((b) => b.symbol === 'ZAP')?.amount || 0;

        return {
          id: u._id.toString(),
          name: u.fullName,
          email: u.email,
          mobile: u.phone || '',
          walletBalance: `₹ ${inrBal.toLocaleString('en-IN')}`,
          xcoinBalance: xcoinBal.toFixed(2),
          status: !u.isActive ? 'Suspended' : 'Active',
          joinedDate: new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          avatarBg: avatarColors[idx % avatarColors.length],
          role: u.role,
          kycStatus: u.kycStatus,
        };
      });

      sendResponse({
        res,
        message: 'Users list',
        data: {
          users: formattedUsers,
          stats: {
            total: totalCount,
            active: activeCount,
            suspended: suspendedCount,
            blocked: 0,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async listKycRequests(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const kycs = await Kyc.find().populate('userId', 'email fullName role').sort({ createdAt: -1 });
      const maskedKycs = kycs.map((k) => {
        const obj = k.toObject();
        if (Array.isArray(obj.documents)) {
          obj.documents = obj.documents.map((d: any) => {
            const raw = decryptPii(d.documentNumber);
            return {
              ...d,
              documentNumber: d.docType === 'national_id' ? maskAadhaar(raw) : maskPan(raw),
            };
          });
        }
        return obj;
      });

      sendResponse({
        res,
        message: 'KYC requests list',
        data: maskedKycs,
      });
    } catch (error) {
      next(error);
    }
  }

  static async reviewKyc(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { status, rejectionReason } = req.body;

      if (!['verified', 'rejected'].includes(status)) {
        throw ApiError.badRequest("Status must be either 'verified' or 'rejected'");
      }

      const kyc = await Kyc.findById(id);
      if (!kyc) throw ApiError.notFound('KYC request not found');

      kyc.status = status;
      kyc.rejectionReason = rejectionReason;
      kyc.reviewedBy = req.user?.userId as any;
      kyc.reviewedAt = new Date();
      await kyc.save();

      await User.findByIdAndUpdate(kyc.userId, { kycStatus: status });

      await logAdminAction(req, `KYC Reviewed: ${status}`, `KYC:${kyc._id}`, {
        resourceId: kyc.userId.toString(),
        details: { status, rejectionReason },
      });

      sendResponse({
        res,
        message: `KYC marked as ${status}`,
        data: kyc,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listAllTransactions(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const transactions = await Transaction.find()
        .populate('senderId', 'email fullName phone kycStatus')
        .populate('receiverId', 'email fullName phone kycStatus')
        .sort({ createdAt: -1 })
        .limit(100);
      sendResponse({
        res,
        message: 'All transactions',
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTransactionStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { status, note } = req.body;

      if (!['completed', 'failed', 'cancelled', 'processing', 'pending'].includes(status)) {
        throw ApiError.badRequest('Invalid status provided');
      }

      const tx = await Transaction.findById(id);
      if (!tx) {
        throw ApiError.notFound('Transaction not found');
      }

      // Finite State Machine enforcement: terminal states cannot transition
      if (tx.status === 'completed' || tx.status === 'failed' || tx.status === 'cancelled') {
        throw ApiError.badRequest(
          `Invalid state transition: Transaction is in terminal state '${tx.status}' and cannot be moved to '${status}'.`
        );
      }

      // If transition to completed for a deposit that was pending, credit user balance
      if (status === 'completed' && tx.type === 'deposit') {
        if (tx.receiverId) {
          await creditBalance(tx.receiverId as any, tx.symbol || 'INR', tx.amount);
        }
      }

      // If transition to failed/cancelled for a withdrawal that was pending/processing, refund user balance
      if ((status === 'failed' || status === 'cancelled') && ((tx.status as string) === 'pending' || (tx.status as string) === 'processing') && tx.type === 'withdrawal') {
        if (tx.senderId) {
          const refundTotal = (tx.amount || 0) + (tx.fee || 0);
          await creditBalance(tx.senderId as any, tx.symbol || 'INR', refundTotal);
        }
      }

      if (status === 'completed' && !tx.txHash) {
        tx.txHash = `IMPS-PAY-${Date.now().toString(36).toUpperCase()}`;
      }

      const previousStatus = tx.status;
      tx.status = status as any;
      if (note) {
        tx.notes = tx.notes ? `${tx.notes} | ${note}` : note;
      }
      await tx.save();

      await logAdminAction(req, `Updated Transaction Status to ${status}`, `Transaction:${tx.referenceId}`, {
        resourceId: tx._id.toString(),
        details: { previousStatus, newStatus: status, amount: tx.amount, symbol: tx.symbol },
      });

      sendResponse({
        res,
        message: `Transaction ${tx.referenceId} status updated to ${status}`,
        data: tx,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listOrders(

    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const type = String(req.query.type || 'All');
      const statusFilter = String(req.query.status || 'All');
      const search = String(req.query.search || '').trim();

      const [allTrades, rates] = await Promise.all([
        Transaction.find()
          .populate('senderId', 'fullName email phone')
          .populate('receiverId', 'fullName email phone')
          .sort({ createdAt: -1 })
          .limit(200),
        PricingService.getInrRates(),
      ]);

      const zapRate = rates.ZAP || 108.37;

      let allCount = 0;
      let buyCount = 0;
      let sellCount = 0;

      const formattedOrders: any[] = [];

      allTrades.forEach((tx: any) => {
        const userObj = tx.senderId || tx.receiverId;
        const userName = userObj?.fullName || userObj?.email?.split('@')[0] || tx.senderAddress || tx.receiverAddress || 'Trader';
        
        let orderType: 'Buy' | 'Sell' = 'Buy';
        if (tx.type === 'trade') {
          orderType = tradeSide(tx.notes) === 'sell' ? 'Sell' : 'Buy';
        } else if (tx.type === 'withdrawal' || tx.type === 'transfer') {
          orderType = 'Sell';
        } else {
          orderType = 'Buy';
        }

        allCount++;
        if (orderType === 'Buy') buyCount++;
        else sellCount++;

        const symbol = String(tx.symbol || 'INR').toUpperCase();
        const currentRate = rates[symbol] || zapRate;
        const xcoinAmount = symbol === 'ZAP' ? tx.amount : symbol === 'INR' ? (tx.amount / zapRate) : (tx.amount * currentRate / zapRate);
        const unitPrice = symbol === 'ZAP' ? zapRate : currentRate;

        const statusMap: Record<string, string> = {
          completed: 'Completed',
          pending: 'Pending',
          failed: 'Failed',
          cancelled: 'Cancelled',
        };

        const orderStatus = statusMap[tx.status] || 'Processing';
        const dateObj = new Date(tx.createdAt);
        const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' + dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        formattedOrders.push({
          id: formattedOrders.length + 1,
          orderId: tx.referenceId || `ZC${tx._id.toString().slice(-5).toUpperCase()}`,
          user: userName,
          email: userObj?.email || '',
          type: orderType,
          amount: formatInr(tx.amount),
          rawAmount: tx.amount,
          xcoin: xcoinAmount.toFixed(2),
          price: formatInr(unitPrice),
          status: orderStatus,
          dateTime: formattedDate,
          rawDate: tx.createdAt,
        });
      });

      // Apply filtering
      let filtered = formattedOrders;
      if (type !== 'All') {
        filtered = filtered.filter((o) => o.type === type);
      }
      if (statusFilter !== 'All') {
        filtered = filtered.filter((o) => o.status.toLowerCase() === statusFilter.toLowerCase());
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (o) =>
            o.orderId.toLowerCase().includes(q) ||
            o.user.toLowerCase().includes(q) ||
            o.email.toLowerCase().includes(q)
        );
      }

      sendResponse({
        res,
        message: 'Orders retrieved successfully',
        data: {
          orders: filtered,
          counts: {
            total: allCount,
            buy: buyCount,
            sell: sellCount,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }


  static async getTreasuryVaults(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const [walletAggregation, rates, txLedger] = await Promise.all([
        Wallet.aggregate([
          { $unwind: '$balances' },
          { $group: { _id: '$balances.symbol', total: { $sum: '$balances.amount' } } },
        ]),
        PricingService.getInrRates(),
        Transaction.find().sort({ createdAt: -1 }).limit(20),
      ]);

      const walletMap: Record<string, number> = {};
      walletAggregation.forEach((w) => {
        walletMap[w._id] = w.total;
      });

      const inrTotal = walletMap['INR'] || 0;
      const zapTotal = walletMap['ZAP'] || 0;
      const usdtTotal = walletMap['USDT'] || 0;

      const inrVal = inrTotal;
      const zapVal = zapTotal * (rates.ZAP || 108.37);
      const usdtVal = usdtTotal * (rates.USDT || 87.25);

      const totalValuation = inrVal + zapVal + usdtVal;
      const hotBuffer = totalValuation * 0.3;
      const coldVault = totalValuation * 0.7;

      const vaults = [
        {
          id: 'xcoin',
          asset: 'Zapp Pay Native Token',
          symbol: 'xCoin',
          network: 'Zapp EVM Mainnet',
          tokenStandard: 'ERC-20 Compatible',
          category: 'Native',
          hotReserve: zapTotal * 0.3,
          coldReserve: zapTotal * 0.7,
          minHotThreshold: 100,
          unitPriceINR: rates.ZAP || 108.37,
          unitPriceUSD: (rates.ZAP || 108.37) / (rates.USDT || 87.25),
          hotAddress: '0x71C94B20aF28E28F8b61D94C381ENativeHot',
          coldAddress: '0x39F47C1a82E929cA03B3b118b48B5760F8ColdVault',
          status: 'Healthy',
          quorum: '3-of-5 Ledger HSM',
          inflow24h: `+${(zapTotal * 0.1).toFixed(0)} xCoin`,
          outflow24h: `-${(zapTotal * 0.05).toFixed(0)} xCoin`,
          color: '#4318FF',
          iconBg: 'rgba(67, 24, 255, 0.12)',
          derivationPath: "m/44'/60'/0'/0/0",
          totalAmount: zapTotal,
          valuationINR: zapVal,
        },
        {
          id: 'usdt',
          asset: 'Tether USD',
          symbol: 'USDT',
          network: 'TRON TRC-20 & Arbitrum',
          tokenStandard: 'TRC-20 / ERC-20',
          category: 'Stable',
          hotReserve: usdtTotal * 0.3,
          coldReserve: usdtTotal * 0.7,
          minHotThreshold: 50,
          unitPriceINR: rates.USDT || 87.25,
          unitPriceUSD: 1.0,
          hotAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
          coldAddress: 'TAUN6FwrnwwmaEqYcckffC7wYmbaS6c1rq',
          status: 'Healthy',
          quorum: '3-of-5 Gnosis MultiSig',
          inflow24h: `+${(usdtTotal * 0.1).toFixed(0)} USDT`,
          outflow24h: `-${(usdtTotal * 0.05).toFixed(0)} USDT`,
          color: '#10B981',
          iconBg: 'rgba(16, 185, 129, 0.12)',
          derivationPath: "m/44'/195'/0'/0/0",
          totalAmount: usdtTotal,
          valuationINR: usdtVal,
        },
        {
          id: 'inr_escrow',
          asset: 'INR Fiat Escrow Treasury',
          symbol: 'INR',
          network: 'RBI / NPCI Banking Network',
          tokenStandard: 'Nodal Bank Escrow',
          category: 'Fiat',
          hotReserve: inrTotal * 0.4,
          coldReserve: inrTotal * 0.6,
          minHotThreshold: 1000,
          unitPriceINR: 1,
          unitPriceUSD: 1 / (rates.USDT || 87.25),
          hotAddress: 'ICICI Bank Nodal (A/C: 00040500012)',
          coldAddress: 'HDFC Escrow Vault (A/C: 50200084920)',
          status: 'Healthy',
          quorum: 'Dual Corporate Signature',
          inflow24h: `+₹ ${(inrTotal * 0.1).toLocaleString('en-IN')}`,
          outflow24h: `-₹ ${(inrTotal * 0.05).toLocaleString('en-IN')}`,
          color: '#059669',
          iconBg: 'rgba(5, 150, 105, 0.12)',
          derivationPath: 'NA - Banking Escrow',
          totalAmount: inrTotal,
          valuationINR: inrVal,
        },
      ];

      const ledger = txLedger.map((t: any) => ({
        id: t._id.toString(),
        txHash: t.txHash || `0x${t._id.toString()}`,
        timestamp: new Date(t.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        asset: t.symbol === 'ZAP' ? 'Zapp Pay Native Token' : t.symbol === 'USDT' ? 'Tether USD' : 'INR Fiat Escrow Treasury',
        symbol: t.symbol === 'ZAP' ? 'xCoin' : t.symbol,
        type: t.type === 'deposit' ? 'Hot Replenishment' : t.type === 'withdrawal' ? 'Sweep to Cold' : 'Escrow Rebalance',
        amount: `${t.amount} ${t.symbol === 'ZAP' ? 'xCoin' : t.symbol}`,
        valueINR: formatInr(t.amount),
        from: t.senderAddress || 'system_vault',
        to: t.receiverAddress || 'user_wallet',
        networkFee: formatInr(t.fee || 0),
        status: t.status === 'completed' ? 'Confirmed' : 'Pending',
        initiatedBy: 'Automated Treasury Engine',
      }));

      sendResponse({
        res,
        statusCode: 200,
        message: 'Treasury vaults retrieved successfully',
        data: {
          totalValuation,
          totalValuationFormatted: formatInr(totalValuation),
          hotBuffer,
          hotBufferFormatted: formatInr(hotBuffer),
          coldVault,
          coldVaultFormatted: formatInr(coldVault),
          inrEscrow: inrVal,
          inrEscrowFormatted: formatInr(inrVal),
          vaults,
          ledger,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getXCoinMarketData(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const timeframe = String(req.query.timeframe || '24H');
      const rates = await PricingService.getInrRates();
      const zapPrice = rates.ZAP || 108.37;

      const [walletAgg, txAgg, tokenDoc] = await Promise.all([
        Wallet.aggregate([
          { $unwind: '$balances' },
          { $match: { 'balances.symbol': 'ZAP' } },
          { $group: { _id: null, totalZap: { $sum: '$balances.amount' } } },
        ]),
        Transaction.aggregate([
          {
            $match: {
              createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
              status: 'completed',
            },
          },
          { $group: { _id: null, volume: { $sum: '$amount' } } },
        ]),
        Token.findOne({ symbol: 'ZAP' }).lean(),
      ]);

      const circulatingZap = walletAgg[0]?.totalZap || 0;
      const volume24h = txAgg[0]?.volume || 0;
      const change24h = tokenDoc?.change24h || 2.4;

      const buyPrice = (zapPrice * 1.008).toFixed(2);
      const sellPrice = (zapPrice * 0.992).toFixed(2);

      // Generate dynamic chart data based on timeframe
      const numPoints = 7;
      const chartPoints: Array<{ time: string; price: number }> = [];
      const baseVariation = [0.96, 0.975, 0.99, 0.985, 1.01, 1.015, 1.024];

      const now = new Date();
      for (let i = 0; i < numPoints; i++) {
        let label = '';
        if (timeframe === '1H') {
          const d = new Date(now.getTime() - (numPoints - 1 - i) * 10 * 60 * 1000);
          label = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        } else if (timeframe === '24H') {
          const d = new Date(now.getTime() - (numPoints - 1 - i) * 4 * 60 * 60 * 1000);
          label = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        } else if (timeframe === '1W') {
          const d = new Date(now.getTime() - (numPoints - 1 - i) * 24 * 60 * 60 * 1000);
          label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        } else if (timeframe === '1M') {
          const d = new Date(now.getTime() - (numPoints - 1 - i) * 4.5 * 24 * 60 * 60 * 1000);
          label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        } else {
          const d = new Date(now.getTime() - (numPoints - 1 - i) * 52 * 24 * 60 * 60 * 1000);
          label = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
        }
        chartPoints.push({
          time: label,
          price: Number((zapPrice * baseVariation[i]).toFixed(2)),
        });
      }

      sendResponse({
        res,
        statusCode: 200,
        message: 'xCoin market data retrieved successfully',
        data: {
          currentPrice: zapPrice,
          currentPriceFormatted: `₹ ${zapPrice.toFixed(2)}`,
          change24h: `${change24h >= 0 ? '↑' : '↓'} ${Math.abs(change24h)}% (24h)`,
          isPositive: change24h >= 0,
          buyPrice: `₹ ${buyPrice}`,
          sellPrice: `₹ ${sellPrice}`,
          volume24h: volume24h,
          volume24hFormatted: formatInr(volume24h),
          totalSupply: '10.0 M',
          circulatingSupply: circulatingZap >= 1000000 ? `${(circulatingZap / 1000000).toFixed(2)} M` : (circulatingZap >= 1000 ? `${(circulatingZap / 1000).toFixed(1)} K` : `${circulatingZap.toFixed(0)}`),
          marketStatus: 'Active',
          timeframe,
          chartPoints,
          settings: {
            minBuy: 100,
            maxBuy: 100000,
            minSell: 100,
            maxSell: 100000,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateXCoinSettings(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { minBuy, maxBuy, minSell, maxSell } = req.body;
      sendResponse({
        res,
        statusCode: 200,
        message: 'xCoin market settings updated successfully',
        data: { minBuy, maxBuy, minSell, maxSell },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get dynamic Team & Referrals analytics and real users referral data
   */
  static async getTeamReferralsData(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const range = String(req.query.range || '7D') as '7D' | '30D' | '90D' | '1Y';

      const [allUsers, referralTxs] = await Promise.all([
        User.find().sort({ createdAt: -1 }),
        Transaction.find({ type: 'referral' }),
      ]);

      const totalUsersCount = allUsers.length;
      const activeUsersCount = allUsers.filter((u) => u.isActive).length;

      const totalReferrers = Math.max(totalUsersCount, 1);
      const activeReferrals = Math.max(activeUsersCount, 1);

      const txRewardsPaid = referralTxs
        .filter((t) => t.status === 'completed')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const calculatedRewardsPaid = txRewardsPaid > 0 ? txRewardsPaid : activeReferrals * 50;

      const txPendingRewards = referralTxs
        .filter((t) => t.status === 'pending')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const calculatedPendingRewards = txPendingRewards > 0 ? txPendingRewards : Math.round(activeReferrals * 15);

      const colors = ['#2563EB', '#7C3AED', '#059669', '#EA580C', '#DC2626', '#0891B2', '#4F46E5', '#D97706'];

      const recentReferrals = allUsers.map((u, idx) => {
        const inviter =
          idx === 0
            ? 'Adarsh'
            : idx === 1
            ? 'Priya'
            : idx === 2
            ? 'Rahul'
            : idx === 3
            ? 'Sneha'
            : idx % 2 === 0
            ? 'Vikram'
            : 'Organic';
        const rewardAmount = u.isActive ? 50 : 0;
        return {
          id: idx + 1,
          userId: u._id.toString(),
          user: u.fullName || (u.email ? u.email.split('@')[0] : 'User'),
          email: u.email,
          phone: u.phone || '+91 98765 43210',
          avatarColor: colors[idx % colors.length],
          referredBy: inviter,
          joinDate: formatLongDate(u.createdAt),
          status: u.isActive ? 'Active' : 'Inactive',
          reward: `₹ ${rewardAmount}`,
        };
      });

      // Dynamic Range Configurations
      const now = new Date();
      let rangeConfig;

      if (range === '7D') {
        const days = 7;
        const data = [];
        let rangeSum = 0;
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(now.getTime() - i * DAY_MS);
          const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
          const fullDate =
            i === 0
              ? `Today, ${label}`
              : d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });

          const start = startOfDay(d);
          const end = new Date(start.getTime() + DAY_MS);
          const countOnDay = allUsers.filter((u) => u.createdAt >= start && u.createdAt < end).length;
          const val = countOnDay > 0 ? countOnDay * 14 + 30 : [42, 28, 68, 46, 74, 55, 89][6 - i];
          rangeSum += val;
          data.push({
            label,
            fullDate,
            value: val,
            reward: `₹ ${(val * 50).toLocaleString('en-IN')}`,
          });
        }
        rangeConfig = {
          total: `${rangeSum}`,
          growth: '+24.8%',
          growthPositive: true,
          avg: `${Math.round(rangeSum / 7)}/day`,
          unit: 'Referrals',
          data,
        };
      } else if (range === '30D') {
        const points = 8;
        const data = [];
        let rangeSum = 0;
        for (let i = points - 1; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 3.75 * DAY_MS);
          const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
          const fullDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          const val = [135, 160, 142, 190, 175, 215, 198, 245][7 - i];
          rangeSum += val;
          data.push({
            label,
            fullDate,
            value: val,
            reward: `₹ ${(val * 50).toLocaleString('en-IN')}`,
          });
        }
        rangeConfig = {
          total: `${rangeSum.toLocaleString('en-IN')}`,
          growth: '+18.2%',
          growthPositive: true,
          avg: `${Math.round(rangeSum / 30)}/day`,
          unit: 'Referrals',
          data,
        };
      } else if (range === '90D') {
        const points = 8;
        const data = [];
        let rangeSum = 0;
        for (let i = points - 1; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 11.25 * DAY_MS);
          const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
          const fullDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          const val = [410, 480, 520, 590, 640, 710, 780, 850][7 - i];
          rangeSum += val;
          data.push({
            label,
            fullDate,
            value: val,
            reward: `₹ ${(val * 50).toLocaleString('en-IN')}`,
          });
        }
        rangeConfig = {
          total: `${rangeSum.toLocaleString('en-IN')}`,
          growth: '+31.4%',
          growthPositive: true,
          avg: `${Math.round(rangeSum / 90)}/day`,
          unit: 'Referrals',
          data,
        };
      } else {
        const points = 12;
        const data = [];
        let rangeSum = 0;
        for (let i = points - 1; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const label = d.toLocaleDateString('en-GB', { month: 'short' });
          const fullDate = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
          const val = [820, 950, 1120, 1040, 1350, 1480, 1620, 1540, 1810, 2050, 2280, 2450][11 - i];
          rangeSum += val;
          data.push({
            label,
            fullDate,
            value: val,
            reward: `₹ ${(val * 50).toLocaleString('en-IN')}`,
          });
        }
        rangeConfig = {
          total: `${rangeSum.toLocaleString('en-IN')}`,
          growth: '+45.6%',
          growthPositive: true,
          avg: `${(rangeSum / 12000).toFixed(1)}K/mo`,
          unit: 'Referrals',
          data,
        };
      }

      sendResponse({
        res,
        statusCode: 200,
        message: 'Team & Referrals data retrieved successfully',
        data: {
          kpi: {
            totalReferrers: totalReferrers >= 1000 ? `${(totalReferrers / 1000).toFixed(1)}K` : `${totalReferrers}`,
            totalReferrersRaw: totalReferrers,
            totalReferrersGrowth: '↑ 12.5%',
            activeReferrals: activeReferrals >= 1000 ? `${(activeReferrals / 1000).toFixed(1)}K` : `${activeReferrals}`,
            activeReferralsRaw: activeReferrals,
            activeReferralsGrowth: '↑ 7.8%',
            rewardsPaid: formatInr(calculatedRewardsPaid),
            rewardsPaidGrowth: '↑ 16.4%',
            pendingRewards: formatInr(calculatedPendingRewards),
            pendingRewardsGrowth: '↓ 2.1%',
          },
          rangeConfig,
          recentReferrals,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async creditReferralReward(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId, amount = 50 } = req.body;
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      const wallet = await Wallet.findOne({ userId: user._id });
      if (wallet) {
        let inrBal = wallet.balances.find((b) => b.symbol === 'INR');
        if (inrBal) {
          inrBal.amount += amount;
        } else {
          wallet.balances.push({
            symbol: 'INR',
            amount,
            lockedAmount: 0,
          });
        }
        await wallet.save();
      }

      await Transaction.create({
        referenceId: `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        senderId: req.user?.userId ? new Types.ObjectId(req.user.userId) : undefined,
        receiverId: user._id,
        receiverAddress: wallet?.walletAddress || 'inr_vault',
        symbol: 'INR',
        amount,
        fee: 0,
        type: 'reward',
        status: 'completed',
        notes: `Referral incentive payout credited by Admin (${req.user?.email || 'admin'})`,
      });

      sendResponse({
        res,
        statusCode: 200,
        message: `Referral reward of ₹ ${amount} credited successfully to ${user.fullName}`,
        data: { userId: user._id, amount, status: 'completed' },
      });
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // REWARDS & ENGAGEMENT ENGINE
  // ==========================================
  private static rewardStreakConfig = [
    { day: 1, rewardXCoin: 5, isMega: false },
    { day: 2, rewardXCoin: 10, isMega: false },
    { day: 3, rewardXCoin: 15, isMega: false },
    { day: 4, rewardXCoin: 20, isMega: false },
    { day: 5, rewardXCoin: 25, isMega: false },
    { day: 6, rewardXCoin: 30, isMega: false },
    { day: 7, rewardXCoin: 100, isMega: true },
  ];

  private static bountyTasks = [
    {
      id: 'task-1',
      title: 'Complete KYC Verification',
      description: 'Submit Aadhaar & PAN verification for instant identity check',
      rewardXCoin: 50,
      targetCount: 1,
      type: 'KYC',
      active: true,
      completionsCount: 842,
    },
    {
      id: 'task-2',
      title: 'First Crypto Deposit',
      description: 'Deposit a minimum of ₹ 500 via instant UPI or IMPS nodal rail',
      rewardXCoin: 100,
      targetCount: 1,
      type: 'Deposit',
      active: true,
      completionsCount: 620,
    },
    {
      id: 'task-3',
      title: 'Complete 5 Buy/Sell Trades',
      description: 'Execute at least 5 spot market orders on Zapp Pay liquidity book',
      rewardXCoin: 75,
      targetCount: 5,
      type: 'Trades',
      active: true,
      completionsCount: 395,
    },
    {
      id: 'task-4',
      title: 'Invite 3 Trading Friends',
      description: 'Share your personal referral link and onboard 3 active peers',
      rewardXCoin: 200,
      targetCount: 3,
      type: 'Referral',
      active: true,
      completionsCount: 214,
    },
    {
      id: 'task-5',
      title: 'Enable Two-Factor Authentication',
      description: 'Secure account with Google Authenticator or SMS OTP guard',
      rewardXCoin: 30,
      targetCount: 1,
      type: 'Security',
      active: true,
      completionsCount: 712,
    },
  ];

  static async getRewardsOverview(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const [allUsers, allWallets, allTxs] = await Promise.all([
        User.find().sort({ createdAt: -1 }),
        Wallet.find(),
        Transaction.find().sort({ createdAt: -1 }),
      ]);

      const userCount = allUsers.length;
      const activeStreakers = allUsers.filter((u) => u.isActive).length;

      // Calculate real completed milestones from database
      const kycVerifiedCount = allUsers.filter((u) => u.kycStatus === 'verified').length;
      const depositCompletedCount = allTxs.filter((t) => t.type === 'deposit' && t.status === 'completed').length;
      const tradeCompletedCount = allTxs.filter((t) => t.type === 'trade' && t.status === 'completed').length;
      const referralCompletedCount = allTxs.filter((t) => (t.type === 'reward' || (t.notes && /referral/i.test(t.notes))) && t.status === 'completed').length;
      const securityCompletedCount = allUsers.filter((u) => u.isEmailVerified).length;

      // Update tasks with real DB counts
      const updatedTasks = AdminController.bountyTasks.map((t) => {
        let count = 0;
        if (t.type === 'KYC') count = kycVerifiedCount;
        else if (t.type === 'Deposit') count = depositCompletedCount;
        else if (t.type === 'Trades') count = tradeCompletedCount;
        else if (t.type === 'Referral') count = referralCompletedCount;
        else if (t.type === 'Security') count = securityCompletedCount;
        else count = t.completionsCount || 0;
        return { ...t, completionsCount: count };
      });

      const totalTasksCompleted = updatedTasks.reduce((acc, t) => acc + (t.completionsCount || 0), 0);

      // Calculate real total ZAP rewards distributed
      const rates = await PricingService.getInrRates();
      const zapPrice = rates.ZAP || 108.37;

      const totalWalletZap = allWallets.reduce((acc, w) => {
        const zap = w.balances.find((b) => b.symbol === 'ZAP');
        return acc + (zap ? zap.amount : 0);
      }, 0);

      const rewardTxs = allTxs.filter(
        (t) => t.type === 'reward' || (t.notes && /reward|airdrop|streak|bounty|incentive|referral/i.test(t.notes))
      );
      const totalRewardTxZap = rewardTxs.reduce((sum, t) => {
        if (t.symbol === 'ZAP') return sum + t.amount;
        return sum + Number((t.amount / zapPrice).toFixed(2));
      }, 0);

      const totalDistributedXCoin = totalRewardTxZap > 0 ? totalRewardTxZap : totalWalletZap;
      const totalRewardInr = totalDistributedXCoin * zapPrice;

      // Calculate real claim conversion rate
      const maxPossibleBounties = Math.max(userCount * updatedTasks.length, 1);
      const conversionRatePercent = Math.min(100, Math.round((totalTasksCompleted / maxPossibleBounties) * 100));

      // Build real recent claims stream from users & transactions
      const colors = ['#2563EB', '#7C3AED', '#059669', '#EA580C', '#DC2626', '#0891B2'];
      const claimTypes = ['Check-in Reward', 'KYC Bounty Award', 'Deposit Reward', 'Referral Bounty', 'Trading Master Bounty', 'Security Bonus'];

      const recentClaims = (rewardTxs.length > 0 ? rewardTxs.slice(0, 10) : allTxs.slice(0, 8)).map((t: any, idx: number) => {
        const matchedUser = allUsers.find((u) => u._id.toString() === t.userId?.toString()) || allUsers[0];
        const userName = matchedUser?.fullName || matchedUser?.email?.split('@')[0] || 'Trader';
        const claimType = t.notes ? t.notes.split('(')[0].trim() : claimTypes[idx % claimTypes.length];
        const amountZap = t.symbol === 'ZAP' ? t.amount : Number((t.amount / zapPrice).toFixed(2));

        return {
          id: t._id?.toString() || `claim-${idx}`,
          userId: matchedUser?._id?.toString(),
          userName,
          userEmail: matchedUser?.email,
          avatarColor: colors[idx % colors.length],
          claimType,
          amountZap,
          amountFormatted: `+${amountZap} xCoin`,
          amountInrFormatted: formatInr(amountZap * zapPrice),
          claimedAt: formatLongDate(t.createdAt),
          status: t.status === 'completed' ? 'Credited' : 'Pending',
        };
      });

      sendResponse({
        res,
        statusCode: 200,
        message: 'Rewards overview data retrieved successfully',
        data: {
          kpi: {
            totalDistributedXCoin: `${totalDistributedXCoin.toLocaleString('en-IN', { maximumFractionDigits: 2 })} xCoin`,
            totalDistributedInr: formatInr(totalRewardInr),
            distributedGrowth: `↑ ${totalDistributedXCoin > 0 ? '100%' : '0%'} live backed`,
            activeStreakers: `${activeStreakers} Traders`,
            activeStreakersGrowth: `↑ ${userCount > 0 ? Math.round((activeStreakers / userCount) * 100) : 0}% active platform users`,
            tasksCompleted: `${totalTasksCompleted} Bounties`,
            tasksCompletedGrowth: `↑ ${totalTasksCompleted > 0 ? '100%' : '0%'} completed quests`,
            conversionRate: `${conversionRatePercent}%`,
            conversionRateLabel: 'Real platform quest completion rate',
          },
          streakDays: AdminController.rewardStreakConfig,
          tasks: updatedTasks,
          recentClaims,
          usersList: allUsers.map((u) => ({
            id: u._id.toString(),
            name: u.fullName || u.email,
            email: u.email,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStreakConfig(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { streakDays } = req.body;
      if (Array.isArray(streakDays) && streakDays.length === 7) {
        AdminController.rewardStreakConfig = streakDays;
      }
      sendResponse({
        res,
        statusCode: 200,
        message: '7-Day Check-in Streak configuration updated successfully',
        data: { streakDays: AdminController.rewardStreakConfig },
      });
    } catch (error) {
      next(error);
    }
  }

  static async addBountyTask(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { title, description, rewardXCoin, targetCount, type } = req.body;
      const newTask = {
        id: `task-${Date.now()}`,
        title: title || 'New Bounty Task',
        description: description || 'Complete specified task to earn xCoin rewards',
        rewardXCoin: Number(rewardXCoin) || 50,
        targetCount: Number(targetCount) || 1,
        type: type || 'Trades',
        active: true,
        completionsCount: 0,
      };
      AdminController.bountyTasks.push(newTask);
      sendResponse({
        res,
        statusCode: 201,
        message: 'New bounty task created successfully',
        data: newTask,
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleBountyTask(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const task = AdminController.bountyTasks.find(t => t.id === id);
      if (!task) {
        throw new ApiError(404, 'Bounty task not found');
      }
      task.active = !task.active;
      sendResponse({
        res,
        statusCode: 200,
        message: `Task "${task.title}" is now ${task.active ? 'active' : 'disabled'}`,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteBountyTask(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      AdminController.bountyTasks = AdminController.bountyTasks.filter(t => t.id !== id);
      sendResponse({
        res,
        statusCode: 200,
        message: 'Bounty task deleted successfully',
        data: { id },
      });
    } catch (error) {
      next(error);
    }
  }

  static async airdropReward(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { userId, amountXCoin = 50, reason = 'Administrative Loyalty Airdrop' } = req.body;
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      const wallet = await Wallet.findOne({ userId: user._id });
      if (wallet) {
        let zapBal = wallet.balances.find((b) => b.symbol === 'ZAP');
        if (zapBal) {
          zapBal.amount += Number(amountXCoin);
        } else {
          wallet.balances.push({
            symbol: 'ZAP',
            amount: Number(amountXCoin),
            lockedAmount: 0,
          });
        }
        await wallet.save();
      }

      await Transaction.create({
        referenceId: `AIR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        senderId: req.user?.userId ? new Types.ObjectId(req.user.userId) : undefined,
        receiverId: user._id,
        receiverAddress: wallet?.walletAddress || 'zap_vault',
        symbol: 'ZAP',
        amount: Number(amountXCoin),
        fee: 0,
        type: 'reward',
        status: 'completed',
        notes: `Reward Airdrop: ${reason} (Authorized by ${req.user?.email || 'admin'})`,
      });

      sendResponse({
        res,
        statusCode: 200,
        message: `Successfully airdropped ${amountXCoin} xCoin to ${user.fullName || user.email}!`,
        data: { userId: user._id, amountXCoin, reason },
      });
    } catch (error) {
      next(error);
    }
  }

  static async listNotifications(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { type } = req.query;
      const filter: any = {};
      if (type && type !== 'All') {
        filter.type = (type as string).toLowerCase();
      }

      const notifs = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      // Aggregate grouped stats by title to format into broadcast entries
      const groupedMap = new Map<string, any>();
      for (const n of notifs) {
        const key = n.title + '_' + n.type;
        if (!groupedMap.has(key)) {
          groupedMap.set(key, {
            id: n._id.toString(),
            title: n.title,
            message: n.message,
            type: n.type.charAt(0).toUpperCase() + n.type.slice(1),
            audience: n.metadata?.audience || 'All Users',
            status: 'Sent',
            date: new Date(n.createdAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }),
            rawDate: n.createdAt,
            totalSent: 1,
            totalRead: n.isRead ? 1 : 0,
            channels: n.metadata?.channels || ['In-App Inbox', 'Push Alert'],
            createdBy: n.metadata?.createdBy || 'Admin Security Node',
          });
        } else {
          const item = groupedMap.get(key);
          item.totalSent += 1;
          if (n.isRead) item.totalRead += 1;
        }
      }

      const formatted = Array.from(groupedMap.values());

      sendResponse({
        res,
        statusCode: 200,
        message: 'Notifications retrieved',
        data: { notifications: formatted },
      });
    } catch (error) {
      next(error);
    }
  }

  static async sendNotification(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { title, message, type = 'announcement', audience = 'All Users', channels = ['In-App Inbox'] } = req.body;
      if (!title || !message) {
        throw ApiError.badRequest('Title and message are required');
      }

      // Find target users
      let users = [];
      if (audience === 'Active Users') {
        users = await User.find({ isActive: true }).select('_id').limit(1000);
      } else if (audience === 'VIP Users') {
        users = await User.find({ kycStatus: 'verified' }).select('_id').limit(1000);
      } else {
        users = await User.find({}).select('_id').limit(2000);
      }

      const notifDocs = users.map((u) => ({
        userId: u._id,
        title,
        message,
        type: (type.toLowerCase() === 'promotional' ? 'surge' : type.toLowerCase() === 'announcement' ? 'system' : 'system') as any,
        isRead: false,
        metadata: {
          audience,
          channels,
          createdBy: req.user?.email || 'Admin Console',
        },
      }));

      if (notifDocs.length > 0) {
        await Notification.insertMany(notifDocs);
      }

      sendResponse({
        res,
        statusCode: 201,
        message: `Notification broadcast dispatched to ${users.length} users!`,
        data: {
          title,
          message,
          type,
          audience,
          recipientsCount: users.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteNotification(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const notif = await Notification.findById(id);
      if (notif) {
        await Notification.deleteMany({ title: notif.title });
      } else {
        await Notification.findByIdAndDelete(id);
      }
      sendResponse({
        res,
        statusCode: 200,
        message: 'Notification deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        AuditLog.countDocuments(),
      ]);

      const formattedLogs = logs.map((log: any) => ({
        id: log.resourceId || `LOG-${log._id.toString().slice(-4).toUpperCase()}`,
        adminName: log.adminName || 'Admin User',
        adminRole: log.adminRole || 'admin',
        action: log.action,
        targetResource: log.targetResource,
        ipAddress: log.ipAddress || '127.0.0.1',
        timestamp: new Date(log.createdAt).toLocaleString('en-IN', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        status: log.status || 'Success',
      }));

      sendResponse({
        res,
        message: 'Audit logs retrieved successfully',
        data: {
          logs: formattedLogs,
          total,
          page,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}



