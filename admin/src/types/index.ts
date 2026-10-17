// Core Domain Types for Zapp Pay Admin Panel

export type StatusType = 'Pending' | 'Approved' | 'Completed' | 'Rejected' | 'Processing' | 'Cancelled' | 'Frozen' | 'Active' | 'Flagged';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Finance Admin' | 'Compliance Officer' | 'Support Agent';
  avatar?: string;
  phone?: string;
  lastLogin: string;
}

export interface AppUser {
  id: string;
  uid: string;
  name: string;
  phone: string;
  email: string;
  kycStatus: 'Verified' | 'Pending' | 'Rejected' | 'Not Submitted';
  accountStatus: 'Active' | 'Frozen' | 'Suspended';
  inrBalance: number;
  xcoinBalance: number;
  usdtBalance: number;
  referralCode: string;
  referredBy?: string;
  joinedAt: string;
  totalTradeVolume: number;
}

export interface DepositRecord {
  id: string;
  userUid: string;
  userName: string;
  amount: number;
  utrNumber: string;
  paymentMethod: 'UPI' | 'IMPS' | 'QR Pay';
  status: 'Pending' | 'Approved' | 'Rejected';
  timestamp: string;
  screenshotUrl?: string;
  notes?: string;
  verifiedBy?: string;
}

export interface WithdrawalRecord {
  id: string;
  userUid: string;
  userName: string;
  amount: number;
  method: 'Bank Transfer' | 'UPI';
  accountDetails: {
    bankName?: string;
    accountNo?: string;
    ifsc?: string;
    upiId?: string;
  };
  status: 'Pending' | 'Approved' | 'Processing' | 'Rejected';
  timestamp: string;
  payoutRef?: string;
}

export interface TradeOrder {
  id: string;
  userUid: string;
  userName: string;
  type: 'Buy' | 'Sell';
  asset: 'xCoin' | 'BTC' | 'ETH' | 'SOL' | 'USDT';
  cryptoAmount: number;
  fiatAmount: number;
  rate: number;
  status: 'Pending' | 'Completed' | 'Processing' | 'Cancelled';
  paymentMode: 'UPI' | 'Bank' | 'Vault';
  timestamp: string;
  txHash?: string;
}

export interface LiquidityWallet {
  asset: string;
  symbol: string;
  hotReserve: number;
  coldReserve: number;
  totalValueINR: number;
  address: string;
  status: 'Healthy' | 'Low Reserve' | 'Critical';
}

export interface PaymentVerificationItem {
  id: string;
  userUid: string;
  userName: string;
  type: 'UPI VPA' | 'Bank Account';
  details: string;
  holderName: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  submittedAt: string;
}

export interface XCoinConfig {
  currentPriceINR: number;
  currentPriceUSDT: number;
  change24h: number;
  buySpreadPct: number;
  sellSpreadPct: number;
  minBuyLimit: number;
  maxBuyLimit: number;
  minSellLimit: number;
  maxSellLimit: number;
  quoteLockSeconds: number;
  autoPriceEngine: boolean;
}

export interface TeamReferralMember {
  id: string;
  name: string;
  uid: string;
  uplineCode: string;
  uplineName: string;
  tier: 'Level 1' | 'Level 2';
  downlineCount: number;
  tradingVolume: number;
  commissionGenerated: number;
  joinedDate: string;
}

export interface CommissionClaim {
  id: string;
  uid: string;
  userName: string;
  amount: number;
  tier: 'Level 1' | 'Level 2';
  sourceVolume: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedAt: string;
}

export interface RewardStreakDay {
  day: number;
  rewardXCoin: number;
  isMega: boolean;
}

export interface BountyTask {
  id: string;
  title: string;
  rewardXCoin: number;
  targetCount: number;
  type: 'KYC' | 'Deposit' | 'Trades' | 'Referral';
  active: boolean;
}

export interface NotificationBroadcast {
  id: string;
  title: string;
  message: string;
  targetAudience: 'All Users' | 'KYC Verified' | 'Active Traders' | 'New Users';
  sentAt: string;
  status: 'Sent' | 'Scheduled' | 'Draft';
  clicks: number;
}

export interface RiskAlert {
  id: string;
  userUid: string;
  userName: string;
  severity: 'High' | 'Medium' | 'Critical';
  reason: string;
  flaggedDate: string;
  ipAddress: string;
  actionTaken: 'Monitored' | 'Frozen' | 'Blocked';
}

export interface AuditLogItem {
  id: string;
  adminName: string;
  adminRole: string;
  action: string;
  targetResource: string;
  ipAddress: string;
  timestamp: string;
  status: 'Success' | 'Failed';
}

export interface AdminRoleItem {
  id: string;
  name: string;
  usersAssigned: number;
  permissions: string[];
  description: string;
}

export type SettingsSubSection =
  | 'general'
  | 'trading'
  | 'wallet'
  | 'payments'
  | 'referrals'
  | 'notifications'
  | 'security'
  | 'admin-roles'
  | 'maintenance'
  | 'email'
  | 'system';
