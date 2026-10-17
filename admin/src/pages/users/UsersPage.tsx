import React, { useState, useEffect } from 'react';
import {
  Users as UsersIcon,
  UserCheck,
  UserX,
  ShieldAlert,
  Search,
  Plus,
  X,
  Check,
  UserPlus,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { useTheme } from '../../context/ThemeContext';

interface UserRow {
  id: string;
  name: string;
  email: string;
  mobile: string;
  walletBalance: string;
  xcoinBalance: string;
  status: 'Active' | 'Suspended' | 'Blocked';
  joinedDate: string;
  avatarBg: string;
  role?: string;
  kycStatus?: string;
}

interface UserStats {
  total: number;
  active: number;
  suspended: number;
  blocked: number;
}

export const UsersPage: React.FC = () => {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Suspended' | 'Blocked'>('All');
  const [roleFilter, setRoleFilter] = useState<'All' | 'user' | 'admin' | 'superadmin'>('All');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState<UserStats>({ total: 0, active: 0, suspended: 0, blocked: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Quick Action Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState('Standard Trader');
  const [newUserBalance, setNewUserBalance] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.listUsers();
      if (res.success && res.data) {
        if (Array.isArray(res.data)) {
          setUsers(res.data);
          const total = res.data.length;
          const active = res.data.filter((u: any) => u.status === 'Active').length;
          const suspended = res.data.filter((u: any) => u.status === 'Suspended').length;
          setStats({ total, active, suspended, blocked: 0 });
        } else if (res.data.users && Array.isArray(res.data.users)) {
          setUsers(res.data.users);
          if (res.data.stats) {
            setStats(res.data.stats);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load users from API', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    try {
      const res = await adminApi.quickCreateUser({
        fullName: newUserName.trim(),
        email: newUserEmail.trim(),
        phone: newUserPhone.trim() || undefined,
        role: newUserRole === 'Super Admin' ? 'superadmin' : 'user',
        initialBalance: parseFloat(newUserBalance) || 0,
      });

      if (res.success) {
        triggerToast(`User "${newUserName}" onboarded successfully!`);
        setShowAddUserModal(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPhone('');
        setNewUserBalance('');
        fetchUsers();
      } else {
        triggerToast(`Error: ${res.error || 'Failed to create user'}`);
      }
    } catch {
      triggerToast('Error saving user to backend');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.mobile.includes(searchQuery) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' ? true : u.status === statusFilter;
    const matchesRole = roleFilter === 'All' ? true : (u.role || 'user') === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* Dynamic Toast */}
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

      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '900', color: isDark ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.4px', margin: 0 }}>
            User Management
          </h1>
          <p style={{ fontSize: '13.5px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: '500', margin: '4px 0 0' }}>
            Live database registry of all traders, partners, and platform accounts.
          </p>
        </div>

        <button
          onClick={() => setShowAddUserModal(true)}
          className="btn btn-primary"
          style={{
            borderRadius: '12px',
            padding: '10px 20px',
            fontSize: '13.5px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Plus size={17} />
          <span>Add User Account</span>
        </button>
      </div>

      {/* 4 Real-Time KPI Cards */}
      <div className="stat-grid-4">
        {/* Total Users */}
        <div className="card" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '18px 20px',
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          borderRadius: '16px',
          border: `1px solid ${isDark ? '#1F2937' : '#F1F5F9'}`,
          boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 4px 18px rgba(0, 0, 0, 0.03)',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDark ? '#60A5FA' : '#2563EB',
            flexShrink: 0,
          }}>
            <UsersIcon size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Total Users
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: isDark ? '#F8FAFC' : '#0F172A', lineHeight: 1.2, margin: '2px 0' }}>
              {stats.total.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '700' }}>
              Live in Database
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="card" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '18px 20px',
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          borderRadius: '16px',
          border: `1px solid ${isDark ? '#1F2937' : '#F1F5F9'}`,
          boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 4px 18px rgba(0, 0, 0, 0.03)',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDark ? '#34D399' : '#10B981',
            flexShrink: 0,
          }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Active Accounts
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: isDark ? '#F8FAFC' : '#0F172A', lineHeight: 1.2, margin: '2px 0' }}>
              {stats.active.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '700' }}>
              {stats.total > 0 ? `${((stats.active / stats.total) * 100).toFixed(0)}% Active Ratio` : '100% Ready'}
            </div>
          </div>
        </div>

        {/* Suspended */}
        <div className="card" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '18px 20px',
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          borderRadius: '16px',
          border: `1px solid ${isDark ? '#1F2937' : '#F1F5F9'}`,
          boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 4px 18px rgba(0, 0, 0, 0.03)',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FFFBEB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDark ? '#FBBF24' : '#F59E0B',
            flexShrink: 0,
          }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Suspended
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: isDark ? '#F8FAFC' : '#0F172A', lineHeight: 1.2, margin: '2px 0' }}>
              {stats.suspended.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '11px', color: stats.suspended > 0 ? '#EA580C' : '#10B981', fontWeight: '700' }}>
              {stats.suspended > 0 ? 'Requires Review' : '0 Restricted'}
            </div>
          </div>
        </div>

        {/* Blocked */}
        <div className="card" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '18px 20px',
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          borderRadius: '16px',
          border: `1px solid ${isDark ? '#1F2937' : '#F1F5F9'}`,
          boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 4px 18px rgba(0, 0, 0, 0.03)',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDark ? '#F87171' : '#EF4444',
            flexShrink: 0,
          }}>
            <UserX size={22} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Blocked
            </div>
            <div style={{ fontSize: '24px', fontWeight: '900', color: isDark ? '#F8FAFC' : '#0F172A', lineHeight: 1.2, margin: '2px 0' }}>
              {stats.blocked.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '11px', color: stats.blocked > 0 ? '#DC2626' : '#10B981', fontWeight: '700' }}>
              {stats.blocked > 0 ? 'Security Flagged' : '0 Blacklisted'}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="card" style={{
        padding: '16px 20px',
        backgroundColor: isDark ? '#111827' : '#FFFFFF',
        borderRadius: '16px',
        border: `1px solid ${isDark ? '#1F2937' : '#F1F5F9'}`,
        boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 4px 18px rgba(0, 0, 0, 0.03)',
      }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '12px' }} />
            <input
              type="text"
              placeholder="Search by name, email, mobile or user ID..."
              className="form-input"
              style={{
                paddingLeft: '38px',
                height: '40px',
                fontSize: '13px',
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
                color: isDark ? '#F8FAFC' : '#0F172A',
                borderRadius: '10px',
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <select
                className="form-input"
                style={{
                  height: '40px',
                  fontSize: '13px',
                  minWidth: '140px',
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="All">Status (All)</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>

            <div style={{ position: 'relative' }}>
              <select
                className="form-input"
                style={{
                  height: '40px',
                  fontSize: '13px',
                  minWidth: '130px',
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
              >
                <option value="All">Role (All)</option>
                <option value="user">User / Trader</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="data-table-container" style={{
        backgroundColor: isDark ? '#111827' : '#FFFFFF',
        borderRadius: '16px',
        border: `1px solid ${isDark ? '#1F2937' : '#F1F5F9'}`,
        boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 4px 18px rgba(0, 0, 0, 0.03)',
        overflow: 'hidden',
      }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '48px', textAlign: 'center' }}>#</th>
              <th>User</th>
              <th>Email / Mobile</th>
              <th>Wallet Balance</th>
              <th>xCoin</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#6366F1', fontWeight: '700' }}>
                  Loading real-time users from database...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: isDark ? '#94A3B8' : '#64748B' }}>
                  No users found in database matching your criteria.
                </td>
              </tr>
            ) : filteredUsers.map((u, idx) => (
              <tr key={u.id}>
                <td style={{ color: isDark ? '#64748B' : '#94A3B8', fontWeight: '800', textAlign: 'center' }}>
                  {idx + 1}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: u.avatarBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      fontWeight: '800',
                      fontSize: '12px',
                      flexShrink: 0
                    }}>
                      {u.name ? u.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', color: isDark ? '#F8FAFC' : '#0F172A', fontSize: '13.5px' }}>
                        {u.name || 'Unnamed User'}
                      </div>
                      <div style={{ fontSize: '11px', color: isDark ? '#64748B' : '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                        UID-{u.id.slice(-6).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '13px', color: isDark ? '#F1F5F9' : '#334155', fontWeight: '600' }}>{u.email}</div>
                  <div style={{ fontSize: '11px', color: isDark ? '#64748B' : '#94A3B8' }}>{u.mobile || 'No mobile linked'}</div>
                </td>
                <td style={{ fontWeight: '800', color: isDark ? '#F8FAFC' : '#0F172A', fontFamily: 'var(--font-mono)' }}>
                  {u.walletBalance}
                </td>
                <td style={{ fontWeight: '800', color: isDark ? '#60A5FA' : '#2563EB', fontFamily: 'var(--font-mono)' }}>
                  {u.xcoinBalance} xCoin
                </td>
                <td>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: u.role === 'superadmin' ? 'rgba(124, 58, 237, 0.15)' : u.role === 'admin' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                      color: u.role === 'superadmin' ? (isDark ? '#A78BFA' : '#7C3AED') : u.role === 'admin' ? (isDark ? '#60A5FA' : '#2563EB') : (isDark ? '#94A3B8' : '#475569'),
                      textTransform: 'capitalize',
                    }}
                  >
                    {u.role === 'superadmin' ? 'Super Admin' : u.role === 'admin' ? 'Admin' : 'Trader'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${
                    u.status === 'Active'
                      ? 'badge-completed'
                      : u.status === 'Suspended'
                      ? 'badge-pending'
                      : 'badge-processing'
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td style={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: '12.5px', fontWeight: '600' }}>
                  {u.joinedDate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dynamic "Add Users" Modal */}
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
                    Instant real trader provisioning on Zapp Pay
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
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter full legal name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="form-input"
                  style={{
                    backgroundColor: isDark ? '#111827' : '#FFFFFF',
                    border: `1px solid ${isDark ? '#374151' : '#E2E8F0'}`,
                    color: isDark ? '#F8FAFC' : '#0F172A',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: isDark ? '#94A3B8' : '#475569', marginBottom: '4px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="form-input"
                  style={{
                    backgroundColor: isDark ? '#111827' : '#FFFFFF',
                    border: `1px solid ${isDark ? '#374151' : '#E2E8F0'}`,
                    color: isDark ? '#F8FAFC' : '#0F172A',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: isDark ? '#94A3B8' : '#475569', marginBottom: '4px' }}>
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  className="form-input"
                  style={{
                    backgroundColor: isDark ? '#111827' : '#FFFFFF',
                    border: `1px solid ${isDark ? '#374151' : '#E2E8F0'}`,
                    color: isDark ? '#F8FAFC' : '#0F172A',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: isDark ? '#94A3B8' : '#475569', marginBottom: '4px' }}>
                    Account Role
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="form-input"
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isDark ? '#111827' : '#FFFFFF',
                      border: `1px solid ${isDark ? '#374151' : '#E2E8F0'}`,
                      color: isDark ? '#F8FAFC' : '#0F172A',
                    }}
                  >
                    <option value="Standard Trader">Standard Trader</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: isDark ? '#94A3B8' : '#475569', marginBottom: '4px' }}>
                    Opening xCoin Grant
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newUserBalance}
                    onChange={(e) => setNewUserBalance(e.target.value)}
                    className="form-input"
                    style={{
                      backgroundColor: isDark ? '#111827' : '#FFFFFF',
                      border: `1px solid ${isDark ? '#374151' : '#E2E8F0'}`,
                      color: isDark ? '#F8FAFC' : '#0F172A',
                    }}
                  />
                </div>
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

    </div>
  );
};
