import mongoose from 'mongoose';
import { RewardStreak } from '../models/rewardStreak.model.js';
import { Mission } from '../models/mission.model.js';
import { RewardHistory } from '../models/rewardHistory.model.js';
import { User } from '../models/user.model.js';
import { Transaction } from '../models/transaction.model.js';
import { Wallet } from '../models/wallet.model.js';
import { PricingService } from './pricing.service.js';
import { ApiError } from '../utils/apiError.js';

const STREAK_REWARDS = [5, 10, 15, 20, 25, 30, 100];

export class RewardsService {
  private static isSameDay(d1: Date, d2: Date): boolean {
    return (
      d1.getUTCFullYear() === d2.getUTCFullYear() &&
      d1.getUTCMonth() === d2.getUTCMonth() &&
      d1.getUTCDate() === d2.getUTCDate()
    );
  }

  private static isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    return this.isSameDay(date, yesterday);
  }

  private static async creditWalletZap(userId: string | mongoose.Types.ObjectId, amount: number) {
    const cleanAmount = Math.round((Number(amount) + Number.EPSILON) * 100000000) / 100000000;
    let credited = await Wallet.findOneAndUpdate(
      { userId, 'balances.symbol': 'ZAP' },
      { $inc: { 'balances.$.amount': cleanAmount } },
      { new: true }
    );

    if (!credited) {
      credited = await Wallet.findOneAndUpdate(
        { userId },
        {
          $setOnInsert: {
            walletAddress: '0x' + new mongoose.Types.ObjectId().toString(),
            isActive: true,
          },
          $push: { balances: { symbol: 'ZAP', amount: cleanAmount, lockedAmount: 0 } },
        },
        { new: true, upsert: true }
      );
    }
    return credited;
  }

  static async getOverview(userId: string) {
    const userObjId = new mongoose.Types.ObjectId(userId);
    const user = await User.findById(userObjId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // 1. Get or create RewardStreak
    let streak = await RewardStreak.findOne({ userId: userObjId });
    if (!streak) {
      streak = await RewardStreak.create({
        userId: userObjId,
        currentStreak: 0,
        claimedDays: [],
        totalStreakEarned: 0,
        unclaimedBalance: 0,
        mysteryBox: { isUnlocked: false, isOpened: false },
      });
    }

    const now = new Date();
    const alreadyCheckedInToday = streak.lastCheckInDate ? this.isSameDay(streak.lastCheckInDate, now) : false;
    const canCheckIn = !alreadyCheckedInToday;

    // Reset streak if missed more than 1 day
    if (streak.lastCheckInDate && !alreadyCheckedInToday && !this.isYesterday(streak.lastCheckInDate)) {
      if (streak.currentStreak > 0) {
        streak.currentStreak = 0;
        streak.claimedDays = [];
        await streak.save();
      }
    }

    const currentStreakVal = streak.currentStreak;
    const streakDays = STREAK_REWARDS.map((reward, index) => {
      const dayNum = index + 1;
      const isDone = streak.claimedDays.includes(dayNum);
      const isToday = !alreadyCheckedInToday && dayNum === currentStreakVal + 1;
      return {
        day: `Day ${dayNum}`,
        reward: dayNum === 7 ? '100' : `+${reward}`,
        done: isDone,
        today: isToday,
        mega: dayNum === 7,
      };
    });

    // 2. Sync / seed missions
    await this.ensureAndSyncMissions(user);
    const missions = await Mission.find({ userId: userObjId }).lean();

    // Map missions for frontend compatibility
    const mappedMissions = missions.map((m) => {
      let icon = 'shield-checkmark';
      let iconBg = '#E6FAF5';
      let iconColor = '#05CD99';

      if (m.missionKey === 'first_deposit') {
        icon = 'arrow-down-circle';
        iconBg = '#EEF2FF';
        iconColor = '#6C5DD3';
      } else if (m.missionKey === 'trades_5') {
        icon = 'swap-horizontal';
        iconBg = '#FFF7EB';
        iconColor = '#FFB547';
      } else if (m.missionKey === 'invite_3') {
        icon = 'people';
        iconBg = '#F3E8FF';
        iconColor = '#A060FF';
      }

      let actionLabel: string | undefined = undefined;
      if (m.status === 'Action') {
        actionLabel = m.missionKey === 'kyc' ? 'Verify' : m.missionKey === 'first_deposit' ? 'Deposit' : m.missionKey === 'trades_5' ? 'Trade' : 'Invite';
      } else if (m.status === 'In Progress') {
        actionLabel = 'Pending';
      }

      return {
        id: m.missionKey,
        title: m.title,
        subtitle: m.subtitle,
        reward: m.rewardText,
        rewardAmount: m.rewardAmount,
        category: m.category,
        status: m.status,
        actionLabel,
        progress: m.progress,
        progressText: `${m.progress} / ${m.target} ${m.category === 'Trading' ? 'Done' : 'Joined'}`,
        icon,
        iconBg,
        iconColor,
      };
    });

    // 3. Load Reward History
    const history = await RewardHistory.find({ userId: userObjId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const mappedHistory = history.map((h) => ({
      id: h._id.toString(),
      title: h.title,
      amount: h.amount,
      fiatAmount: h.fiatAmount,
      date: new Date(h.createdAt).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      type: h.type,
      txHash: h.txHash,
    }));

    // Calculate total claimable unclaimed balance
    const claimableMissionsAmount = missions
      .filter((m) => m.status === 'Claim')
      .reduce((sum, curr) => sum + curr.rewardAmount, 0);

    const totalUnclaimed = (streak.unclaimedBalance || 0) + claimableMissionsAmount;

    return {
      currentStreak: streak.currentStreak,
      canCheckIn,
      streakDays,
      unclaimedBalance: totalUnclaimed,
      mysteryBox: streak.mysteryBox,
      missions: mappedMissions,
      history: mappedHistory,
    };
  }

  private static async ensureAndSyncMissions(user: any) {
    const userId = user._id;

    const defaultMissions = [
      {
        missionKey: 'kyc',
        title: 'Complete Identity KYC',
        subtitle: 'Upload Aadhaar & PAN verification',
        category: 'Beginner',
        rewardAmount: 50,
        rewardText: '+50 xCoin',
        target: 1,
      },
      {
        missionKey: 'first_deposit',
        title: 'First Crypto Deposit',
        subtitle: 'Deposit min ₹ 500 fiat or USDT equivalent',
        category: 'Beginner',
        rewardAmount: 100,
        rewardText: '+100 xCoin',
        target: 1,
      },
      {
        missionKey: 'trades_5',
        title: 'Execute 5 P2P Trades',
        subtitle: 'Complete 5 buy or sell trades on orderbook',
        category: 'Trading',
        rewardAmount: 75,
        rewardText: '+75 xCoin',
        target: 5,
      },
      {
        missionKey: 'invite_3',
        title: 'Invite 3 Trading Friends',
        subtitle: 'Earn bonuses when your referrals join',
        category: 'Community',
        rewardAmount: 200,
        rewardText: '+200 xCoin',
        target: 3,
      },
    ];

    for (const def of defaultMissions) {
      let m = await Mission.findOne({ userId, missionKey: def.missionKey });
      if (!m) {
        m = await Mission.create({
          userId,
          ...def,
          progress: 0,
          status: 'Action',
        });
      }

      // If already claimed, don't revert
      if (m.status === 'Claimed') continue;

      // Evaluate mission conditions
      if (def.missionKey === 'kyc') {
        if (user.kycStatus === 'verified') {
          m.status = 'Claim';
          m.progress = 1;
        } else if (user.kycStatus === 'pending') {
          m.status = 'In Progress';
          m.progress = 0;
        } else {
          m.status = 'Action';
          m.progress = 0;
        }
      } else if (def.missionKey === 'first_deposit') {
        const depositCount = await Transaction.countDocuments({
          receiverId: userId,
          type: { $in: ['buy', 'deposit'] },
          status: 'completed',
        });
        if (depositCount > 0) {
          m.status = 'Claim';
          m.progress = 1;
        }
      } else if (def.missionKey === 'trades_5') {
        const tradeCount = await Transaction.countDocuments({
          $or: [{ senderId: userId }, { receiverId: userId }],
          status: 'completed',
        });
        m.progress = Math.min(tradeCount, 5);
        if (tradeCount >= 5) {
          m.status = 'Claim';
        }
      } else if (def.missionKey === 'invite_3') {
        const inviteCount = await User.countDocuments({
          referredBy: user.referralCode,
        });
        m.progress = Math.min(inviteCount, 3);
        if (inviteCount >= 3) {
          m.status = 'Claim';
        }
      }

      await m.save();
    }
  }

  static async checkInDaily(userId: string) {
    const userObjId = new mongoose.Types.ObjectId(userId);
    let streak = await RewardStreak.findOne({ userId: userObjId });
    if (!streak) {
      streak = await RewardStreak.create({
        userId: userObjId,
        currentStreak: 0,
        claimedDays: [],
        totalStreakEarned: 0,
        unclaimedBalance: 0,
        mysteryBox: { isUnlocked: false, isOpened: false },
      });
    }

    const now = new Date();
    if (streak.lastCheckInDate && this.isSameDay(streak.lastCheckInDate, now)) {
      throw ApiError.badRequest('You have already checked in today! Come back tomorrow.');
    }

    // If streak was broken, reset to 0
    if (streak.lastCheckInDate && !this.isYesterday(streak.lastCheckInDate)) {
      streak.currentStreak = 0;
      streak.claimedDays = [];
    }

    // Advance streak (1 to 7)
    let nextStreak = streak.currentStreak + 1;
    if (nextStreak > 7) {
      nextStreak = 1;
      streak.claimedDays = [];
    }

    const rewardAmount = STREAK_REWARDS[nextStreak - 1];

    streak.currentStreak = nextStreak;
    streak.lastCheckInDate = now;
    if (!streak.claimedDays.includes(nextStreak)) {
      streak.claimedDays.push(nextStreak);
    }
    streak.totalStreakEarned += rewardAmount;
    streak.unclaimedBalance += rewardAmount;

    // Day 7 unlocks Mystery Box!
    if (nextStreak === 7) {
      streak.mysteryBox.isUnlocked = true;
    }

    await streak.save();

    // Rates for fiat calculation
    const rates: Record<string, number> = (await PricingService.getInrRates().catch(() => ({}))) as any;
    const xCoinRate = rates.ZAP || 108.37;
    const fiatVal = `₹ ${(rewardAmount * xCoinRate).toFixed(2)}`;

    await RewardHistory.create({
      userId: userObjId,
      title: `Day ${nextStreak} Daily Check-In`,
      amount: `+${rewardAmount} xCoin`,
      amountRaw: rewardAmount,
      fiatAmount: fiatVal,
      type: 'Streak',
      txHash: '0x' + new mongoose.Types.ObjectId().toString(),
    });

    return {
      success: true,
      day: nextStreak,
      rewardAmount,
      unlockedMysteryBox: nextStreak === 7,
      message: `Checked in successfully! Earned +${rewardAmount} xCoin.`,
    };
  }

  static async claimMission(userId: string, missionKey: string) {
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Atomic conditional check-and-claim: exactly one concurrent request can transition 'Claim' -> 'Claimed'
    const mission = await Mission.findOneAndUpdate(
      { userId: userObjId, missionKey, status: 'Claim' },
      { $set: { status: 'Claimed', claimedAt: new Date() } },
      { new: true }
    );

    if (!mission) {
      const existing = await Mission.findOne({ userId: userObjId, missionKey });
      if (!existing) {
        throw ApiError.notFound('Mission not found');
      }
      if (existing.status === 'Claimed') {
        throw ApiError.badRequest('This mission reward has already been claimed.');
      }
      throw ApiError.badRequest('Mission objectives not yet completed.');
    }

    // Credit directly to user's wallet atomically
    await this.creditWalletZap(userObjId, mission.rewardAmount);

    const rates: Record<string, number> = (await PricingService.getInrRates().catch(() => ({}))) as any;
    const xCoinRate = rates.ZAP || 108.37;
    const fiatVal = `₹ ${(mission.rewardAmount * xCoinRate).toFixed(2)}`;

    await RewardHistory.create({
      userId: userObjId,
      title: `Mission Completed: ${mission.title}`,
      amount: `+${mission.rewardAmount} xCoin`,
      amountRaw: mission.rewardAmount,
      fiatAmount: fiatVal,
      type: 'Task',
      txHash: '0x' + new mongoose.Types.ObjectId().toString(),
    });

    return {
      success: true,
      missionKey,
      rewardAmount: mission.rewardAmount,
      message: `Claimed +${mission.rewardAmount} xCoin for "${mission.title}"!`,
    };
  }

  static async openMysteryBox(userId: string) {
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Win random reward between 100 and 500
    const rewardsList = [100, 150, 200, 250, 300, 500];
    const rewardWon = rewardsList[Math.floor(Math.random() * rewardsList.length)];

    // Atomic conditional open: exactly one request can open the box
    const streak = await RewardStreak.findOneAndUpdate(
      {
        userId: userObjId,
        'mysteryBox.isUnlocked': true,
        'mysteryBox.isOpened': false,
      },
      {
        $set: {
          'mysteryBox.isOpened': true,
          'mysteryBox.openedAt': new Date(),
          'mysteryBox.rewardWon': rewardWon,
        },
      },
      { new: true }
    );

    if (!streak) {
      const existing = await RewardStreak.findOne({ userId: userObjId });
      if (!existing || !existing.mysteryBox.isUnlocked) {
        throw ApiError.badRequest('Mystery Box is currently locked. Complete a 7-day streak to unlock!');
      }
      throw ApiError.badRequest('You have already opened your Mystery Box!');
    }

    // Credit to wallet atomically
    await this.creditWalletZap(userObjId, rewardWon);

    const rates: Record<string, number> = (await PricingService.getInrRates().catch(() => ({}))) as any;
    const xCoinRate = rates.ZAP || 108.37;
    const fiatVal = `₹ ${(rewardWon * xCoinRate).toFixed(2)}`;

    await RewardHistory.create({
      userId: userObjId,
      title: '7-Day Streak Mystery Box Unlocked',
      amount: `+${rewardWon} xCoin`,
      amountRaw: rewardWon,
      fiatAmount: fiatVal,
      type: 'Mystery',
      txHash: '0x' + new mongoose.Types.ObjectId().toString(),
    });

    return {
      success: true,
      rewardWon,
      message: `🎉 Incredible! You won +${rewardWon} xCoin from the Mystery Box!`,
    };
  }

  static async claimAll(userId: string) {
    const userObjId = new mongoose.Types.ObjectId(userId);

    // 1. Streak unclaimed balance
    let totalClaimed = 0;
    const streak = await RewardStreak.findOne({ userId: userObjId });
    if (streak && streak.unclaimedBalance > 0) {
      totalClaimed += streak.unclaimedBalance;
      streak.unclaimedBalance = 0;
      await streak.save();
    }

    // 2. Claim pending missions
    const pendingMissions = await Mission.find({ userId: userObjId, status: 'Claim' });
    for (const m of pendingMissions) {
      totalClaimed += m.rewardAmount;
      m.status = 'Claimed';
      m.claimedAt = new Date();
      await m.save();
    }

    if (totalClaimed <= 0) {
      return {
        success: true,
        claimedAmount: 0,
        message: 'No rewards available to claim at this moment.',
      };
    }

    // Credit wallet
    await this.creditWalletZap(userObjId, totalClaimed);

    const rates: Record<string, number> = (await PricingService.getInrRates().catch(() => ({}))) as any;
    const xCoinRate = rates.ZAP || 108.37;
    const fiatVal = `₹ ${(totalClaimed * xCoinRate).toFixed(2)}`;

    await RewardHistory.create({
      userId: userObjId,
      title: 'Bulk Rewards Claim',
      amount: `+${totalClaimed} xCoin`,
      amountRaw: totalClaimed,
      fiatAmount: fiatVal,
      type: 'Airdrop',
      txHash: '0x' + new mongoose.Types.ObjectId().toString(),
    });

    return {
      success: true,
      claimedAmount: totalClaimed,
      message: `Successfully transferred +${totalClaimed} xCoin to your wallet!`,
    };
  }
}
