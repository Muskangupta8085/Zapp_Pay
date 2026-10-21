import React, { useState, useEffect, useCallback } from 'react';
import {
  Flame,
  Trophy,
  Plus,
  Gift,
  RefreshCw,
  CheckCircle2,
  Send,
  Zap,
  Trash2,
  Layers
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { adminApi } from '../../api/adminApi';

interface RewardStreakDay {
  day: number;
  rewardXCoin: number;
  isMega: boolean;
}

interface BountyTask {
  id: string;
  title: string;
  description?: string;
  rewardXCoin: number;
  targetCount: number;
  type: string;
  active: boolean;
  completionsCount?: number;
}

interface RecentClaim {
  id: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  avatarColor: string;
  claimType: string;
  amountZap: number;
  amountFormatted: string;
  amountInrFormatted: string;
  claimedAt: string;
  status: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface RewardsOverviewResponse {
  kpi: {
    totalDistributedXCoin: string;
    totalDistributedInr: string;
    distributedGrowth: string;
    activeStreakers: string;
    activeStreakersGrowth: string;
    tasksCompleted: string;
    tasksCompletedGrowth: string;
    conversionRate: string;
    conversionRateLabel: string;
  };
  streakDays: RewardStreakDay[];
  tasks: BountyTask[];
  recentClaims: RecentClaim[];
  usersList: UserOption[];
}

export const RewardsPage: React.FC = () => {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RewardsOverviewResponse | null>(null);

  // Streak state
  const [streakDays, setStreakDays] = useState<RewardStreakDay[]>([
    { day: 1, rewardXCoin: 5, isMega: false },
    { day: 2, rewardXCoin: 10, isMega: false },
    { day: 3, rewardXCoin: 15, isMega: false },
    { day: 4, rewardXCoin: 20, isMega: false },
    { day: 5, rewardXCoin: 25, isMega: false },
    { day: 6, rewardXCoin: 30, isMega: false },
    { day: 7, rewardXCoin: 100, isMega: true },
  ]);
  const [savingStreak, setSavingStreak] = useState(false);

  // Bounties state
  const [tasks, setTasks] = useState<BountyTask[]>([]);
  const [taskCategoryFilter, setTaskCategoryFilter] = useState('ALL');

  // Modals state
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showAirdropModal, setShowAirdropModal] = useState(false);

  // New Bounty Form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Trades');
  const [newReward, setNewReward] = useState('50');
  const [newTarget, setNewTarget] = useState('1');
  const [newDescription, setNewDescription] = useState('');
  const [submittingTask, setSubmittingTask] = useState(false);

  // Airdrop Form
  const [airdropUserId, setAirdropUserId] = useState('');
  const [airdropAmount, setAirdropAmount] = useState('50');
  const [airdropReason, setAirdropReason] = useState('Community Loyalty Airdrop');
  const [submittingAirdrop, setSubmittingAirdrop] = useState(false);

  // Toast / Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchRewards = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getRewardsOverview();
      if (res && res.data) {
        setData(res.data);
        if (res.data.streakDays) {
          setStreakDays(res.data.streakDays);
        }
        if (res.data.tasks) {
          setTasks(res.data.tasks);
        }
        if (res.data.usersList && res.data.usersList.length > 0 && !airdropUserId) {
          setAirdropUserId(res.data.usersList[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load rewards overview:', err);
    } finally {
      setLoading(false);
    }
  }, [airdropUserId]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  // Handle saving 7-day streak
  const handleSaveStreak = async () => {
    try {
      setSavingStreak(true);
      await adminApi.updateStreakConfig(streakDays);
      showToast('7-Day Check-in Streak configuration saved!');
    } catch (err: any) {
      showToast(err?.message || 'Failed to save streak settings', 'error');
    } finally {
      setSavingStreak(false);
    }
  };

  // Toggle Bounty Task Active/Disabled
  const handleToggleTask = async (taskId: string) => {
    try {
      const res = await adminApi.toggleBountyTask(taskId);
      if (res && res.data) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, active: res.data.active } : t))
        );
        showToast(`Task is now ${res.data.active ? 'Active' : 'Disabled'}`);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to toggle task status', 'error');
    }
  };

  // Delete Bounty Task
  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this bounty task?')) return;
    try {
      await adminApi.deleteBountyTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      showToast('Bounty task removed successfully');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete task', 'error');
    }
  };

  // Create New Bounty Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Please provide a task title', 'error');
      return;
    }

    try {
      setSubmittingTask(true);
      const res = await adminApi.addBountyTask({
        title: newTitle,
        type: newCategory,
        rewardXCoin: Number(newReward),
        targetCount: Number(newTarget),
        description: newDescription,
      });

      if (res && res.data) {
        setTasks((prev) => [...prev, res.data]);
        setShowNewTaskModal(false);
        setNewTitle('');
        setNewDescription('');
        setNewReward('50');
        setNewTarget('1');
        showToast('New bounty task created successfully!');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to create bounty task', 'error');
    } finally {
      setSubmittingTask(false);
    }
  };

  // Direct Airdrop Execution
  const handleAirdrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!airdropUserId) {
      showToast('Please select a recipient user', 'error');
      return;
    }

    try {
      setSubmittingAirdrop(true);
      const res = await adminApi.airdropReward({
        userId: airdropUserId,
        amountXCoin: Number(airdropAmount),
        reason: airdropReason,
      });
      if (res && res.data) {
        setShowAirdropModal(false);
        showToast(`🎉 ${airdropAmount} xCoin airdropped successfully!`);
        fetchRewards();
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to execute airdrop', 'error');
    } finally {
      setSubmittingAirdrop(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskCategoryFilter === 'ALL') return true;
    return t.type.toUpperCase() === taskCategoryFilter.toUpperCase();
  });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast Alert */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '14px 22px',
            borderRadius: '12px',
            backgroundColor: notification.type === 'error' ? '#EF4444' : '#10B981',
            color: '#FFFFFF',
            fontWeight: '700',
            fontSize: '13.5px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          {notification.type === 'error' ? '⚠️' : '✅'}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: '900',
                color: 'var(--text-main, #0F172A)',
                letterSpacing: '-0.4px',
                margin: 0,
              }}
            >
              Rewards & Engagement Hub
            </h1>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary, #64748B)', fontWeight: '500', margin: 0 }}>
            Configure 7-day daily check-in streaks, bounty task rules, and execute community airdrops.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowAirdropModal(true)}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: '800',
              borderRadius: '10px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
            }}
          >
            <Send size={15} /> Direct Airdrop
          </button>

          <button
            onClick={fetchRewards}
            className="btn btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: '700',
              borderRadius: '10px',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* 4 KPI Metrics Cards */}
      <div className="stat-grid-4" style={{ marginBottom: '24px' }}>
        {/* Total Distributed */}
        <div className="card" style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: isDark ? 'rgba(37, 99, 235, 0.16)' : '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB',
              flexShrink: 0,
            }}
          >
            <Gift size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748B)', fontWeight: '600' }}>
              Total Rewards Distributed
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main, #0F172A)' }}>
              {data ? data.kpi.totalDistributedXCoin : '14,250 xCoin'}
            </div>
            <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>{data ? data.kpi.totalDistributedInr : '₹ 1,54,420'}</span>
              <span>•</span>
              <span>{data ? data.kpi.distributedGrowth : '↑ 18.4%'}</span>
            </div>
          </div>
        </div>

        {/* Active Streakers */}
        <div className="card" style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: isDark ? 'rgba(234, 88, 12, 0.16)' : '#FFF7ED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EA580C',
              flexShrink: 0,
            }}
          >
            <Flame size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748B)', fontWeight: '600' }}>
              Active Streakers
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main, #0F172A)' }}>
              {data ? data.kpi.activeStreakers : '842 Traders'}
            </div>
            <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: '700' }}>
              {data ? data.kpi.activeStreakersGrowth : '↑ 9.2% weekly active'}
            </div>
          </div>
        </div>

        {/* Bounties Completed */}
        <div className="card" style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: isDark ? 'rgba(124, 58, 237, 0.16)' : '#F5F3FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7C3AED',
              flexShrink: 0,
            }}
          >
            <Trophy size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748B)', fontWeight: '600' }}>
              Bounties Completed
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main, #0F172A)' }}>
              {data ? data.kpi.tasksCompleted : '2,783 Bounties'}
            </div>
            <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: '700' }}>
              {data ? data.kpi.tasksCompletedGrowth : '↑ 14.8% completion'}
            </div>
          </div>
        </div>

        {/* Claim Rate */}
        <div className="card" style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#F0FDF4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16A34A',
              flexShrink: 0,
            }}
          >
            <Zap size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748B)', fontWeight: '600' }}>
              Claim Velocity
            </div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#16A34A' }}>
              {data ? data.kpi.conversionRate : '94.6%'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748B)', fontWeight: '600' }}>
              {data ? data.kpi.conversionRateLabel : 'Active claim velocity'}
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Check-in Streak Configuration */}
      <div className="card" style={{ padding: '24px', marginBottom: '26px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D97706',
              }}
            >
              <Flame size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main, #0F172A)', margin: 0 }}>
                7-Day Daily Check-in Streak Engine
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary, #64748B)', margin: '2px 0 0', fontWeight: '500' }}>
                Reward users for consecutive daily logins. Day 7 acts as the Jackpot Mega Multiplier.
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveStreak}
            disabled={savingStreak}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              fontSize: '12.5px',
              fontWeight: '800',
              borderRadius: '9px',
            }}
          >
            <CheckCircle2 size={15} />
            {savingStreak ? 'Saving...' : 'Save Streak Rules'}
          </button>
        </div>

        {/* 7 Day Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px' }}>
          {streakDays.map((s, idx) => {
            const isMega = s.isMega;
            return (
              <div
                key={s.day}
                style={{
                  padding: '18px 14px',
                  borderRadius: '14px',
                  backgroundColor: isMega
                    ? (isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF')
                    : (isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC'),
                  border: isMega
                    ? '2px solid #2563EB'
                    : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
                  textAlign: 'center',
                  boxShadow: isMega ? '0 4px 20px rgba(37, 99, 235, 0.16)' : 'none',
                  position: 'relative',
                  transition: 'transform 0.15s ease',
                }}
              >
                {isMega && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      fontSize: '9.5px',
                      fontWeight: '900',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      letterSpacing: '0.3px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    MEGA JACKPOT
                  </span>
                )}

                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: '800',
                    color: isMega ? '#2563EB' : 'var(--text-secondary, #64748B)',
                    marginBottom: '8px',
                  }}
                >
                  Day {s.day} {isMega ? '🎁' : '🔥'}
                </div>

                <div style={{ position: 'relative', margin: '6px 0' }}>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    style={{
                      textAlign: 'center',
                      fontWeight: '900',
                      color: isMega ? '#2563EB' : 'var(--text-main, #0F172A)',
                      fontSize: '17px',
                      height: '42px',
                      borderRadius: '8px',
                      border: `1.5px solid ${isMega ? '#2563EB' : isDark ? '#334155' : '#CBD5E1'}`,
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                    }}
                    value={s.rewardXCoin}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setStreakDays((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, rewardXCoin: val } : item))
                      );
                    }}
                  />
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted, #94A3B8)', fontWeight: '700' }}>
                  xCoin Reward
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Action Task Bounties (Left) + Live Recent Claims Stream (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
        {/* Left: Action Task Bounties Card */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: isDark ? 'rgba(124, 58, 237, 0.16)' : '#F5F3FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#7C3AED',
                }}
              >
                <Trophy size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main, #0F172A)', margin: 0 }}>
                  Action Task Bounties
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary, #64748B)', margin: '2px 0 0', fontWeight: '500' }}>
                  Dynamic user engagement quests and milestones
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowNewTaskModal(true)}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: '800',
                borderRadius: '8px',
              }}
            >
              <Plus size={14} /> New Bounty
            </button>
          </div>

          {/* Category Filter Pills */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              marginBottom: '16px',
              overflowX: 'auto',
              paddingBottom: '4px',
            }}
          >
            {['ALL', 'KYC', 'DEPOSIT', 'TRADES', 'REFERRAL', 'SECURITY'].map((cat) => (
              <button
                key={cat}
                onClick={() => setTaskCategoryFilter(cat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  backgroundColor:
                    taskCategoryFilter === cat
                      ? '#2563EB'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : '#F1F5F9',
                  color:
                    taskCategoryFilter === cat
                      ? '#FFFFFF'
                      : isDark
                      ? '#94A3B8'
                      : '#64748B',
                  fontSize: '11px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Tasks Table */}
          <div className="data-table-container" style={{ flex: 1 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task Quest</th>
                  <th>Category</th>
                  <th>Reward</th>
                  <th>Target</th>
                  <th>Completions</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: '800', color: 'var(--text-main, #0F172A)', fontSize: '13px' }}>
                        {t.title}
                      </div>
                      {t.description && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted, #94A3B8)', marginTop: '2px' }}>
                          {t.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor:
                            t.type === 'KYC'
                              ? '#EFF6FF'
                              : t.type === 'Deposit'
                              ? '#F0FDF4'
                              : t.type === 'Trades'
                              ? '#FFF7ED'
                              : t.type === 'Referral'
                              ? '#F5F3FF'
                              : '#FEF2F2',
                          color:
                            t.type === 'KYC'
                              ? '#2563EB'
                              : t.type === 'Deposit'
                              ? '#16A34A'
                              : t.type === 'Trades'
                              ? '#EA580C'
                              : t.type === 'Referral'
                              ? '#7C3AED'
                              : '#DC2626',
                          fontWeight: '800',
                          fontSize: '11px',
                        }}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '900', color: '#2563EB', fontSize: '13px' }}>
                        +{t.rewardXCoin} xCoin
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary, #64748B)', fontWeight: '600', fontSize: '12px' }}>
                      {t.targetCount} count
                    </td>
                    <td style={{ color: 'var(--text-secondary, #475569)', fontWeight: '700', fontSize: '12px' }}>
                      {t.completionsCount || 0} done
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          t.active ? 'badge-completed' : 'badge-cancelled'
                        }`}
                      >
                        {t.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button
                          onClick={() => handleToggleTask(t.id)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: t.active ? '#FEE2E2' : '#DCFCE7',
                            color: t.active ? '#DC2626' : '#16A34A',
                            cursor: 'pointer',
                          }}
                        >
                          {t.active ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          style={{
                            padding: '4px 6px',
                            fontSize: '11px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: '#94A3B8',
                            cursor: 'pointer',
                          }}
                          title="Delete Bounty"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Live Recent Claims Stream Card */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#DCFCE7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#16A34A',
                }}
              >
                <Layers size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main, #0F172A)', margin: 0 }}>
                  Live Claims Ledger
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary, #64748B)', margin: '2px 0 0', fontWeight: '500' }}>
                  Real-time reward distributions & airdrops
                </p>
              </div>
            </div>

            <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#16A34A' }}>
              {data?.recentClaims.length || 0} Recent
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '420px' }}>
            {data && data.recentClaims.length > 0 ? (
              data.recentClaims.map((claim) => (
                <div
                  key={claim.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        backgroundColor: `${claim.avatarColor}1A`,
                        color: claim.avatarColor,
                        fontWeight: '900',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${claim.avatarColor}33`,
                        flexShrink: 0,
                      }}
                    >
                      {claim.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', color: 'var(--text-main, #0F172A)', fontSize: '12.5px' }}>
                        {claim.userName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748B)', fontWeight: '600' }}>
                        {claim.claimType} • {claim.claimedAt}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '900', color: '#16A34A', fontSize: '13px' }}>
                      {claim.amountFormatted}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #94A3B8)', fontWeight: '600' }}>
                      {claim.amountInrFormatted}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#94A3B8', fontSize: '13px' }}>
                No recent claims yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL 1: CREATE NEW BOUNTY TASK */}
      {/* ========================================== */}
      {showNewTaskModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '28px',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Trophy size={20} color="#2563EB" />
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main, #0F172A)', margin: 0 }}>
                  Create Bounty Quest
                </h3>
              </div>
              <button
                onClick={() => setShowNewTaskModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '5px' }}>
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Execute 10 Spot Trades"
                  className="form-input"
                  style={{ height: '42px', fontSize: '13px' }}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '5px' }}>
                    Category
                  </label>
                  <select
                    className="form-input"
                    style={{ height: '42px', fontSize: '13px' }}
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    <option value="Trades">Trades</option>
                    <option value="Deposit">Deposit</option>
                    <option value="KYC">KYC</option>
                    <option value="Referral">Referral</option>
                    <option value="Security">Security</option>
                    <option value="Social">Social</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '5px' }}>
                    Target Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="form-input"
                    style={{ height: '42px', fontSize: '13px' }}
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '5px' }}>
                  Reward (xCoin) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  className="form-input"
                  style={{ height: '42px', fontSize: '13px', fontWeight: '800', color: '#2563EB' }}
                  value={newReward}
                  onChange={(e) => setNewReward(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '5px' }}>
                  Description / Instruction (Optional)
                </label>
                <textarea
                  placeholder="Details shown to traders in the mobile app hub"
                  className="form-input"
                  rows={3}
                  style={{ fontSize: '13px', resize: 'vertical' }}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, height: '42px', fontWeight: '700' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTask}
                  className="btn btn-primary"
                  style={{ flex: 1, height: '42px', fontWeight: '800' }}
                >
                  {submittingTask ? 'Creating...' : 'Create Quest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: DIRECT REWARD AIRDROP */}
      {/* ========================================== */}
      {showAirdropModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '28px',
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Send size={20} color="#2563EB" />
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main, #0F172A)', margin: 0 }}>
                  Direct Reward Airdrop
                </h3>
              </div>
              <button
                onClick={() => setShowAirdropModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAirdrop} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '5px' }}>
                  Select Recipient Trader *
                </label>
                <select
                  required
                  className="form-input"
                  style={{ height: '42px', fontSize: '13px' }}
                  value={airdropUserId}
                  onChange={(e) => setAirdropUserId(e.target.value)}
                >
                  {data?.usersList && data.usersList.length > 0 ? (
                    data.usersList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))
                  ) : (
                    <option value="">No users available</option>
                  )}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '5px' }}>
                  Airdrop Amount (xCoin) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  className="form-input"
                  style={{ height: '42px', fontSize: '14px', fontWeight: '800', color: '#2563EB' }}
                  value={airdropAmount}
                  onChange={(e) => setAirdropAmount(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '5px' }}>
                  Airdrop Memo / Reason
                </label>
                <input
                  type="text"
                  required
                  className="form-input"
                  style={{ height: '42px', fontSize: '13px' }}
                  value={airdropReason}
                  onChange={(e) => setAirdropReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAirdropModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, height: '42px', fontWeight: '700' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAirdrop}
                  className="btn btn-primary"
                  style={{ flex: 1, height: '42px', fontWeight: '800' }}
                >
                  {submittingAirdrop ? 'Processing...' : 'Authorize Airdrop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
