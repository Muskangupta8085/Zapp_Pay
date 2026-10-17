import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserPlus,
  Receipt,
  Coins,
  ChevronDown,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRight,
  X,
  ShieldCheck,
  BarChart3,
  Check,
  Radio,
  Zap,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../api/adminApi';

interface ChartPoint {
  date: string;
  buy: number;
  sell: number;
  deposit: number;
  withdrawal: number;
}


interface ActivityItem {
  id: string;
  title: string;
  type: 'deposit' | 'withdrawal' | 'user' | 'order';
  amount: string;
  time: string;
  color: string;
  iconBg: string;
  icon: typeof ArrowDownLeft;
}

export const DashboardPage: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();

  // Dynamic Timeframe State
  const [selectedRange, setSelectedRange] = useState<'7D' | '30D' | '90D' | '1Y'>('7D');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [activeSeries, setActiveSeries] = useState<'all' | 'buy' | 'sell' | 'deposit' | 'withdrawal'>('all');
  const [activeDonutAsset, setActiveDonutAsset] = useState<'all' | 'inr' | 'usdt' | 'xcoin'>('all');


  // Dynamic Date Picker Dropdown
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  // Dynamic Modals for Quick Actions
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  // Dynamic Interactive Data (Initialized Cleanly from API, Not Hardcoded)
  const [userCount, setUserCount] = useState(0);
  const [pendingVerifications, setPendingVerifications] = useState(0);
  const [liveMetrics, setLiveMetrics] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  interface ApiKpiCard {
    key: string;
    title: string;
    value: string;
    change: string;
    isPositive: boolean;
    timeframe: string;
    sparklinePoints: number[];
  }
  const [apiKpiCards, setApiKpiCards] = useState<ApiKpiCard[]>([]);

  // Live Wallet Aggregation State
  const [walletData, setWalletData] = useState<{
    totalBalance: number;
    totalBalanceFormatted: string;
    inr: { amount: number; formatted: string; percent: string };
    usdt: { amount: number; formatted: string; percent: string };
    xcoin: { amount: number; formatted: string; percent: string };
  } | null>(null);

  // Quick Action Forms State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState('Standard Trader');

  const [depositUserEmail, setDepositUserEmail] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('UPI');
  const [depositUtr, setDepositUtr] = useState('');

  const [withdrawalUserEmail, setWithdrawalUserEmail] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('IMPS');
  const [withdrawalAccount, setWithdrawalAccount] = useState('');

  // Dynamic Recent Activities Feed (Directly populated from API)
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Dynamic Timeframe Range State (Calculated directly from API data)
  const [chartSummary, setChartSummary] = useState<{
    totalTxAmount: string;
    totalTxAmountFormatted: string;
    txTrend: string;
    dateLabel: string;
  } | null>(null);

  const getDynamicDateLabel = (range: '7D' | '30D' | '90D' | '1Y') => {
    const now = new Date();
    if (range === '7D') {
      const past = new Date(now.getTime() - 6 * 86400000);
      return `${past.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, ${now.getFullYear()}`;
    } else if (range === '30D') {
      const past = new Date(now.getTime() - 29 * 86400000);
      return `${past.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, ${now.getFullYear()}`;
    } else if (range === '90D') {
      const past = new Date(now.getTime() - 89 * 86400000);
      return `${past.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, ${now.getFullYear()}`;
    } else {
      return `Jan 01 - ${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, ${now.getFullYear()}`;
    }
  };

  const getDefaultChartPoints = (range: '7D' | '30D' | '90D' | '1Y'): ChartPoint[] => {
    const now = new Date();
    if (range === '7D') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now.getTime() - (6 - i) * 86400000);
        return {
          date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
          buy: 0,
          sell: 0,
          deposit: 0,
          withdrawal: 0,
        };
      });
    } else if (range === '30D') {
      return ['W1', 'W2', 'W3', 'W4'].map((w) => ({
        date: w,
        buy: 0,
        sell: 0,
        deposit: 0,
        withdrawal: 0,
      }));
    } else if (range === '90D') {
      return Array.from({ length: 3 }, (_, i) => {
        const d = new Date(now.getTime() - (2 - i) * 30 * 86400000);
        return {
          date: d.toLocaleDateString('en-GB', { month: 'short' }),
          buy: 0,
          sell: 0,
          deposit: 0,
          withdrawal: 0,
        };
      });
    } else {
      return ['Q1', 'Q2', 'Q3', 'Q4'].map((q) => ({
        date: q,
        buy: 0,
        sell: 0,
        deposit: 0,
        withdrawal: 0,
      }));
    }
  };

  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([]);

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        const res = await adminApi.getDashboardCharts(selectedRange);
        if (res.success && res.data?.points) {
          setChartPoints(res.data.points);
          if (res.data.summary) {
            setChartSummary(res.data.summary);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard charts', err);
      }
    };
    fetchCharts();
  }, [selectedRange]);

  const currentMeta = {
    dateLabel: chartSummary?.dateLabel || getDynamicDateLabel(selectedRange),
    totalTxAmount: chartSummary?.totalTxAmount || liveMetrics.totalVolume || '₹ 0.00',
    txTrend: chartSummary?.txTrend || '+0%',
  };
  const points = chartPoints.length > 0 ? chartPoints : getDefaultChartPoints(selectedRange);

  // Fetch Live Metrics on Mount & Auto-Refresh every 20s
  useEffect(() => {
    let isMounted = true;
    const fetchDashboardMetrics = async () => {
      try {
        const statsRes = await adminApi.getDashboardStats();
        if (isMounted && statsRes.success && statsRes.data) {
          const overview = statsRes.data.overview;
          if (overview) {
            setUserCount(overview.totalUsers || 0);
            setPendingVerifications(overview.pendingVerifications || 0);
            setLiveMetrics({
              totalUsers: Number(overview.totalUsers || 0).toLocaleString('en-IN'),
              activeUsers: Number(overview.activeUsers || 0).toLocaleString('en-IN'),
              totalTransactions: Number(overview.totalTransactions || 0).toLocaleString('en-IN'),
              totalRevenue: overview.totalRevenue || '₹ 0.00',
              totalVolume: overview.totalVolumeFormatted || '₹ 0',
            });
          }
          if (statsRes.data.walletOverview) {
            setWalletData(statsRes.data.walletOverview);
          }
          if (Array.isArray(statsRes.data.cards)) {
            setApiKpiCards(statsRes.data.cards);
          }
        }

        const actRes = await adminApi.getRecentActivities();
        if (isMounted && actRes.success && Array.isArray(actRes.data)) {
          setActivities(
            actRes.data.map((a: any) => ({
              id: a.id,
              title: a.title,
              type: a.type,
              amount: a.amount,
              time: a.timestamp ? new Date(a.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : a.time || 'Just now',
              color: a.color,
              iconBg: isDark ? 'rgba(37, 99, 235, 0.2)' : '#DBEAFE',
              icon: a.type === 'deposit' ? ArrowDownLeft : a.type === 'withdrawal' ? ArrowUpRight : Users,
            }))
          );
        }
      } catch (err) {
        console.error('Error loading dashboard metrics', err);
      }
    };

    fetchDashboardMetrics();
    const interval = setInterval(fetchDashboardMetrics, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isDark]);

  // Show auto-dismissing toast helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add User Form Submission (Calls Backend API)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    try {
      const res = await adminApi.quickCreateUser({
        fullName: newUserName.trim(),
        email: newUserEmail.trim(),
        phone: newUserPhone.trim() || undefined,
        role: newUserRole === 'Super Admin' ? 'superadmin' : 'user',
        initialBalance: 0,
      });

      if (res.success) {
        setUserCount((c) => c + 1);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPhone('');
        setShowAddUserModal(false);
        triggerToast(`User "${newUserName}" created and saved to DB!`);
        // Refresh activities
        const actRes = await adminApi.getRecentActivities();
        if (actRes.success && Array.isArray(actRes.data)) {
          setActivities(
            actRes.data.map((a: any) => ({
              id: a.id,
              title: a.title,
              type: a.type,
              amount: a.amount,
              time: a.time,
              color: a.color,
              iconBg: isDark ? 'rgba(37, 99, 235, 0.2)' : '#DBEAFE',
              icon: a.type === 'deposit' ? ArrowDownLeft : a.type === 'withdrawal' ? ArrowUpRight : Users,
            }))
          );
        }
      } else {
        triggerToast(`Error: ${res.error || 'Failed to create user'}`);
      }
    } catch {
      triggerToast('Error saving user to backend');
    }
  };

  // Handle Quick Deposit Approval (Calls Backend API)
  const handleApproveDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount) return;
    const rawAmount = parseFloat(depositAmount) || 0;

    try {
      const res = await adminApi.quickApproveDeposit({
        userEmail: depositUserEmail.trim() || undefined,
        amount: rawAmount,
        method: depositMethod,
        utrNumber: depositUtr.trim() || undefined,
        note: `Approved via Dashboard (${depositUserEmail || 'Deposit'})`,
      });

      if (res.success) {
        triggerToast(`Deposit of ₹${rawAmount.toLocaleString()} approved & credited!`);
        setShowDepositModal(false);
        setDepositUserEmail('');
        setDepositAmount('');
        setDepositUtr('');
        // Refresh stats
        const statsRes = await adminApi.getDashboardStats();
        if (statsRes.success && statsRes.data?.overview) {
          setUserCount(statsRes.data.overview.totalUsers || 0);
          setPendingVerifications(statsRes.data.overview.pendingVerifications || 0);
          setLiveMetrics({
            totalUsers: Number(statsRes.data.overview.totalUsers || 0).toLocaleString(),
            activeUsers: Number(statsRes.data.overview.activeUsers || 0).toLocaleString(),
            totalTransactions: Number(statsRes.data.overview.totalTransactions || 0).toLocaleString(),
            totalRevenue: statsRes.data.overview.totalRevenue || '₹ 0.00',
            totalVolume: statsRes.data.overview.totalVolumeFormatted || '₹ 0',
          });
          if (statsRes.data.walletOverview) setWalletData(statsRes.data.walletOverview);
        }
      } else {
        triggerToast(`Error: ${res.error || 'Failed to approve deposit'}`);
      }
    } catch {
      triggerToast('Error connecting to backend server');
    }
  };

  // Handle Quick Withdrawal Authorization (Calls Backend API)
  const handleAuthorizeWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawalAmount) return;
    const rawAmount = parseFloat(withdrawalAmount) || 0;

    try {
      const res = await adminApi.quickAuthorizeWithdrawal({
        userEmail: withdrawalUserEmail.trim() || undefined,
        amount: rawAmount,
        method: withdrawalMethod,
        bankOrUpi: withdrawalAccount.trim() || undefined,
        note: `Authorized via Dashboard (${withdrawalUserEmail || 'Payout'})`,
      });

      if (res.success) {
        triggerToast(`Instant payout of ₹${rawAmount.toLocaleString()} dispatched!`);
        setShowWithdrawalModal(false);
        setWithdrawalUserEmail('');
        setWithdrawalAmount('');
        setWithdrawalAccount('');
        // Refresh stats
        const statsRes = await adminApi.getDashboardStats();
        if (statsRes.success && statsRes.data?.overview) {
          setUserCount(statsRes.data.overview.totalUsers || 0);
          setPendingVerifications(statsRes.data.overview.pendingVerifications || 0);
          setLiveMetrics({
            totalUsers: Number(statsRes.data.overview.totalUsers || 0).toLocaleString(),
            activeUsers: Number(statsRes.data.overview.activeUsers || 0).toLocaleString(),
            totalTransactions: Number(statsRes.data.overview.totalTransactions || 0).toLocaleString(),
            totalRevenue: statsRes.data.overview.totalRevenue || '₹ 0.00',
            totalVolume: statsRes.data.overview.totalVolumeFormatted || '₹ 0',
          });
          if (statsRes.data.walletOverview) setWalletData(statsRes.data.walletOverview);
        }
      } else {
        triggerToast(`Error: ${res.error || 'Failed to process payout'}`);
      }
    } catch {
      triggerToast('Error connecting to backend server');
    }
  };

  // 4 Top Stats with Sparklines Data (100% Real API Data)
  const statCards = [
    {
      title: 'TOTAL USERS',
      value: apiKpiCards.find((c) => c.key === 'totalUsers')?.value || liveMetrics.totalUsers || String(userCount),
      change: apiKpiCards.find((c) => c.key === 'totalUsers')?.change || '+0%',
      isPositive: apiKpiCards.find((c) => c.key === 'totalUsers')?.isPositive ?? true,
      timeframe: apiKpiCards.find((c) => c.key === 'totalUsers')?.timeframe || 'live in database',
      icon: Users,
      iconColor: '#7C3AED',
      iconBg: isDark ? 'rgba(124, 58, 237, 0.2)' : '#EDE9FE',
      sparklineColor: '#8B5CF6',
      sparklinePoints: apiKpiCards.find((c) => c.key === 'totalUsers')?.sparklinePoints || [userCount, userCount, userCount, userCount, userCount, userCount, userCount],
    },
    {
      title: 'ACTIVE USERS',
      value: apiKpiCards.find((c) => c.key === 'activeUsers')?.value || liveMetrics.activeUsers || String(userCount),
      change: apiKpiCards.find((c) => c.key === 'activeUsers')?.change || '+0%',
      isPositive: apiKpiCards.find((c) => c.key === 'activeUsers')?.isPositive ?? true,
      timeframe: apiKpiCards.find((c) => c.key === 'activeUsers')?.timeframe || 'active accounts',
      icon: UserCheck,
      iconColor: '#10B981',
      iconBg: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
      sparklineColor: '#10B981',
      sparklinePoints: apiKpiCards.find((c) => c.key === 'activeUsers')?.sparklinePoints || [userCount, userCount, userCount, userCount, userCount, userCount, userCount],
    },
    {
      title: 'TOTAL TRANSACTIONS',
      value: apiKpiCards.find((c) => c.key === 'totalTransactions')?.value || liveMetrics.totalTransactions || '0',
      change: apiKpiCards.find((c) => c.key === 'totalTransactions')?.change || '+0%',
      isPositive: apiKpiCards.find((c) => c.key === 'totalTransactions')?.isPositive ?? true,
      timeframe: apiKpiCards.find((c) => c.key === 'totalTransactions')?.timeframe || 'this week vs last',
      icon: Receipt,
      iconColor: '#F59E0B',
      iconBg: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
      sparklineColor: '#F59E0B',
      sparklinePoints: apiKpiCards.find((c) => c.key === 'totalTransactions')?.sparklinePoints || [0, 0, 0, 0, 0, 0, 0],
    },
    {
      title: 'TOTAL REVENUE',
      value: apiKpiCards.find((c) => c.key === 'totalRevenue')?.value || liveMetrics.totalRevenue || '₹ 0.00',
      change: apiKpiCards.find((c) => c.key === 'totalRevenue')?.change || '+0%',
      isPositive: apiKpiCards.find((c) => c.key === 'totalRevenue')?.isPositive ?? true,
      timeframe: apiKpiCards.find((c) => c.key === 'totalRevenue')?.timeframe || 'this week vs last',
      icon: Coins,
      iconColor: '#EC4899',
      iconBg: isDark ? 'rgba(236, 72, 153, 0.2)' : '#FCE7F3',
      sparklineColor: '#EC4899',
      sparklinePoints: apiKpiCards.find((c) => c.key === 'totalRevenue')?.sparklinePoints || [0, 0, 0, 0, 0, 0, 0],
    },
  ];



  // Helper for generating smooth mini-sparkline SVG paths
  const generateSparklinePath = (data: number[], width = 84, height = 38) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pts = data.map((val, idx) => ({
      x: (idx / (data.length - 1)) * width,
      y: height - ((val - min) / range) * (height - 8) - 4,
    }));

    if (pts.length <= 1) return { path: '', area: '' };

    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const area = `${d} L ${width} ${height} L 0 ${height} Z`;
    return { path: d, area };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* ── Dynamic Toast Banner ── */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '32px',
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: '700',
            fontSize: '13.5px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <Check size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Top Greeting & Action Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ fontSize: '15px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: '500', marginBottom: '1px' }}>
            {new Date().getHours() < 12 ? 'Good morning,' : new Date().getHours() < 18 ? 'Good afternoon,' : 'Good evening,'}
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '900',
            color: isDark ? '#F8FAFC' : '#0F172A',
            letterSpacing: '-0.5px',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            lineHeight: 1.2
          }}>
            {user?.name || 'Administrator'} 👋
          </h1>
          <p style={{ fontSize: '13.5px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: '500', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Here's what's happening with Zapp pay today.</span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#10B981',
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
              padding: '2px 8px',
              borderRadius: '999px',
            }}>
              <Radio size={10} className="pulse" />
              Live Feed
            </span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', position: 'relative' }}>
          {/* Dynamic Date Range Selector with Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="btn btn-secondary btn-sm"
              style={{
                borderRadius: '999px',
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: '700',
                color: isDark ? '#F8FAFC' : '#334155',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                cursor: 'pointer',
              }}
            >
              <Calendar size={15} color={isDark ? '#94A3B8' : '#64748B'} />
              <span>{currentMeta.dateLabel}</span>
              <ChevronDown size={14} color="#94A3B8" />
            </button>

            {/* Floating Date Preset Selector */}
            {showDateDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  borderRadius: '14px',
                  boxShadow: isDark ? '0 12px 35px rgba(0, 0, 0, 0.6)' : '0 12px 30px rgba(0, 0, 0, 0.12)',
                  border: `1px solid ${isDark ? '#374151' : '#E2E8F0'}`,
                  padding: '8px',
                  width: '240px',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: '800', color: isDark ? '#94A3B8' : '#64748B', padding: '6px 10px', textTransform: 'uppercase' }}>
                  Select Time Range
                </div>
                {(['7D', '30D', '90D', '1Y'] as const).map((rng) => (
                  <button
                    key={rng}
                    onClick={() => {
                      setSelectedRange(rng);
                      setShowDateDropdown(false);
                      triggerToast(`Switched time range to ${getDynamicDateLabel(rng)}`);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: selectedRange === rng ? (isDark ? 'rgba(99, 102, 241, 0.25)' : '#EEF2FF') : 'transparent',
                      color: selectedRange === rng ? '#6366F1' : isDark ? '#F3F4F6' : '#334155',
                      fontWeight: selectedRange === rng ? '800' : '600',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span>{getDynamicDateLabel(rng)}</span>
                    {selectedRange === rng && <Check size={14} color="#6366F1" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Pending Verifications Button */}
          <Link
            to="/deposits"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              color: '#FFFFFF',
              borderRadius: '999px',
              padding: '9px 20px',
              fontSize: '13px',
              fontWeight: '800',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
          >
            <ShieldCheck size={16} />
            <span>Pending Verifications ({pendingVerifications})</span>
          </Link>
        </div>
      </div>

      {/* ── 4 Top KPI Stat Cards with Mini Sparklines ── */}
      <div className="stat-grid-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          const { path, area } = generateSparklinePath(card.sparklinePoints, 74, 30);
          const gradId = `sparkGrad_${idx}`;

          return (
            <div
              key={card.title}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '18px 20px',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: isDark ? '#111827' : '#FFFFFF',
                borderRadius: '16px',
                border: `1px solid ${isDark ? '#1F2937' : '#F1F5F9'}`,
                boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 4px 18px rgba(0, 0, 0, 0.03)',
                transition: 'all 0.2s ease',
                gap: '12px',
              }}
            >
              {/* Top Row: Icon + Title + Mini-Sparkline Graph */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '11px',
                      backgroundColor: card.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: card.iconColor,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={19} />
                  </div>
                  <span style={{
                    fontSize: '11.5px',
                    color: isDark ? '#94A3B8' : '#64748B',
                    fontWeight: '800',
                    letterSpacing: '0.4px',
                    textTransform: 'uppercase',
                  }}>
                    {card.title}
                  </span>
                </div>

                {/* Right Mini-Sparkline Graph */}
                <div style={{ width: '74px', height: '30px', flexShrink: 0 }}>
                  <svg viewBox="0 0 74 30" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    <defs>
                      <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={card.sparklineColor} stopOpacity={isDark ? 0.35 : 0.22} />
                        <stop offset="100%" stopColor={card.sparklineColor} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d={area} fill={`url(#${gradId})`} />
                    <path
                      d={path}
                      fill="none"
                      stroke={card.sparklineColor}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Bottom Row: Big Bold Metric + Trend Pill */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'nowrap', gap: '8px' }}>
                <div style={{
                  fontSize: '26px',
                  fontWeight: '900',
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  letterSpacing: '-0.5px',
                  lineHeight: 1.1,
                }}>
                  {card.value}
                </div>

                <div style={{
                  fontSize: '11px',
                  color: card.isPositive ? '#10B981' : '#EF4444',
                  fontWeight: '800',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: card.isPositive
                    ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5')
                    : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2'),
                  padding: '3px 8px',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                  <span>{card.isPositive ? '↑' : '↓'} {card.change}</span>
                  <span style={{ color: isDark ? '#64748B' : '#94A3B8', fontWeight: '600', fontSize: '10.5px' }}>{card.timeframe}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Middle Row: Transaction Overview (Left) + Wallet Overview (Right) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.1fr 1fr', gap: '22px' }}>
        
        {/* Left Card: Transaction Overview Multi-line Graph (Perfect Screenshot Match) */}
        <div
          className="card"
          style={{
            padding: '28px 32px',
            position: 'relative',
            backgroundColor: isDark ? '#111827' : '#FFFFFF',
            borderRadius: '24px',
            border: `1px solid ${isDark ? '#1F2937' : '#F1F5F9'}`,
            boxShadow: isDark
              ? '0 10px 35px -5px rgba(0, 0, 0, 0.5)'
              : '0 10px 35px -5px rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
            transition: 'all 0.2s ease',
          }}
        >
          {/* Header Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {/* Title with Squircle Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '13px',
                  backgroundColor: isDark ? 'rgba(124, 58, 237, 0.2)' : '#EDE9FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isDark ? '#A78BFA' : '#7C3AED',
                  flexShrink: 0,
                }}
              >
                <BarChart3 size={22} strokeWidth={2.2} />
              </div>
              <div>
                <h3 style={{
                  fontSize: '17px',
                  fontWeight: '900',
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  margin: 0,
                  letterSpacing: '-0.3px'
                }}>
                  Transaction Overview
                </h3>
                <div style={{
                  fontSize: '13px',
                  color: isDark ? '#94A3B8' : '#64748B',
                  fontWeight: '500',
                  marginTop: '2px'
                }}>
                  Your platform transactions at a glance
                </div>
              </div>
            </div>

            {/* Timeframe pill tabs (Matches screenshot capsule pill) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              padding: '4px',
              borderRadius: '999px',
              border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
              boxShadow: isDark ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}>
              {(['7D', '30D', '90D', '1Y'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setSelectedRange(t);
                    triggerToast(`Viewing data for ${getDynamicDateLabel(t)}`);
                  }}
                  style={{
                    border: 'none',
                    background: selectedRange === t ? '#5046E5' : 'transparent',
                    color: selectedRange === t ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B',
                    padding: '6px 16px',
                    borderRadius: '999px',
                    fontSize: '12.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: selectedRange === t ? '0 4px 14px rgba(80, 70, 229, 0.4)' : 'none'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Metric Amount & Badge Line (Matches screenshot) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                fontSize: '34px',
                fontWeight: '900',
                color: isDark ? '#F8FAFC' : '#0F172A',
                letterSpacing: '-0.8px',
                lineHeight: 1.1,
              }}>
                {currentMeta.totalTxAmount}
              </span>
              <span style={{
                fontSize: '12.5px',
                fontWeight: '800',
                color: '#10B981',
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#E6F9F0',
                padding: '4px 10px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
              }}>
                {currentMeta.txTrend}
              </span>
            </div>

            {/* Circular Chevron Down Button */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94A3B8',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              title="Change Date Preset"
            >
              <ChevronDown size={15} />
            </div>
          </div>

          {/* Subtitle Line: Total Transaction Amount (Oct 01 – Oct 07, 2026) */}
          <div style={{
            fontSize: '13px',
            color: isDark ? '#94A3B8' : '#64748B',
            fontWeight: '500',
            marginBottom: '18px',
          }}>
            Total Transaction Amount ({currentMeta.dateLabel})
          </div>

          {/* Interactive Legend Row (Matches screenshot dot colors) */}
          <div style={{
            display: 'flex',
            gap: '24px',
            fontSize: '13px',
            fontWeight: '700',
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            {[
              { id: 'buy', label: 'Buy', color: '#5B50E8' },
              { id: 'sell', label: 'Sell', color: '#00C2FF' },
              { id: 'deposit', label: 'Deposit', color: '#EC4899' },
              { id: 'withdrawal', label: 'Withdrawal', color: '#FF7A00' },
            ].map((s) => {
              const isSelected = activeSeries === 'all' || activeSeries === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setActiveSeries(activeSeries === s.id ? 'all' : (s.id as any))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    opacity: isSelected ? 1 : 0.35,
                    transition: 'all 0.15s ease',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    backgroundColor: activeSeries === s.id ? (isDark ? 'rgba(91, 80, 232, 0.2)' : 'rgba(91, 80, 232, 0.08)') : 'transparent',
                  }}
                  title={`Filter by ${s.label}`}
                >
                  <div style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    backgroundColor: s.color,
                    boxShadow: isSelected ? `0 0 8px ${s.color}` : 'none'
                  }} />
                  <span style={{ color: isSelected ? (isDark ? '#F8FAFC' : '#1E293B') : '#94A3B8' }}>{s.label}</span>
                </div>
              );
            })}
          </div>

          {/* Spline Multi-Line Chart with Nodes & Glowing Areas */}
          <div
            style={{ width: '100%', height: '270px', position: 'relative' }}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {(() => {
              const W = 780;
              const H = 250;
              const padLeft = 56;
              const padRight = 20;
              const padTop = 16;
              const padBottom = 34;
              const chartW = W - padLeft - padRight;
              const chartH = H - padTop - padBottom;
              const baselineY = padTop + chartH;

              const allValues = points.flatMap((p) => [p.buy, p.sell, p.deposit, p.withdrawal]);
              const peakValue = Math.max(...allValues, 0);
              const maxVal = peakValue > 0 ? Math.ceil(peakValue * 1.15) : 1000;

              const formatAxisLabel = (v: number) => {
                if (v >= 10000000) return `₹ ${(v / 10000000).toFixed(1)}Cr`;
                if (v >= 100000) return `₹ ${(v / 100000).toFixed(1)}L`;
                if (v >= 1000) return `₹ ${(v / 1000).toFixed(0)}K`;
                return `₹ ${Math.round(v)}`;
              };

              const axisLabels = [
                formatAxisLabel(maxVal),
                formatAxisLabel(maxVal * 0.66),
                formatAxisLabel(maxVal * 0.33),
                '₹ 0',
              ];

              const getX = (idx: number) =>
                padLeft + (idx * chartW) / (points.length - 1 || 1);

              const getY = (val: number) =>
                padTop + chartH * (1 - Math.min(val, maxVal) / maxVal);

              const buyPts = points.map((p, i) => ({ x: getX(i), y: getY(p.buy) }));
              const sellPts = points.map((p, i) => ({ x: getX(i), y: getY(p.sell) }));
              const depositPts = points.map((p, i) => ({ x: getX(i), y: getY(p.deposit) }));
              const withdrawalPts = points.map((p, i) => ({ x: getX(i), y: getY(p.withdrawal) }));

              const getSpline = (pts: { x: number; y: number }[]) => {
                if (pts.length <= 1) return '';
                let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
                for (let i = 0; i < pts.length - 1; i++) {
                  const p0 = i > 0 ? pts[i - 1] : pts[i];
                  const p1 = pts[i];
                  const p2 = pts[i + 1];
                  const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

                  const cp1x = p1.x + (p2.x - p0.x) / 6;
                  const cp1y = p1.y + (p2.y - p0.y) / 6;
                  const cp2x = p2.x - (p3.x - p1.x) / 6;
                  const cp2y = p2.y - (p3.y - p1.y) / 6;

                  d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
                }
                return d;
              };

              const buySpline = getSpline(buyPts);
              const sellSpline = getSpline(sellPts);
              const depositSpline = getSpline(depositPts);
              const withdrawalSpline = getSpline(withdrawalPts);

              const buyArea = buySpline
                ? `${buySpline} L ${buyPts[buyPts.length - 1].x.toFixed(1)} ${baselineY} L ${buyPts[0].x.toFixed(1)} ${baselineY} Z`
                : '';

              const depositArea = depositSpline
                ? `${depositSpline} L ${depositPts[depositPts.length - 1].x.toFixed(1)} ${baselineY} L ${depositPts[0].x.toFixed(1)} ${baselineY} Z`
                : '';

              const activeX = hoveredIdx !== null ? getX(hoveredIdx) : 0;

              return (
                <svg
                  viewBox={`0 0 ${W} ${H}`}
                  style={{ width: '100%', height: '100%', overflow: 'visible', cursor: 'crosshair' }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const relX = (e.clientX - rect.left) / rect.width * W;
                    let closestIdx = 0;
                    let closestDist = Infinity;
                    points.forEach((_, i) => {
                      const dist = Math.abs(getX(i) - relX);
                      if (dist < closestDist) {
                        closestDist = dist;
                        closestIdx = i;
                      }
                    });
                    setHoveredIdx(closestIdx);
                  }}
                >
                  <defs>
                    <linearGradient id="purpleBuyAreaPerfect" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5B50E8" stopOpacity={isDark ? 0.35 : 0.22} />
                      <stop offset="60%" stopColor="#5B50E8" stopOpacity={isDark ? 0.08 : 0.04} />
                      <stop offset="100%" stopColor="#5B50E8" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="pinkDepositAreaPerfect" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EC4899" stopOpacity={isDark ? 0.2 : 0.12} />
                      <stop offset="100%" stopColor="#EC4899" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Dashed Grid lines */}
                  {axisLabels.map((lbl, idx) => {
                    const y = padTop + (idx * chartH) / (axisLabels.length - 1);
                    return (
                      <g key={lbl + idx}>
                        <line
                          x1={padLeft}
                          y1={y}
                          x2={W - padRight}
                          y2={y}
                          stroke={isDark ? 'rgba(255, 255, 255, 0.06)' : '#EEF2F6'}
                          strokeDasharray={idx === axisLabels.length - 1 ? 'none' : '4 4'}
                          strokeWidth="1.2"
                        />
                        <text
                          x={padLeft - 10}
                          y={y + 4}
                          textAnchor="end"
                          fontSize="11"
                          fill={isDark ? '#64748B' : '#94A3B8'}
                          fontWeight="700"
                          fontFamily="var(--font-sans)"
                        >
                          {lbl}
                        </text>
                      </g>
                    );
                  })}

                  {/* Spline Area Glow Fills */}
                  {(activeSeries === 'all' || activeSeries === 'buy') && buyArea && (
                    <path d={buyArea} fill="url(#purpleBuyAreaPerfect)" />
                  )}

                  {(activeSeries === 'all' || activeSeries === 'deposit') && depositArea && (
                    <path d={depositArea} fill="url(#pinkDepositAreaPerfect)" />
                  )}

                  {/* Spline Curves */}
                  {(activeSeries === 'all' || activeSeries === 'buy') && (
                    <path
                      d={buySpline}
                      fill="none"
                      stroke="#5B50E8"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {(activeSeries === 'all' || activeSeries === 'sell') && (
                    <path
                      d={sellSpline}
                      fill="none"
                      stroke="#00C2FF"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {(activeSeries === 'all' || activeSeries === 'deposit') && (
                    <path
                      d={depositSpline}
                      fill="none"
                      stroke="#EC4899"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {(activeSeries === 'all' || activeSeries === 'withdrawal') && (
                    <path
                      d={withdrawalSpline}
                      fill="none"
                      stroke="#FF7A00"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Visible Data Nodes along curves (Exact Screenshot Match) */}
                  {points.map((_, i) => (
                    <g key={i}>
                      {(activeSeries === 'all' || activeSeries === 'buy') && (
                        <circle
                          cx={buyPts[i].x}
                          cy={buyPts[i].y}
                          r="4"
                          fill="#5B50E8"
                          stroke={isDark ? '#111827' : '#FFFFFF'}
                          strokeWidth="2.2"
                        />
                      )}
                      {(activeSeries === 'all' || activeSeries === 'deposit') && (
                        <circle
                          cx={depositPts[i].x}
                          cy={depositPts[i].y}
                          r="3.8"
                          fill="#EC4899"
                          stroke={isDark ? '#111827' : '#FFFFFF'}
                          strokeWidth="2.2"
                        />
                      )}
                      {(activeSeries === 'all' || activeSeries === 'sell') && (
                        <circle
                          cx={sellPts[i].x}
                          cy={sellPts[i].y}
                          r="3.8"
                          fill="#00C2FF"
                          stroke={isDark ? '#111827' : '#FFFFFF'}
                          strokeWidth="2.2"
                        />
                      )}
                      {(activeSeries === 'all' || activeSeries === 'withdrawal') && (
                        <circle
                          cx={withdrawalPts[i].x}
                          cy={withdrawalPts[i].y}
                          r="3.8"
                          fill="#FF7A00"
                          stroke={isDark ? '#111827' : '#FFFFFF'}
                          strokeWidth="2.2"
                        />
                      )}
                    </g>
                  ))}

                  {/* Hover indicator cursor line & glowing node */}
                  {hoveredIdx !== null && (
                    <g>
                      <line
                        x1={activeX}
                        y1={padTop}
                        x2={activeX}
                        y2={baselineY}
                        stroke="#5B50E8"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                      <circle cx={activeX} cy={buyPts[hoveredIdx].y} r="8" fill="rgba(91, 80, 232, 0.25)" />
                      <circle cx={activeX} cy={buyPts[hoveredIdx].y} r="5" fill="#5B50E8" stroke={isDark ? '#111827' : '#FFFFFF'} strokeWidth="2.5" />
                    </g>
                  )}

                  {/* X-Axis Date Labels aligned with columns */}
                  {points.map((p, i) => (
                    <text
                      key={p.date}
                      x={getX(i)}
                      y={baselineY + 22}
                      textAnchor="middle"
                      fontSize="12"
                      fill={hoveredIdx === i ? (isDark ? '#F8FAFC' : '#0F172A') : (isDark ? '#64748B' : '#94A3B8')}
                      fontWeight={hoveredIdx === i ? '800' : '600'}
                      fontFamily="var(--font-sans)"
                    >
                      {p.date}
                    </text>
                  ))}
                </svg>
              );
            })()}

            {/* High-Contrast Floating Tooltip on Hover */}
            {hoveredIdx !== null && (
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '16px',
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '12px',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  pointerEvents: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  minWidth: '180px',
                  zIndex: 20,
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  paddingBottom: '5px',
                  marginBottom: '2px',
                }}>
                  <span style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '700' }}>
                    {points[hoveredIdx].date}
                  </span>
                  <span style={{ fontSize: '10px', color: '#10B981', fontWeight: '800' }}>Live</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Buy:</span>
                  <span style={{ fontWeight: '800', color: '#FFFFFF' }}>
                    ₹ {points[hoveredIdx].buy.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Sell:</span>
                  <span style={{ fontWeight: '800', color: '#FFFFFF' }}>
                    ₹ {points[hoveredIdx].sell.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Deposit:</span>
                  <span style={{ fontWeight: '800', color: '#FFFFFF' }}>
                    ₹ {points[hoveredIdx].deposit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Withdrawal:</span>
                  <span style={{ fontWeight: '800', color: '#FFFFFF' }}>
                    ₹ {points[hoveredIdx].withdrawal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Wallet Overview with Indigo Wave Banner */}
        <div
          className="card"
          style={{
            padding: 0,
            overflow: 'hidden',
            backgroundColor: isDark ? '#111827' : '#FFFFFF',
            borderRadius: '16px',
            border: `1px solid ${isDark ? '#1F2937' : '#F1F5F9'}`,
            boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 4px 18px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Dark Purple Wave Header Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
              padding: '20px 22px 26px',
              color: '#FFFFFF',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <ShieldCheck size={16} color="#FFFFFF" />
                </div>
                <span style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '0.2px' }}>
                  Wallet Overview
                </span>
              </div>

              <Link
                to="/wallets"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  transition: 'background 0.15s ease',
                }}
                title="View All Wallets"
              >
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Total Balance */}
            <div style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '-0.5px' }}>
              {walletData ? walletData.totalBalanceFormatted : '₹ 0'}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.75)', fontWeight: '600' }}>
              Total Platform Balance
            </div>

            {/* Bottom smooth SVG curve mask transition */}
            <svg
              viewBox="0 0 400 30"
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                width: '100%',
                height: '18px',
                pointerEvents: 'none',
              }}
            >
              <path
                d="M 0 30 Q 200 0 400 30 L 400 30 L 0 30 Z"
                fill={isDark ? '#111827' : '#FFFFFF'}
              />
            </svg>
          </div>

          {/* Donut Chart & Breakdown Area */}
          <div style={{ padding: '16px 22px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Segmented Donut Chart Centered */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  {/* Background Ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke={isDark ? '#1E293B' : '#F1F5F9'}
                    strokeWidth="11"
                  />

                  {/* Segment 1: INR Fiat */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#6366F1"
                    strokeWidth={activeDonutAsset === 'inr' ? '13' : '11'}
                    strokeDasharray={walletData ? `${Math.max(1, (parseFloat(walletData.inr.percent || '0') / 100) * 238.7)} 238.7` : '129 238.7'}
                    strokeDashoffset="0"
                    style={{
                      transition: 'stroke-width 0.2s ease',
                      cursor: 'pointer',
                      filter: activeDonutAsset === 'inr' ? 'drop-shadow(0 0 6px #6366F1)' : 'none',
                    }}
                    onMouseEnter={() => setActiveDonutAsset('inr')}
                    onMouseLeave={() => setActiveDonutAsset('all')}
                  />

                  {/* Segment 2: USDT (Tether) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#EC4899"
                    strokeWidth={activeDonutAsset === 'usdt' ? '13' : '11'}
                    strokeDasharray={walletData ? `${Math.max(1, (parseFloat(walletData.usdt.percent || '0') / 100) * 238.7)} 238.7` : '3 238.7'}
                    strokeDashoffset="-130"
                    style={{
                      transition: 'stroke-width 0.2s ease',
                      cursor: 'pointer',
                      filter: activeDonutAsset === 'usdt' ? 'drop-shadow(0 0 6px #EC4899)' : 'none',
                    }}
                    onMouseEnter={() => setActiveDonutAsset('usdt')}
                    onMouseLeave={() => setActiveDonutAsset('all')}
                  />

                  {/* Segment 3: xCoin */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth={activeDonutAsset === 'xcoin' ? '13' : '11'}
                    strokeDasharray={walletData ? `${Math.max(1, (parseFloat(walletData.xcoin.percent || '0') / 100) * 238.7)} 238.7` : '106 238.7'}
                    strokeDashoffset="-134"
                    style={{
                      transition: 'stroke-width 0.2s ease',
                      cursor: 'pointer',
                      filter: activeDonutAsset === 'xcoin' ? 'drop-shadow(0 0 6px #F59E0B)' : 'none',
                    }}
                    onMouseEnter={() => setActiveDonutAsset('xcoin')}
                    onMouseLeave={() => setActiveDonutAsset('all')}
                  />
                </svg>

                {/* Dynamic Center Cutout Text */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  pointerEvents: 'none',
                }}>
                  {activeDonutAsset === 'inr' ? (
                    <>
                      <span style={{ fontSize: '18px', fontWeight: '900', color: '#6366F1' }}>
                        {walletData ? `${walletData.inr.percent}%` : '0%'}
                      </span>
                      <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: '800' }}>INR FIAT</span>
                    </>
                  ) : activeDonutAsset === 'usdt' ? (
                    <>
                      <span style={{ fontSize: '18px', fontWeight: '900', color: '#EC4899' }}>
                        {walletData ? `${walletData.usdt.percent}%` : '0%'}
                      </span>
                      <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: '800' }}>USDT</span>
                    </>
                  ) : activeDonutAsset === 'xcoin' ? (
                    <>
                      <span style={{ fontSize: '18px', fontWeight: '900', color: '#F59E0B' }}>
                        {walletData ? `${walletData.xcoin.percent}%` : '0%'}
                      </span>
                      <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: '800' }}>xCOIN</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '16px', fontWeight: '900', color: isDark ? '#F8FAFC' : '#0F172A', lineHeight: 1.1 }}>
                        {walletData ? walletData.totalBalanceFormatted : '₹ 0'}
                      </span>
                      <span style={{ fontSize: '9px', color: '#94A3B8', fontWeight: '800', letterSpacing: '0.4px', marginTop: '2px' }}>
                        TOTAL BALANCE
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Breakdown Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Row 1: INR Fiat */}
              <div
                onMouseEnter={() => setActiveDonutAsset('inr')}
                onMouseLeave={() => setActiveDonutAsset('all')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '7px 10px',
                  borderRadius: '10px',
                  backgroundColor: activeDonutAsset === 'inr' ? (isDark ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF') : (isDark ? '#1E293B' : '#F8FAFC'),
                  border: activeDonutAsset === 'inr' ? '1px solid #6366F1' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366F1' }} />
                  <span style={{ color: isDark ? '#F8FAFC' : '#1E293B', fontWeight: '700', fontSize: '12.5px' }}>INR Fiat</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '900', color: isDark ? '#F8FAFC' : '#0F172A', fontSize: '12.5px' }}>
                    {walletData ? walletData.inr.formatted : '₹ 0'}
                  </div>
                  <div style={{ fontSize: '10px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: '700' }}>
                    {walletData ? `${walletData.inr.percent}%` : '0.0%'}
                  </div>
                </div>
              </div>

              {/* Row 2: USDT (Tether) */}
              <div
                onMouseEnter={() => setActiveDonutAsset('usdt')}
                onMouseLeave={() => setActiveDonutAsset('all')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '7px 10px',
                  borderRadius: '10px',
                  backgroundColor: activeDonutAsset === 'usdt' ? (isDark ? 'rgba(236, 72, 153, 0.2)' : '#FDF2F8') : (isDark ? '#1E293B' : '#F8FAFC'),
                  border: activeDonutAsset === 'usdt' ? '1px solid #EC4899' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EC4899' }} />
                  <span style={{ color: isDark ? '#F8FAFC' : '#1E293B', fontWeight: '700', fontSize: '12.5px' }}>USDT (Tether)</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '900', color: isDark ? '#F8FAFC' : '#0F172A', fontSize: '12.5px' }}>
                    {walletData ? walletData.usdt.formatted : '₹ 0'}
                  </div>
                  <div style={{ fontSize: '10px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: '700' }}>
                    {walletData ? `${walletData.usdt.percent}%` : '0.0%'}
                  </div>
                </div>
              </div>

              {/* Row 3: xCoin */}
              <div
                onMouseEnter={() => setActiveDonutAsset('xcoin')}
                onMouseLeave={() => setActiveDonutAsset('all')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '7px 10px',
                  borderRadius: '10px',
                  backgroundColor: activeDonutAsset === 'xcoin' ? (isDark ? 'rgba(245, 158, 11, 0.2)' : '#FFFBEB') : (isDark ? '#1E293B' : '#F8FAFC'),
                  border: activeDonutAsset === 'xcoin' ? '1px solid #F59E0B' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                  <span style={{ color: isDark ? '#F8FAFC' : '#1E293B', fontWeight: '700', fontSize: '12.5px' }}>xCoin</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '900', color: isDark ? '#F8FAFC' : '#0F172A', fontSize: '12.5px' }}>
                    {walletData ? walletData.xcoin.formatted : '₹ 0'}
                  </div>
                  <div style={{ fontSize: '10px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: '700' }}>
                    {walletData ? `${walletData.xcoin.percent}%` : '0.0%'}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ── Bottom Section: Quick Operations & Treasury Console (Left) + Live Recent Activities (Right) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.1fr 1fr', gap: '22px', alignItems: 'stretch' }}>
        
        {/* Left: Operations & Treasury Command Hub */}
        <div
          className="card"
          style={{
            padding: '22px 24px',
            backgroundColor: isDark ? '#111827' : '#FFFFFF',
            borderRadius: '16px',
            border: `1px solid ${isDark ? '#1F2937' : '#F1F5F9'}`,
            boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 4px 18px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '18px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%)'
                    : 'linear-gradient(135deg, #EEF2FF 0%, #EDE9FE 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isDark ? '#A78BFA' : '#6366F1',
                }}
              >
                <Zap size={19} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '900', color: isDark ? '#F8FAFC' : '#0F172A', margin: 0, letterSpacing: '-0.2px' }}>
                  Quick Operations & Treasury Hub
                </h3>
                <p style={{ fontSize: '11.5px', color: isDark ? '#94A3B8' : '#64748B', margin: '2px 0 0 0', fontWeight: '500' }}>
                  Execute direct administrative actions & monitor live payment rail telemetry
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '20px',
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'}`,
                color: isDark ? '#34D399' : '#059669',
                fontSize: '11.5px',
                fontWeight: '700',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  boxShadow: '0 0 8px #10B981',
                }}
              />
              Live Rails Active
            </div>
          </div>

          {/* 4 Interactive Action Cards Grid (2x2) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            
            {/* Action 1: Add User */}
            <div
              onClick={() => setShowAddUserModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 18px',
                borderRadius: '14px',
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = '#7C3AED';
                e.currentTarget.style.boxShadow = isDark ? '0 8px 22px rgba(124, 58, 237, 0.25)' : '0 8px 22px rgba(124, 58, 237, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = isDark ? '#334155' : '#E2E8F0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: isDark ? 'rgba(124, 58, 237, 0.2)' : '#EDE9FE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDark ? '#A78BFA' : '#7C3AED',
                    flexShrink: 0,
                  }}
                >
                  <UserPlus size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: isDark ? '#F8FAFC' : '#0F172A' }}>
                    Add Trader Account
                  </div>
                  <div style={{ fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: '500', marginTop: '2px' }}>
                    Onboard new user & verify KYC
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: isDark ? '#A78BFA' : '#7C3AED',
                  backgroundColor: isDark ? 'rgba(124, 58, 237, 0.15)' : '#F5F3FF',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  whiteSpace: 'nowrap',
                }}
              >
                + Onboard
              </div>
            </div>

            {/* Action 2: New Deposit */}
            <div
              onClick={() => setShowDepositModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 18px',
                borderRadius: '14px',
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = '#10B981';
                e.currentTarget.style.boxShadow = isDark ? '0 8px 22px rgba(16, 185, 129, 0.25)' : '0 8px 22px rgba(16, 185, 129, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = isDark ? '#334155' : '#E2E8F0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDark ? '#34D399' : '#059669',
                    flexShrink: 0,
                  }}
                >
                  <ArrowDownLeft size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: isDark ? '#F8FAFC' : '#0F172A' }}>
                    Credit Deposit
                  </div>
                  <div style={{ fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: '500', marginTop: '2px' }}>
                    Direct UPI & IMPS balance credit
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: isDark ? '#34D399' : '#059669',
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  whiteSpace: 'nowrap',
                }}
              >
                + Deposit
              </div>
            </div>

            {/* Action 3: New Withdrawal */}
            <div
              onClick={() => setShowWithdrawalModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 18px',
                borderRadius: '14px',
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = '#EC4899';
                e.currentTarget.style.boxShadow = isDark ? '0 8px 22px rgba(236, 72, 153, 0.25)' : '0 8px 22px rgba(236, 72, 153, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = isDark ? '#334155' : '#E2E8F0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: isDark ? 'rgba(236, 72, 153, 0.2)' : '#FCE7F3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDark ? '#F472B6' : '#DB2777',
                    flexShrink: 0,
                  }}
                >
                  <ArrowUpRight size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: isDark ? '#F8FAFC' : '#0F172A' }}>
                    Process Payout
                  </div>
                  <div style={{ fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: '500', marginTop: '2px' }}>
                    Issue manual bank withdrawal
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: isDark ? '#F472B6' : '#DB2777',
                  backgroundColor: isDark ? 'rgba(236, 72, 153, 0.15)' : '#FDF2F8',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  whiteSpace: 'nowrap',
                }}
              >
                + Payout
              </div>
            </div>

            {/* Action 4: View Transactions */}
            <Link
              to="/transactions"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 18px',
                borderRadius: '14px',
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = '#3B82F6';
                e.currentTarget.style.boxShadow = isDark ? '0 8px 22px rgba(59, 130, 246, 0.25)' : '0 8px 22px rgba(59, 130, 246, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = isDark ? '#334155' : '#E2E8F0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isDark ? '#60A5FA' : '#2563EB',
                    flexShrink: 0,
                  }}
                >
                  <Receipt size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: isDark ? '#F8FAFC' : '#0F172A' }}>
                    Audit Ledger
                  </div>
                  <div style={{ fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: '500', marginTop: '2px' }}>
                    Inspect full transaction stream
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: isDark ? '#60A5FA' : '#2563EB',
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  whiteSpace: 'nowrap',
                }}
              >
                Inspect →
              </div>
            </Link>

          </div>

          {/* System Telemetry & Rail Health Status Bar */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : '#F8FAFC',
              border: `1px solid ${isDark ? '#1E293B' : '#E2E8F0'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={13} color={isDark ? '#A78BFA' : '#6366F1'} />
                <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', color: isDark ? '#94A3B8' : '#64748B' }}>
                  Gateway Health & Telemetry
                </span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: isDark ? '#34D399' : '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} />
                99.98% Rail Uptime
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: isDark ? '#111827' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#1F2937' : '#EEF2F6'}`,
                }}
              >
                <div style={{ fontSize: '10.5px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: '600' }}>UPI Instant Rail</div>
                <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#10B981', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                  Operational
                </div>
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: isDark ? '#111827' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#1F2937' : '#EEF2F6'}`,
                }}
              >
                <div style={{ fontSize: '10.5px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: '600' }}>IMPS Payout Rail</div>
                <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#10B981', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                  ~42s Finality
                </div>
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: isDark ? '#111827' : '#FFFFFF',
                  border: `1px solid ${isDark ? '#1F2937' : '#EEF2F6'}`,
                }}
              >
                <div style={{ fontSize: '10.5px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: '600' }}>Vault Security</div>
                <div style={{ fontSize: '12.5px', fontWeight: '800', color: isDark ? '#60A5FA' : '#2563EB', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ShieldCheck size={13} />
                  Tier-3 Multi-Sig
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right: Live Recent Activities Card */}
        <div
          className="card"
          style={{
            padding: '22px 24px',
            backgroundColor: isDark ? '#111827' : '#FFFFFF',
            borderRadius: '16px',
            border: `1px solid ${isDark ? '#1F2937' : '#F1F5F9'}`,
            boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 4px 18px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '900', color: isDark ? '#F8FAFC' : '#0F172A', margin: 0, letterSpacing: '-0.2px' }}>
              Recent Activities
            </h3>
            <Link
              to="/transactions"
              style={{
                fontSize: '12px',
                fontWeight: '700',
                color: isDark ? '#A78BFA' : '#7C3AED',
                textDecoration: 'none',
              }}
            >
              View All
            </Link>
          </div>

          {/* Activities List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', flex: 1, justifyContent: activities.length > 0 ? 'space-between' : 'center' }}>
            {activities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: isDark ? '#94A3B8' : '#64748B', fontSize: '13px', fontWeight: '500' }}>
                No recent transactions or activities yet.
              </div>
            ) : (
              activities.map((act) => {
                const Icon = act.icon;
                return (
                  <div
                    key={act.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isDark ? '#1E293B' : '#F8FAFC';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: act.iconBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: act.color,
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <span style={{ fontSize: '12.5px', fontWeight: '700', color: isDark ? '#F1F5F9' : '#1E293B' }}>
                        {act.title}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: '800', color: act.color }}>
                        {act.amount}
                      </div>
                      <div style={{ fontSize: '10.5px', color: isDark ? '#64748B' : '#94A3B8', fontWeight: '500' }}>
                        {act.time}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>



      {/* ── Dynamic "Add Users" Modal ── */}
      {showAddUserModal && (
        <div
          onClick={() => setShowAddUserModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              borderRadius: '20px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
              border: `1px solid ${isDark ? '#374151' : '#E2E8F0'}`,
              padding: '24px',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(124, 58, 237, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#8B5CF6',
                }}>
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '900', color: isDark ? '#F8FAFC' : '#0F172A', margin: 0 }}>
                    Create User Account
                  </h3>
                  <div style={{ fontSize: '12px', color: isDark ? '#94A3B8' : '#64748B' }}>
                    Instant trader provisioning on Zapp Pay
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowAddUserModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: isDark ? '#94A3B8' : '#475569', marginBottom: '4px' }}>
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: isDark ? '#94A3B8' : '#475569', marginBottom: '4px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: isDark ? '#94A3B8' : '#475569', marginBottom: '4px' }}>
                  Mobile Number (WhatsApp)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: isDark ? '#94A3B8' : '#475569', marginBottom: '4px' }}>
                  Account Role
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="form-input"
                  style={{ cursor: 'pointer' }}
                >
                  <option value="Standard Trader">Standard Trader</option>
                  <option value="Merchant / Partner">Merchant / Partner</option>
                  <option value="VIP High-Volume Trader">VIP High-Volume Trader</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{
                    padding: '8px 20px',
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    fontWeight: '800',
                  }}
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Dynamic "New Deposit" Quick Action Modal ── */}
      {showDepositModal && (
        <div
          onClick={() => setShowDepositModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '500px',
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              borderRadius: '20px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
              border: `1px solid ${isDark ? '#374151' : '#E2E8F0'}`,
              padding: '24px',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981',
                }}>
                  <ArrowDownLeft size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '900', color: isDark ? '#F8FAFC' : '#0F172A', margin: 0 }}>
                    Quick Deposit Verification
                  </h3>
                  <div style={{ fontSize: '12px', color: isDark ? '#94A3B8' : '#64748B' }}>
                    Verify latest incoming UPI deposit
                  </div>
                </div>
              </div>
              <button onClick={() => setShowDepositModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApproveDepositSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: isDark ? '#94A3B8' : '#475569', marginBottom: '4px' }}>
                  Trader Email or Mobile
                </label>
                <input
                  type="text"
                  required
                  placeholder="trader@example.com or phone"
                  value={depositUserEmail}
                  onChange={(e) => setDepositUserEmail(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: isDark ? '#94A3B8' : '#475569', marginBottom: '4px' }}>
                  Deposit Amount (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  placeholder="e.g. 25000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: isDark ? '#94A3B8' : '#475569', marginBottom: '4px' }}>
                    Payment Method
                  </label>
                  <select
                    value={depositMethod}
                    onChange={(e) => setDepositMethod(e.target.value)}
                    className="form-input"
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="UPI">UPI (PhonePe/GPay)</option>
                    <option value="IMPS">Bank IMPS</option>
                    <option value="NEFT">Bank NEFT/RTGS</option>
                    <option value="USDT">USDT Deposit</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: isDark ? '#94A3B8' : '#475569', marginBottom: '4px' }}>
                    UTR / Reference No
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UTR-99201948"
                    value={depositUtr}
                    onChange={(e) => setDepositUtr(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#10B981',
                    fontWeight: '800',
                    boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
                  }}
                >
                  Approve & Credit Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Dynamic "New Withdrawal" Quick Action Modal ── */}
      {showWithdrawalModal && (
        <div
          onClick={() => setShowWithdrawalModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '500px',
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              borderRadius: '20px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
              border: `1px solid ${isDark ? '#374151' : '#E2E8F0'}`,
              padding: '24px',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(236, 72, 153, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#EC4899',
                }}>
                  <ArrowUpRight size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '900', color: isDark ? '#F8FAFC' : '#0F172A', margin: 0 }}>
                    Authorize IMPS Payout
                  </h3>
                  <div style={{ fontSize: '12px', color: isDark ? '#94A3B8' : '#64748B' }}>
                    Process pending trader bank withdrawal
                  </div>
                </div>
              </div>
              <button onClick={() => setShowWithdrawalModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAuthorizeWithdrawalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: isDark ? '#94A3B8' : '#475569', marginBottom: '4px' }}>
                  Trader Email or Mobile
                </label>
                <input
                  type="text"
                  required
                  placeholder="trader@example.com or phone"
                  value={withdrawalUserEmail}
                  onChange={(e) => setWithdrawalUserEmail(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: isDark ? '#94A3B8' : '#475569', marginBottom: '4px' }}>
                  Payout Amount (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  placeholder="e.g. 12000"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: isDark ? '#94A3B8' : '#475569', marginBottom: '4px' }}>
                    Payout Method
                  </label>
                  <select
                    value={withdrawalMethod}
                    onChange={(e) => setWithdrawalMethod(e.target.value)}
                    className="form-input"
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="IMPS">IMPS Instant Bank</option>
                    <option value="UPI">UPI VPA Transfer</option>
                    <option value="NEFT">NEFT / RTGS</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: isDark ? '#94A3B8' : '#475569', marginBottom: '4px' }}>
                    Target Account / UPI ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210@paytm or HDFC A/C"
                    value={withdrawalAccount}
                    onChange={(e) => setWithdrawalAccount(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowWithdrawalModal(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{
                    padding: '8px 20px',
                    background: 'linear-gradient(135deg, #EC4899 0%, #E11D48 100%)',
                    fontWeight: '800',
                    boxShadow: '0 2px 10px rgba(236, 72, 153, 0.35)',
                  }}
                >
                  Authorize & Disburse IMPS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



    </div>
  );
};
