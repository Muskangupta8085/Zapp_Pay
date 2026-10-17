import React, { useState, useEffect, useCallback } from 'react';
import { Network, Users, Award, Clock, TrendingUp, Sparkles, ArrowUpRight, RefreshCw, Gift } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { adminApi } from '../../api/adminApi';

interface ReferralPoint {
  label: string;
  fullDate: string;
  value: number;
  reward: string;
}

interface RangeConfig {
  total: string;
  growth: string;
  growthPositive: boolean;
  avg: string;
  unit: string;
  data: ReferralPoint[];
}

interface ReferralItem {
  id: number;
  userId: string;
  user: string;
  email: string;
  phone?: string;
  avatarColor: string;
  referredBy: string;
  joinDate: string;
  status: string;
  reward: string;
}

interface TeamReferralsResponse {
  kpi: {
    totalReferrers: string;
    totalReferrersGrowth: string;
    activeReferrals: string;
    activeReferralsGrowth: string;
    rewardsPaid: string;
    rewardsPaidGrowth: string;
    pendingRewards: string;
    pendingRewardsGrowth: string;
  };
  rangeConfig: RangeConfig;
  recentReferrals: ReferralItem[];
}

export const TeamReferralsPage: React.FC = () => {
  const { isDark } = useTheme();
  const [chartRange, setChartRange] = useState<'7D' | '30D' | '90D' | '1Y'>('7D');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TeamReferralsResponse | null>(null);
  const [bonusCreditingId, setBonusCreditingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchReferralData = useCallback(async (range: '7D' | '30D' | '90D' | '1Y') => {
    try {
      setLoading(true);
      const res = await adminApi.getTeamReferralsData(range);
      if (res && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load referral data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferralData(chartRange);
  }, [chartRange, fetchReferralData]);

  const handleCreditBonus = async (refItem: ReferralItem) => {
    try {
      setBonusCreditingId(refItem.userId);
      await adminApi.creditReferralReward({ userId: refItem.userId, amount: 50 });
      setNotification(`🎉 Bonus ₹ 50 successfully credited to ${refItem.user}!`);
      setTimeout(() => setNotification(null), 4000);
      fetchReferralData(chartRange);
    } catch (err: any) {
      setNotification(err?.message || 'Failed to credit bonus');
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setBonusCreditingId(null);
    }
  };

  // Fallback default config if data is loading
  const currentConfig: RangeConfig = data?.rangeConfig || {
    total: '402',
    growth: '+24.8%',
    growthPositive: true,
    avg: '57/day',
    unit: 'Referrals',
    data: [
      { label: 'Oct 02', fullDate: 'Thu, 02 Oct', value: 42, reward: '₹ 2,100' },
      { label: 'Oct 03', fullDate: 'Fri, 03 Oct', value: 28, reward: '₹ 1,400' },
      { label: 'Oct 04', fullDate: 'Sat, 04 Oct', value: 68, reward: '₹ 3,400' },
      { label: 'Oct 05', fullDate: 'Sun, 05 Oct', value: 46, reward: '₹ 2,300' },
      { label: 'Oct 06', fullDate: 'Mon, 06 Oct', value: 74, reward: '₹ 3,700' },
      { label: 'Oct 07', fullDate: 'Tue, 07 Oct', value: 55, reward: '₹ 2,750' },
      { label: 'Oct 08', fullDate: 'Today, 08 Oct', value: 89, reward: '₹ 4,450' },
    ],
  };

  const chartPoints = currentConfig.data;
  const rawMax = Math.max(...chartPoints.map((p) => p.value), 10);

  const roundCeil = (num: number) => {
    if (num <= 100) return 100;
    if (num <= 300) return Math.ceil(num / 50) * 50;
    if (num <= 1000) return Math.ceil(num / 100) * 100;
    return Math.ceil(num / 500) * 500;
  };
  const maxScale = roundCeil(rawMax);

  // SVG dimensions
  const svgW = 520;
  const svgH = 220;
  const padLeft = 38;
  const padRight = 14;
  const padTop = 22;
  const padBottom = 32;
  const chartW = svgW - padLeft - padRight;
  const chartH = svgH - padTop - padBottom;

  const yTicks = [
    { value: maxScale, y: padTop },
    { value: Math.round(maxScale * 0.66), y: padTop + chartH * 0.34 },
    { value: Math.round(maxScale * 0.33), y: padTop + chartH * 0.67 },
    { value: 0, y: padTop + chartH }
  ];

  const formatTick = (val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
    return `${val}`;
  };

  const slotW = chartW / chartPoints.length;
  const barW = Math.max(14, Math.min(26, slotW * 0.44));

  const referrals: ReferralItem[] = data?.recentReferrals || [
    { id: 1, userId: '1', user: 'Rohan Sharma', email: 'rohan@example.com', avatarColor: '#2563EB', referredBy: 'Adarsh', joinDate: '03 Oct 2026', status: 'Active', reward: '₹ 50' },
    { id: 2, userId: '2', user: 'Kavya Patel', email: 'kavya@example.com', avatarColor: '#7C3AED', referredBy: 'Priya', joinDate: '02 Oct 2026', status: 'Active', reward: '₹ 50' },
    { id: 3, userId: '3', user: 'Manish Verma', email: 'manish@example.com', avatarColor: '#059669', referredBy: 'Rahul', joinDate: '02 Oct 2026', status: 'Active', reward: '₹ 50' },
    { id: 4, userId: '4', user: 'Neha Gupta', email: 'neha@example.com', avatarColor: '#DC2626', referredBy: 'Sneha', joinDate: '01 Oct 2026', status: 'Inactive', reward: '₹ 0' },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-main, #0F172A)', letterSpacing: '-0.4px', margin: 0 }}>
            Team & Referrals
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary, #64748B)', fontWeight: '500', margin: '4px 0 0' }}>
            Manage referral incentives, track viral growth, and monitor active rewards.
          </p>
        </div>

        <button
          onClick={() => fetchReferralData(chartRange)}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '12.5px', fontWeight: '700' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Stats
        </button>
      </div>

      {notification && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          backgroundColor: notification.includes('Failed') ? '#FEE2E2' : '#DCFCE7',
          color: notification.includes('Failed') ? '#DC2626' : '#16A34A',
          fontSize: '13px',
          fontWeight: '700',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {notification}
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="stat-grid-4" style={{ marginBottom: '22px' }}>
        {/* Total Referrers */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: isDark ? 'rgba(37, 99, 235, 0.16)' : '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB'
          }}>
            <Network size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748B)', fontWeight: '600' }}>Total Referrers</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main, #0F172A)' }}>
              {data ? data.kpi.totalReferrers : '4,320'}
            </div>
            <div style={{ fontSize: '10.5px', color: '#16A34A', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '2px' }}>
              {data ? data.kpi.totalReferrersGrowth : '↑ 12.5%'}
            </div>
          </div>
        </div>

        {/* Active Referrals */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#F0FDF4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#16A34A'
          }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748B)', fontWeight: '600' }}>Active Referrals</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main, #0F172A)' }}>
              {data ? data.kpi.activeReferrals : '1,920'}
            </div>
            <div style={{ fontSize: '10.5px', color: '#16A34A', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '2px' }}>
              {data ? data.kpi.activeReferralsGrowth : '↑ 7.8%'}
            </div>
          </div>
        </div>

        {/* Rewards Paid */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: isDark ? 'rgba(217, 119, 6, 0.16)' : '#FFFBEB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#D97706'
          }}>
            <Award size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748B)', fontWeight: '600' }}>Rewards Paid</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main, #0F172A)' }}>
              {data ? data.kpi.rewardsPaid : '₹ 4.8 L'}
            </div>
            <div style={{ fontSize: '10.5px', color: '#16A34A', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '2px' }}>
              {data ? data.kpi.rewardsPaidGrowth : '↑ 16.4%'}
            </div>
          </div>
        </div>

        {/* Pending Rewards */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: isDark ? 'rgba(220, 38, 38, 0.16)' : '#FEF2F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#DC2626'
          }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748B)', fontWeight: '600' }}>Pending Rewards</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main, #0F172A)' }}>
              {data ? data.kpi.pendingRewards : '₹ 72 K'}
            </div>
            <div style={{ fontSize: '10.5px', color: '#DC2626', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '2px' }}>
              {data ? data.kpi.pendingRewardsGrowth : '↓ 2.1%'}
            </div>
          </div>
        </div>
      </div>

      {/* Referral Growth Bar Chart & Recent Referrals Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.08fr 0.92fr', gap: '22px' }}>
        
        {/* Referral Growth Bar Chart Card */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          
          {/* Header Row: Title & Range Selector */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main, #0F172A)', margin: 0 }}>
                  Referral Growth
                </h3>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#2563EB',
                  backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Sparkles size={11} /> Live Track
                </span>
              </div>

              {/* Dynamic Stats Row */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
                <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-main, #0F172A)', letterSpacing: '-0.5px' }}>
                  +{currentConfig.total}
                </span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '11.5px',
                  fontWeight: '800',
                  color: currentConfig.growthPositive ? '#16A34A' : '#DC2626',
                  backgroundColor: currentConfig.growthPositive ? (isDark ? 'rgba(22, 163, 74, 0.16)' : '#DCFCE7') : (isDark ? 'rgba(220, 38, 38, 0.16)' : '#FEE2E2'),
                  padding: '2px 7px',
                  borderRadius: '6px'
                }}>
                  <TrendingUp size={12} /> {currentConfig.growth}
                </span>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #94A3B8)', fontWeight: '600' }}>
                  • Avg {currentConfig.avg}
                </span>
              </div>
            </div>

            {/* Timeframe Range Pills */}
            <div style={{
              display: 'flex',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
              borderRadius: '9px',
              padding: '3px',
              gap: '2px',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0'}`
            }}>
              {(['7D', '30D', '90D', '1Y'] as const).map((r) => {
                const isActive = chartRange === r;
                return (
                  <button
                    key={r}
                    onClick={() => {
                      setChartRange(r);
                      setHoveredIndex(null);
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '7px',
                      border: 'none',
                      backgroundColor: isActive ? '#2563EB' : 'transparent',
                      color: isActive ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B'),
                      fontSize: '11px',
                      fontWeight: isActive ? '800' : '700',
                      cursor: 'pointer',
                      transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none'
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bar Chart SVG Container */}
          <div style={{ width: '100%', height: '230px', position: 'relative', marginTop: 'auto' }}>
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              <defs>
                {/* Regular Bar Gradient */}
                <linearGradient id="barGradientRegular" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3874FF" />
                  <stop offset="100%" stopColor="#1E40AF" />
                </linearGradient>

                {/* Hovered Bar Gradient */}
                <linearGradient id="barGradientActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60A5FA" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>

                {/* DropShadow Filter */}
                <filter id="barShadow" x="-20%" y="-10%" width="140%" height="130%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#2563EB" floodOpacity={isDark ? '0.45' : '0.28'} />
                </filter>
              </defs>

              {/* Horizontal Gridlines & Y-Axis Labels */}
              {yTicks.map((tick, idx) => (
                <g key={idx}>
                  <line
                    x1={padLeft}
                    y1={tick.y}
                    x2={svgW - padRight}
                    y2={tick.y}
                    stroke={isDark ? 'rgba(255, 255, 255, 0.06)' : '#EEF2F6'}
                    strokeDasharray={idx === yTicks.length - 1 ? 'none' : '4 4'}
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 8}
                    y={tick.y + 3.5}
                    textAnchor="end"
                    fontSize="10"
                    fill={isDark ? '#64748B' : '#94A3B8'}
                    fontWeight="600"
                    fontFamily="var(--font-sans)"
                  >
                    {formatTick(tick.value)}
                  </text>
                </g>
              ))}

              {/* Bars & Column Interactive Track Slots */}
              {chartPoints.map((b, i) => {
                const centerX = padLeft + i * slotW + slotW / 2;
                const barHeight = Math.max(8, (b.value / maxScale) * chartH);
                const barY = padTop + chartH - barHeight;
                const isHovered = hoveredIndex === i;
                const isHighest = b.value === rawMax;

                // Path for rounded top only
                const r = Math.min(6, barW / 2);
                const x0 = centerX - barW / 2;
                const x1 = centerX + barW / 2;
                const yBottom = padTop + chartH;
                const pathData = `
                  M ${x0} ${yBottom}
                  L ${x0} ${barY + r}
                  A ${r} ${r} 0 0 1 ${x0 + r} ${barY}
                  L ${x1 - r} ${barY}
                  A ${r} ${r} 0 0 1 ${x1} ${barY + r}
                  L ${x1} ${yBottom}
                  Z
                `;

                return (
                  <g
                    key={i}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Background Column Track */}
                    <rect
                      x={centerX - (barW + 8) / 2}
                      y={padTop}
                      width={barW + 8}
                      height={chartH}
                      rx="7"
                      fill={
                        isHovered
                          ? (isDark ? 'rgba(37, 99, 235, 0.12)' : '#E0E7FF')
                          : (isDark ? 'rgba(255, 255, 255, 0.025)' : '#F8FAFC')
                      }
                      style={{ transition: 'fill 0.2s ease' }}
                    />

                    {/* Bar with top-rounded path */}
                    <path
                      d={pathData}
                      fill={isHovered ? 'url(#barGradientActive)' : (isHighest ? 'url(#barGradientActive)' : 'url(#barGradientRegular)')}
                      filter={isHovered ? 'url(#barShadow)' : 'none'}
                      style={{
                        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                        opacity: hoveredIndex !== null && !isHovered ? 0.72 : 1
                      }}
                    />

                    {/* Peak indicator dot for highest item */}
                    {isHighest && !isHovered && (
                      <circle
                        cx={centerX}
                        cy={barY - 4}
                        r="2.5"
                        fill="#2563EB"
                      />
                    )}

                    {/* X-Axis Label */}
                    <text
                      x={centerX}
                      y={svgH - 12}
                      fontSize={chartPoints.length > 8 ? '9.5' : '10.5'}
                      fill={
                        isHovered
                          ? '#2563EB'
                          : (isDark ? '#94A3B8' : '#64748B')
                      }
                      fontWeight={isHovered ? '800' : '600'}
                      textAnchor="middle"
                      style={{ transition: 'fill 0.15s ease' }}
                    >
                      {b.label}
                    </text>
                  </g>
                );
              })}

              {/* Floating Hover Tooltip */}
              {hoveredIndex !== null && (() => {
                const pt = chartPoints[hoveredIndex];
                const centerX = padLeft + hoveredIndex * slotW + slotW / 2;
                const barHeight = Math.max(8, (pt.value / maxScale) * chartH);
                const barY = padTop + chartH - barHeight;

                const tipW = 120;
                const tipH = 46;
                let tipX = centerX - tipW / 2;
                if (tipX < padLeft) tipX = padLeft;
                if (tipX + tipW > svgW - padRight) tipX = svgW - padRight - tipW;
                const tipY = Math.max(2, barY - tipH - 8);

                return (
                  <g style={{ pointerEvents: 'none', transition: 'all 0.15s ease-out' }}>
                    <rect
                      x={tipX}
                      y={tipY}
                      width={tipW}
                      height={tipH}
                      rx="8"
                      fill={isDark ? '#0F172A' : '#1E293B'}
                      stroke={isDark ? '#334155' : 'rgba(255,255,255,0.1)'}
                      strokeWidth="1"
                      filter="url(#barShadow)"
                    />

                    <text
                      x={tipX + tipW / 2}
                      y={tipY + 16}
                      textAnchor="middle"
                      fontSize="9.5"
                      fill="#94A3B8"
                      fontWeight="600"
                    >
                      {pt.fullDate}
                    </text>

                    <text
                      x={tipX + tipW / 2}
                      y={tipY + 33}
                      textAnchor="middle"
                      fontSize="11.5"
                      fill="#FFFFFF"
                      fontWeight="800"
                    >
                      {pt.value} referrals <tspan fill="#34D399" fontWeight="700">({pt.reward})</tspan>
                    </text>

                    <polygon
                      points={`${centerX - 4},${tipY + tipH} ${centerX + 4},${tipY + tipH} ${centerX},${tipY + tipH + 4}`}
                      fill={isDark ? '#0F172A' : '#1E293B'}
                    />
                  </g>
                );
              })()}
            </svg>
          </div>

          {/* Subtitle / Insight Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9'}`,
            fontSize: '11.5px',
            color: 'var(--text-muted, #94A3B8)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB', display: 'inline-block' }} />
              High conversion rate on weekends (+34%)
            </span>
            <span style={{ fontWeight: '700', color: '#2563EB', display: 'inline-flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
              Detailed Analytics <ArrowUpRight size={12} />
            </span>
          </div>

        </div>

        {/* Recent Referrals Table Card */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main, #0F172A)', margin: 0 }}>
                Recent Referrals
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748B)', margin: '2px 0 0', fontWeight: '500' }}>
                Latest verified invites & reward claims
              </p>
            </div>
            <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#2563EB' }}>
              Showing {referrals.length} records
            </span>
          </div>

          <div className="data-table-container" style={{ flex: 1 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '32px' }}>#</th>
                  <th>User</th>
                  <th>Referred By</th>
                  <th>Join Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Reward</th>
                  <th style={{ textAlign: 'center', width: '80px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id}>
                    <td style={{ color: 'var(--text-muted, #94A3B8)', fontWeight: '700' }}>{r.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          backgroundColor: `${r.avatarColor}1A`,
                          color: r.avatarColor,
                          fontWeight: '800',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${r.avatarColor}33`
                        }}>
                          {r.user.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: 'var(--text-main, #0F172A)', fontSize: '13px' }}>
                            {r.user}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #94A3B8)' }}>
                            {r.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary, #475569)', fontWeight: '600', fontSize: '12.5px' }}>
                      {r.referredBy}
                    </td>
                    <td style={{ color: 'var(--text-secondary, #64748B)', fontSize: '12px' }}>
                      {r.joinDate}
                    </td>
                    <td>
                      <span className={`badge ${r.status === 'Active' ? 'badge-completed' : 'badge-cancelled'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: '800', color: '#16A34A', textAlign: 'right' }}>
                      {r.reward}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleCreditBonus(r)}
                        disabled={bonusCreditingId === r.userId}
                        title="Credit instant ₹ 50 bonus"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563EB',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: isDark ? 'rgba(37, 99, 235, 0.12)' : '#EFF6FF'
                        }}
                      >
                        <Gift size={12} />
                        {bonusCreditingId === r.userId ? '...' : '+₹50'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
