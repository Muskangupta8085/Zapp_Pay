import {
  LayoutDashboard,
  Users,
  Wallet,
  ArrowLeftRight,
  Receipt,
  ArrowDownCircle,
  ArrowUpCircle,
  Coins,
  Network,
  Gift,
  Bell,
  Megaphone,
  BookOpen,
  FileCheck2,
  UserCheck,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  category: 'CORE' | 'FINANCE' | 'COMMUNITY' | 'CMS & LEGAL' | 'SYSTEM';
  description?: string;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'blue';
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  // CORE
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    category: 'CORE',
    description: 'Real-time metrics & overview',
  },
  {
    id: 'users',
    label: 'Users',
    path: '/users',
    icon: Users,
    category: 'CORE',
    description: 'User accounts & KYC management',
  },
  {
    id: 'wallets',
    label: 'Wallets',
    path: '/wallet',
    icon: Wallet,
    category: 'CORE',
    description: 'Reserve & hot wallet pools',
  },

  // FINANCE & TRADING
  {
    id: 'orders',
    label: 'Orders',
    path: '/orders',
    icon: ArrowLeftRight,
    category: 'FINANCE',
    description: 'Live order book & trades',
  },
  {
    id: 'transactions',
    label: 'Transactions',
    path: '/transactions',
    icon: Receipt,
    category: 'FINANCE',
    description: 'Unified transaction ledger',
  },
  {
    id: 'deposits',
    label: 'Deposits',
    path: '/deposits',
    icon: ArrowDownCircle,
    category: 'FINANCE',
    description: 'Verify INR UPI & Bank deposits',
    badge: '18',
    badgeColor: 'amber',
  },
  {
    id: 'withdrawals',
    label: 'Withdrawals',
    path: '/withdrawals',
    icon: ArrowUpCircle,
    category: 'FINANCE',
    description: 'Approve & process payout requests',
    badge: '24',
    badgeColor: 'rose',
  },
  {
    id: 'xcoin',
    label: 'xCoin / Market',
    path: '/xcoin',
    icon: Coins,
    category: 'FINANCE',
    description: 'Rate tickers & liquidity limits',
  },

  // COMMUNITY & GROWTH
  {
    id: 'team',
    label: 'Team & Referrals',
    path: '/team',
    icon: Network,
    category: 'COMMUNITY',
    description: 'Referral trees & network growth',
  },
  {
    id: 'rewards',
    label: 'Rewards',
    path: '/rewards',
    icon: Gift,
    category: 'COMMUNITY',
    description: 'Reward campaigns & bonuses',
  },

  // CMS & COMMUNICATIONS
  {
    id: 'notifications',
    label: 'Notifications',
    path: '/notifications',
    icon: Bell,
    category: 'CMS & LEGAL',
    description: 'Push alerts & user notices',
    badge: '3',
    badgeColor: 'blue',
  },
  {
    id: 'announcements',
    label: 'Announcements',
    path: '/announcements',
    icon: Megaphone,
    category: 'CMS & LEGAL',
    description: 'Banners & splash popups',
  },
  {
    id: 'learning',
    label: 'Learning / CMS',
    path: '/learning',
    icon: BookOpen,
    category: 'CMS & LEGAL',
    description: 'User guides & FAQ library',
  },
  {
    id: 'policies',
    label: 'Policies',
    path: '/policies',
    icon: FileCheck2,
    category: 'CMS & LEGAL',
    description: 'Compliance & legal terms',
  },

  // SYSTEM & ACCESS
  {
    id: 'admin-team',
    label: 'Admin Team',
    path: '/roles',
    icon: UserCheck,
    category: 'SYSTEM',
    description: 'Admin team roles & access control',
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    category: 'SYSTEM',
    description: 'Platform fees, gates & settings',
  },
];
