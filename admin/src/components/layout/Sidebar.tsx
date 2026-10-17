import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Activity,
  type LucideIcon,
} from 'lucide-react';
import { MAIN_NAV_ITEMS, type NavItem } from '../../constants/navigation';
import { useSidebar } from '../../context/SidebarContext';
import { useTheme } from '../../context/ThemeContext';
import { ZappPayLogo } from '../common/ZappPayLogo';

export const Sidebar: React.FC = () => {
  const { isCollapsed, toggleCollapse, isMobileOpen, closeMobile } = useSidebar();
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Group items by category
  const categories = [
    { key: 'CORE', label: 'CORE MODULES' },
    { key: 'FINANCE', label: 'FINANCE & TRADING' },
    { key: 'COMMUNITY', label: 'GROWTH & REWARDS' },
    { key: 'CMS & LEGAL', label: 'CMS & COMPLIANCE' },
    { key: 'SYSTEM', label: 'SYSTEM & ROLES' },
  ] as const;

  const filteredItems = MAIN_NAV_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getBadgeStyle = (color?: NavItem['badgeColor']) => {
    switch (color) {
      case 'rose':
        return { bg: '#FCE7F3', text: '#BE185D' };
      case 'amber':
        return { bg: '#FEF3C7', text: '#B45309' };
      case 'blue':
      case 'indigo':
        return { bg: '#EDE9FE', text: '#7C3AED' };
      case 'emerald':
        return { bg: '#DCFCE7', text: '#15803D' };
      default:
        return { bg: '#F1F5F9', text: '#64748B' };
    }
  };

  return (
    <aside
      className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
      style={{
        width: isCollapsed ? '78px' : '260px',
        backgroundColor: isDark ? '#111827' : '#FFFFFF',
        borderRight: `1px solid ${isDark ? '#1F2937' : '#F1F5F9'}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 50,
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
        boxShadow: isDark ? '1px 0 16px rgba(0, 0, 0, 0.35)' : '1px 0 10px rgba(0, 0, 0, 0.02)',
      }}
    >
      {/* ── Brand Logo Header ── */}
      <div
        style={{
          padding: isCollapsed ? '20px 14px 16px' : '20px 20px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          borderBottom: `1px solid ${isDark ? '#1F2937' : '#F1F5F9'}`,
          minHeight: '70px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <ZappPayLogo
            variant={isCollapsed ? 'icon-only' : 'full'}
            size={isCollapsed ? 38 : 'md'}
            onClick={isCollapsed ? toggleCollapse : undefined}
            style={{ cursor: isCollapsed ? 'pointer' : 'default' }}
          />
        </div>

        {/* Collapse / Close Toggle Button */}
        {!isCollapsed && (
          <button
            onClick={toggleCollapse}
            title="Collapse sidebar"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
              border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? '#94A3B8' : '#64748B',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#EDE9FE';
              e.currentTarget.style.color = '#7C3AED';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isDark ? '#1E293B' : '#F8FAFC';
              e.currentTarget.style.color = isDark ? '#94A3B8' : '#64748B';
            }}
          >
            <ChevronLeft size={16} />
          </button>
        )}

        {/* Mobile Close Button */}
        {isMobileOpen && (
          <button
            onClick={closeMobile}
            title="Close menu"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EF4444',
              cursor: 'pointer',
              marginLeft: '8px',
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Expand Button when Collapsed ── */}
      {isCollapsed && (
        <div style={{ padding: '8px 12px 0', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={toggleCollapse}
            title="Expand sidebar"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#EDE9FE';
              e.currentTarget.style.color = '#7C3AED';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F8FAFC';
              e.currentTarget.style.color = '#64748B';
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ── Search / Filter Bar (Expanded Only) ── */}
      {!isCollapsed && (
        <div style={{ padding: '12px 14px 4px' }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#F8FAFC',
              borderRadius: '9px',
              border: '1px solid #E2E8F0',
              transition: 'border-color 0.15s ease',
            }}
          >
            <Search
              size={14}
              color="#94A3B8"
              style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }}
            />
            <input
              type="text"
              placeholder="Quick jump..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#0F172A',
                fontSize: '12px',
                padding: '7px 28px 7px 30px',
                fontFamily: 'var(--font-sans)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Navigation Menu List ── */}
      <nav
        className="sidebar-nav"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: isCollapsed ? '12px 10px 20px' : '10px 14px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: isCollapsed ? '6px' : '2px',
        }}
      >
        {searchQuery ? (
          // Search results
          filteredItems.length > 0 ? (
            filteredItems.map((item) => renderNavItem(item))
          ) : (
            <div
              style={{
                padding: '24px 12px',
                textAlign: 'center',
                color: '#94A3B8',
                fontSize: '12px',
              }}
            >
              No navigation found for "{searchQuery}"
            </div>
          )
        ) : (
          // Categorized groups
          categories.map((cat, idx) => {
            const catItems = MAIN_NAV_ITEMS.filter((item) => item.category === cat.key);
            if (catItems.length === 0) return null;

            return (
              <div key={cat.key} style={{ marginTop: idx === 0 ? '0px' : '10px' }}>
                {/* Category Section Header */}
                {!isCollapsed ? (
                  <div
                    style={{
                      fontSize: '9.5px',
                      fontWeight: '800',
                      letterSpacing: '0.8px',
                      color: '#94A3B8',
                      padding: '6px 12px 4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {cat.label}
                  </div>
                ) : (
                  idx > 0 && (
                    <div
                      style={{
                        height: '1px',
                        backgroundColor: '#F1F5F9',
                        margin: '6px 8px',
                      }}
                    />
                  )
                )}

                {/* Items in Category */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {catItems.map((item) => renderNavItem(item))}
                </div>
              </div>
            );
          })
        )}
      </nav>

      {/* ── Bottom Status Widget (Matching screenshot) ── */}
      <div
        style={{
          padding: isCollapsed ? '12px 8px' : '14px 16px',
          borderTop: `1px solid ${isDark ? '#1F2937' : '#F1F5F9'}`,
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '8px 0' : '10px 14px',
            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
            borderRadius: '12px',
            border: `1px solid ${isDark ? '#334155' : '#F1F5F9'}`,
          }}
          title="System Online: All services running smoothly"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 8px #10B981',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            {!isCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', color: isDark ? '#F8FAFC' : '#0F172A', fontWeight: '800' }}>
                  System Online
                </span>
                <span style={{ fontSize: '10px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: '600' }}>
                  All services running
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: isDark ? 'rgba(124, 58, 237, 0.2)' : '#F5F3FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDark ? '#A78BFA' : '#7C3AED',
              }}
            >
              <Activity size={15} />
            </div>
          )}
        </div>
      </div>
    </aside>
  );

  // Helper renderer for each nav item
  function renderNavItem(item: NavItem) {
    const Icon: LucideIcon = item.icon;
    const badgeStyle = getBadgeStyle(item.badgeColor);

    return (
      <div
        key={item.id}
        style={{ position: 'relative' }}
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <NavLink
          to={item.path}
          onClick={() => {
            if (isMobileOpen) closeMobile();
          }}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '10px 0' : '9.5px 12px',
            borderRadius: '10px',
            textDecoration: 'none',
            color: isActive ? '#A78BFA' : isDark ? '#94A3B8' : '#64748B',
            background: isActive
              ? isDark
                ? 'rgba(124, 58, 237, 0.18)'
                : 'rgba(124, 58, 237, 0.08)'
              : 'transparent',
            borderLeft: isActive && !isCollapsed ? '3.5px solid #7C3AED' : '3.5px solid transparent',
            fontWeight: isActive ? '800' : '600',
            fontSize: '13px',
            transition: 'all 0.16s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
          })}
          className={({ isActive }) => (isActive ? 'active-nav-link-light' : 'nav-link-light')}
        >
          {({ isActive }) => (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isCollapsed ? '0px' : '11px',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  width: isCollapsed ? '100%' : 'auto',
                }}
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.4 : 2}
                    color={isActive ? '#7C3AED' : '#64748B'}
                  />

                  {/* Dot indicator when collapsed and has badge */}
                  {isCollapsed && item.badge && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-3px',
                        right: '-5px',
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: badgeStyle.text,
                        border: '1.5px solid #FFFFFF',
                      }}
                    />
                  )}
                </div>

                {!isCollapsed && (
                  <span
                    style={{
                      whiteSpace: 'nowrap',
                      letterSpacing: '-0.1px',
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </div>

              {/* Badge count (expanded only) */}
              {!isCollapsed && item.badge && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '2px 7.5px',
                    borderRadius: '999px',
                    backgroundColor: badgeStyle.bg,
                    color: badgeStyle.text,
                    letterSpacing: '0.2px',
                    lineHeight: '1.3',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </>
          )}
        </NavLink>

        {/* Floating Tooltip in Collapsed Mode */}
        {isCollapsed && hoveredItem === item.id && (
          <div
            style={{
              position: 'absolute',
              left: 'calc(100% + 12px)',
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              borderRadius: '9px',
              padding: '7px 12px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              whiteSpace: 'nowrap',
              zIndex: 100,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'fadeIn 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: '800' }}>{item.label}</span>
                {item.badge && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: '800',
                      padding: '1px 6px',
                      borderRadius: '999px',
                      backgroundColor: badgeStyle.bg,
                      color: badgeStyle.text,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              {item.description && (
                <span style={{ fontSize: '10.5px', color: '#94A3B8' }}>{item.description}</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
};
