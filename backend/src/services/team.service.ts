import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { Transaction } from '../models/transaction.model.js';
import { Wallet } from '../models/wallet.model.js';
import { Notification } from '../models/notification.model.js';
import { RewardHistory } from '../models/rewardHistory.model.js';
import { PricingService } from './pricing.service.js';
import { ApiError } from '../utils/apiError.js';

export interface TeamMemberItem {
  id: string;
  name: string;
  code: string;
  level: 'Level 1' | 'Level 2';
  levelLabel: string;
  joined: string;
  commission: string;
  commissionRaw: number;
  tradeVolume: string;
  status: 'Active' | 'Top Trader' | 'Trading Now';
  avatarBg: string;
  avatarText: string;
  isOnline: boolean;
  kycStatus: string;
}

const AVATAR_COLORS = ['#6366F1', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

export class TeamService {
  private static getAvatarInitials(name?: string): string {
    if (!name) return 'ZP';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  static async getTeamOverview(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const rates: Record<string, number> = (await PricingService.getInrRates().catch(() => ({}))) as any;
    const xCoinRate = rates.ZAP || 108.37;

    // 1. Fetch Direct Referrals (Level 1)
    const l1Users = await User.find({ referredBy: user.referralCode })
      .select('fullName referralCode createdAt kycStatus phone email')
      .sort({ createdAt: -1 })
      .lean();

    const l1Codes = l1Users.map((u) => u.referralCode).filter(Boolean);

    // 2. Fetch Sub-Referrals (Level 2)
    const l2Users = l1Codes.length > 0
      ? await User.find({ referredBy: { $in: l1Codes } })
          .select('fullName referralCode createdAt kycStatus phone email referredBy')
          .sort({ createdAt: -1 })
          .lean()
      : [];

    // Helper to calculate member stats
    const allMembers: TeamMemberItem[] = [];

    // Process L1 Members
    for (let i = 0; i < l1Users.length; i++) {
      const u: any = l1Users[i];
      const txCount = await Transaction.countDocuments({
        $or: [{ senderId: u._id }, { receiverId: u._id }],
        status: 'completed',
      });

      const memberStatus: 'Active' | 'Top Trader' | 'Trading Now' =
        txCount >= 5 ? 'Top Trader' : txCount >= 1 ? 'Trading Now' : 'Active';

      const baseCommission = 50.0; // 50 xCoin bonus per verified referral
      const commissionAmount = baseCommission + txCount * 12.5;

      allMembers.push({
        id: u._id.toString(),
        name: u.fullName || 'Zapp Member',
        code: `#${u.referralCode || 'ZP'}`,
        level: 'Level 1',
        levelLabel: 'Direct (10%)',
        joined: new Date(u.createdAt).toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        commission: `+${commissionAmount.toFixed(2)} xCoin`,
        commissionRaw: commissionAmount,
        tradeVolume: txCount > 0 ? `${txCount} Trades Completed` : 'Joined',
        status: memberStatus,
        avatarBg: AVATAR_COLORS[i % AVATAR_COLORS.length],
        avatarText: this.getAvatarInitials(u.fullName),
        isOnline: true,
        kycStatus: u.kycStatus || 'pending',
      });
    }

    // Process L2 Members
    for (let i = 0; i < l2Users.length; i++) {
      const u: any = l2Users[i];
      const txCount = await Transaction.countDocuments({
        $or: [{ senderId: u._id }, { receiverId: u._id }],
        status: 'completed',
      });

      const memberStatus: 'Active' | 'Top Trader' | 'Trading Now' =
        txCount >= 5 ? 'Top Trader' : txCount >= 1 ? 'Trading Now' : 'Active';

      const baseCommission = 25.0; // 25 xCoin sub-affiliate bonus
      const commissionAmount = baseCommission + txCount * 6.25;

      allMembers.push({
        id: u._id.toString(),
        name: u.fullName || 'Sub Affiliate',
        code: `#${u.referralCode || 'ZP'}`,
        level: 'Level 2',
        levelLabel: 'Sub-Affiliate (5%)',
        joined: new Date(u.createdAt).toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        commission: `+${commissionAmount.toFixed(2)} xCoin`,
        commissionRaw: commissionAmount,
        tradeVolume: txCount > 0 ? `${txCount} Trades Completed` : 'Joined',
        status: memberStatus,
        avatarBg: AVATAR_COLORS[(l1Users.length + i) % AVATAR_COLORS.length],
        avatarText: this.getAvatarInitials(u.fullName),
        isOnline: false,
        kycStatus: u.kycStatus || 'pending',
      });
    }

    const totalMembers = allMembers.length;
    const l1Count = l1Users.length;
    const l2Count = l2Users.length;
    const totalCommissionsRaw = allMembers.reduce((sum, m) => sum + m.commissionRaw, 0);

    return {
      overview: {
        totalMembers,
        l1Count,
        l2Count,
        totalCommissions: `+${totalCommissionsRaw.toFixed(2)} xCoin`,
        totalCommissionsRaw,
        fiatCommissions: `₹ ${(totalCommissionsRaw * xCoinRate).toFixed(2)}`,
        unclaimedAmount: totalCommissionsRaw.toFixed(2),
        referralCode: user.referralCode,
        referralLink: `https://zapppay.io/join?ref=${user.referralCode}`,
        directCommissionRate: '10%',
        subCommissionRate: '5%',
      },
      members: allMembers,
    };
  }

  static async claimCommission(userId: string) {
    const userObjId = new mongoose.Types.ObjectId(userId);
    const { overview } = await this.getTeamOverview(userId);

    const amountToClaim = overview.totalCommissionsRaw;
    if (amountToClaim <= 0) {
      throw ApiError.badRequest('No referral commission available to claim.');
    }

    // Credit user's wallet ZAP balance
    let wallet = await Wallet.findOne({ userId: userObjId });
    if (!wallet) {
      wallet = await Wallet.create({
        userId: userObjId,
        walletAddress: '0x' + new mongoose.Types.ObjectId().toString(),
        balances: [{ symbol: 'ZAP', amount: amountToClaim, lockedAmount: 0 }],
      });
    } else {
      const zapBal = wallet.balances.find((b) => b.symbol === 'ZAP');
      if (zapBal) {
        zapBal.amount += amountToClaim;
      } else {
        wallet.balances.push({ symbol: 'ZAP', amount: amountToClaim, lockedAmount: 0 });
      }
      await wallet.save();
    }

    const rates: Record<string, number> = (await PricingService.getInrRates().catch(() => ({}))) as any;
    const xCoinRate = rates.ZAP || 108.37;

    await RewardHistory.create({
      userId: userObjId,
      title: 'Affiliate Team Commission Settlement',
      amount: `+${amountToClaim.toFixed(2)} xCoin`,
      amountRaw: amountToClaim,
      fiatAmount: `₹ ${(amountToClaim * xCoinRate).toFixed(2)}`,
      type: 'Airdrop',
      txHash: '0x' + new mongoose.Types.ObjectId().toString(),
    });

    return {
      success: true,
      claimedAmount: amountToClaim,
      message: `Successfully transferred +${amountToClaim.toFixed(2)} xCoin affiliate commission to your wallet!`,
    };
  }

  static async boostMember(senderId: string, memberId: string) {
    const sender = await User.findById(senderId);
    const recipient = await User.findById(memberId);

    if (!recipient) {
      throw ApiError.notFound('Team member not found');
    }

    // Create an in-app notification for the member
    await Notification.create({
      userId: recipient._id,
      title: '🚀 Partner Trading Boost Active!',
      message: `${sender?.fullName || 'Your VIP partner'} has boosted your trade execution priority with a 20% discount on order fees!`,
      type: 'promo',
      read: false,
    });

    return {
      success: true,
      message: `Partner trading boost successfully sent to ${recipient.fullName || 'member'}!`,
    };
  }
}
