import React, { useState } from 'react';
import { Search, Bell, Sun, Moon, ChevronDown, LogOut, User, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { useTheme } from '../../context/ThemeContext';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { toggleMobile } = useSidebar();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const getInitials = (name?: string) => {
    if (!name || !name.trim()) return 'AD';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="header" style={{
      backgroundColor: isDark ? '#111827' : '#FFFFFF',
      borderBottom: `1px solid ${isDark ? '#1F2937' : '#F1F5F9'}`,
      height: '68px',
      padding: '0 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      transition: 'background-color 0.2s ease, border-color 0.2s ease',
    }}>
      {/* Left Area: Mobile Hamburger + Pill Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={toggleMobile}
          className="mobile-menu-btn"
          title="Open menu"
          style={{
            background: 'none',
            border: 'none',
            color: isDark ? '#94A3B8' : '#475569',
            cursor: 'pointer',
            padding: '6px',
            display: 'none',
            alignItems: 'center',
            borderRadius: '8px',
          }}
        >
          <Menu size={22} />
        </button>

        <div style={{ position: 'relative', width: '380px' }}>
          <Search
            size={16}
            color="#94A3B8"
            style={{ position: 'absolute', left: '14px', top: '12px' }}
          />
          <input
            type="text"
            placeholder="Search users, orders, transactions..."
            className="form-input"
            style={{
              paddingLeft: '38px',
              height: '40px',
              fontSize: '13px',
              borderRadius: '999px',
              backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
              borderColor: isDark ? '#334155' : '#E2E8F0',
              color: isDark ? '#F8FAFC' : '#0F172A',
            }}
          />
        </div>
      </div>

      {/* Right Top-Bar Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Notifications Icon with red dot */}
        <div
          onClick={() => navigate('/notifications')}
          style={{ position: 'relative', cursor: 'pointer', padding: '4px' }}
          title="Notifications"
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '999px',
            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
            border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDark ? '#94A3B8' : '#475569',
            transition: 'all 0.15s ease'
          }}>
            <Bell size={17} />
          </div>
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '8px',
            height: '8px',
            backgroundColor: '#EF4444',
            borderRadius: '50%',
            border: '2px solid #FFFFFF'
          }} />
        </div>

        {/* Sun / Moon Theme Toggle Icon */}
        <button
          onClick={toggleTheme}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '999px',
            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
            border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDark ? '#F59E0B' : '#475569',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: isDark ? '0 0 12px rgba(245, 158, 11, 0.2)' : 'none',
          }}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={17} />}
        </button>

        {/* Admin Profile Dropdown */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              padding: '3px 8px 3px 4px',
              borderRadius: '999px',
              backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
              border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
            }}
          >
            {/* Dynamic Avatar */}
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: '800',
              fontSize: '12px',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.35)',
              letterSpacing: '0.5px'
            }}>
              {getInitials(user?.name)}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', marginRight: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: isDark ? '#F8FAFC' : '#0F172A', lineHeight: '1.2' }}>
                {user?.name || 'Administrator'}
              </span>
              <span style={{ fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: '600' }}>
                {user?.role || 'Super Admin'}
              </span>
            </div>

            <ChevronDown size={14} color="#94A3B8" />
          </div>

          {/* Profile Menu Dropdown */}
          {showDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '48px',
                right: 0,
                width: '220px',
                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                borderRadius: '12px',
                boxShadow: isDark ? '0 10px 25px rgba(0,0,0,0.5)' : 'var(--shadow-dropdown)',
                border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
                padding: '6px',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
            >
              <div style={{ padding: '8px 12px', borderBottom: `1px solid ${isDark ? '#334155' : '#F1F5F9'}` }}>
                <div style={{ fontSize: '12.5px', fontWeight: '800', color: isDark ? '#F8FAFC' : '#0F172A' }}>
                  {user?.name || 'Administrator'}
                </div>
                <div style={{ fontSize: '11px', color: isDark ? '#94A3B8' : '#64748B' }}>
                  {user?.email || 'admin@zappay.com'}
                </div>
              </div>

              <div
                onClick={() => {
                  setShowDropdown(false);
                  navigate('/profile');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  fontSize: '12.5px',
                  color: isDark ? '#CBD5E1' : '#475569',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#F1F5F9')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <User size={14} color="#2563EB" />
                <span style={{ fontWeight: '600' }}>Account Profile</span>
              </div>

              <div
                onClick={() => {
                  setShowDropdown(false);
                  logout();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  color: '#DC2626',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                  marginTop: '4px'
                }}
              >
                <LogOut size={14} />
                <span>Log Out</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
