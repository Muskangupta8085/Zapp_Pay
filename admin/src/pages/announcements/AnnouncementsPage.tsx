import React, { useState, useMemo } from 'react';
import {
  Megaphone,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  Trash2,
  AlertTriangle,
  Flame,
  Wrench,
  Sparkles,
  Info,
  Smartphone,
  X,
  Download,
  Search,
  ExternalLink,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Send,
  Zap,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  bannerType: 'Promo' | 'Maintenance' | 'Notice' | 'Update' | 'Popup Alert';
  targetAudience: 'All Users' | 'KYC Verified' | 'VIP Traders' | 'New Users';
  priority: 'Normal' | 'High' | 'Critical';
  status: 'Active' | 'Scheduled' | 'Draft' | 'Expired';
  startDate: string;
  endDate: string;
  ctaText?: string;
  ctaLink?: string;
  impressions: number;
  clicks: number;
}

const INITIAL_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'ANN-101',
    title: 'Diwali Trading Bonanza: 0% Maker Fees on all INR pairs!',
    content: 'Celebrate festivities with zero trading fees across all crypto-to-INR spot orders. Valid for all users throughout Diwali week.',
    bannerType: 'Promo',
    targetAudience: 'All Users',
    priority: 'High',
    status: 'Active',
    startDate: '01 Oct 2026',
    endDate: '15 Oct 2026',
    ctaText: 'Trade Now',
    ctaLink: '/orders',
    impressions: 48250,
    clicks: 6120,
  },
  {
    id: 'ANN-102',
    title: 'Scheduled Bank Gateway Maintenance from 2:00 AM to 4:00 AM IST',
    content: 'IMPS & NEFT deposit processing will undergo banking server updates. Crypto trading and internal wallet transfers remain fully operational.',
    bannerType: 'Maintenance',
    targetAudience: 'All Users',
    priority: 'Critical',
    status: 'Active',
    startDate: '06 Oct 2026',
    endDate: '08 Oct 2026',
    ctaText: 'View Details',
    ctaLink: '/deposits',
    impressions: 31900,
    clicks: 4210,
  },
  {
    id: 'ANN-103',
    title: 'Mandatory PAN/Aadhaar Re-verification for high-volume limits (> ₹1 Lakh)',
    content: 'Complying with FIU guidelines, all tier-2 traders are requested to re-validate documents before 31st Oct to enjoy instant withdrawals.',
    bannerType: 'Notice',
    targetAudience: 'KYC Verified',
    priority: 'Normal',
    status: 'Active',
    startDate: '28 Sep 2026',
    endDate: '31 Oct 2026',
    ctaText: 'Verify KYC',
    ctaLink: '/users',
    impressions: 22400,
    clicks: 3480,
  },
  {
    id: 'ANN-104',
    title: 'xCoin Version 3.0 Core Engine Release and Staking Rewards',
    content: 'Upgrade to lightning order execution and earn up to 18.4% APY on locked xCoin staking pools.',
    bannerType: 'Update',
    targetAudience: 'VIP Traders',
    priority: 'High',
    status: 'Scheduled',
    startDate: '12 Oct 2026',
    endDate: '25 Oct 2026',
    ctaText: 'Explore xCoin',
    ctaLink: '/xcoin',
    impressions: 0,
    clicks: 0,
  },
  {
    id: 'ANN-105',
    title: 'Welcome Bonus: ₹50 Instant Cashback on 1st INR Deposit',
    content: 'Deposit a minimum of ₹500 via UPI and get ₹50 free xCoin balance credited directly into your trading wallet.',
    bannerType: 'Promo',
    targetAudience: 'New Users',
    priority: 'Normal',
    status: 'Active',
    startDate: '15 Sep 2026',
    endDate: '30 Oct 2026',
    ctaText: 'Deposit Now',
    ctaLink: '/deposits',
    impressions: 16800,
    clicks: 2950,
  },
  {
    id: 'ANN-106',
    title: 'Emergency Server Scaling & Latency Optimization Notice',
    content: 'Temporary traffic surge managed successfully. Cloud clusters scaled to 4x capacity.',
    bannerType: 'Popup Alert',
    targetAudience: 'All Users',
    priority: 'Critical',
    status: 'Expired',
    startDate: '20 Sep 2026',
    endDate: '22 Sep 2026',
    impressions: 59300,
    clicks: 1200,
  },
  {
    id: 'ANN-107',
    title: 'Refer & Earn Tier-3 Commission Booster Draft',
    content: 'Upcoming partner program giving 35% revenue share for top-tier affiliates.',
    bannerType: 'Update',
    targetAudience: 'VIP Traders',
    priority: 'Normal',
    status: 'Draft',
    startDate: '20 Oct 2026',
    endDate: '05 Nov 2026',
    impressions: 0,
    clicks: 0,
  },
];

export const AnnouncementsPage: React.FC = () => {
  useTheme();

  // State
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(INITIAL_ANNOUNCEMENTS);
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Scheduled' | 'Draft' | 'Expired'>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedAudience, setSelectedAudience] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<AnnouncementItem | null>(null);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New announcement form fields
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formType, setFormType] = useState<AnnouncementItem['bannerType']>('Promo');
  const [formAudience, setFormAudience] = useState<AnnouncementItem['targetAudience']>('All Users');
  const [formPriority, setFormPriority] = useState<AnnouncementItem['priority']>('High');
  const [formStartDate, setFormStartDate] = useState('08 Oct 2026');
  const [formEndDate, setFormEndDate] = useState('22 Oct 2026');
  const [formCtaText, setFormCtaText] = useState('Learn More');
  const [formCtaLink, setFormCtaLink] = useState('/orders');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Counts
  const counts = useMemo(() => {
    return {
      all: announcements.length,
      active: announcements.filter((a) => a.status === 'Active').length,
      scheduled: announcements.filter((a) => a.status === 'Scheduled').length,
      draft: announcements.filter((a) => a.status === 'Draft').length,
      expired: announcements.filter((a) => a.status === 'Expired').length,
      impressions: announcements.reduce((sum, a) => sum + a.impressions, 0),
      clicks: announcements.reduce((sum, a) => sum + a.clicks, 0),
    };
  }, [announcements]);

  // Filtered List
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      const matchTab = activeTab === 'All' ? true : a.status === activeTab;
      const matchType = selectedType === 'All' ? true : a.bannerType === selectedType;
      const matchAudience = selectedAudience === 'All' ? true : a.targetAudience === selectedAudience;
      const matchSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.targetAudience.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTab && matchType && matchAudience && matchSearch;
    });
  }, [announcements, activeTab, selectedType, selectedAudience, searchQuery]);

  // Toggle active status
  const toggleStatus = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const nextStatus = a.status === 'Active' ? 'Expired' : 'Active';
          showToast(`Announcement ${a.id} status changed to ${nextStatus}`);
          return { ...a, status: nextStatus };
        }
        return a;
      })
    );
  };

  // Delete
  const handleDelete = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    showToast(`Announcement ${id} deleted successfully`);
  };

  // Submit create
  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const newId = `ANN-${100 + announcements.length + 1}`;
    const newRecord: AnnouncementItem = {
      id: newId,
      title: formTitle,
      content: formContent || formTitle,
      bannerType: formType,
      targetAudience: formAudience,
      priority: formPriority,
      status: 'Active',
      startDate: formStartDate,
      endDate: formEndDate,
      ctaText: formCtaText,
      ctaLink: formCtaLink,
      impressions: 120,
      clicks: 14,
    };

    setAnnouncements([newRecord, ...announcements]);
    setIsCreateModalOpen(false);
    showToast(`🚀 "${formTitle}" broadcasted successfully!`);

    // Reset
    setFormTitle('');
    setFormContent('');
  };

  // Emergency Alert trigger
  const handleEmergencyBroadcast = (type: string) => {
    const alertId = `ALERT-${Date.now().toString().slice(-4)}`;
    let title = 'Emergency Maintenance Notice';
    let content = 'Platform banking routes are momentarily paused for security updates.';

    if (type === 'freeze') {
      title = 'Security Alert: UPI Gateway Temporarily Suspended';
      content = 'Banking nodal maintenance in progress. Expected resolution in 45 minutes.';
    } else if (type === 'market') {
      title = 'High Market Volatility Advisory: Trade with Discretion';
      content = 'Global crypto markets experiencing rapid fluctuations. Circuit limits active.';
    }

    const emergencyItem: AnnouncementItem = {
      id: alertId,
      title,
      content,
      bannerType: 'Popup Alert',
      targetAudience: 'All Users',
      priority: 'Critical',
      status: 'Active',
      startDate: 'Today, Just Now',
      endDate: 'Until Revoked',
      ctaText: 'Status Page',
      ctaLink: '/risk-security',
      impressions: 1,
      clicks: 0,
    };

    setAnnouncements([emergencyItem, ...announcements]);
    setIsEmergencyModalOpen(false);
    showToast(`🚨 Emergency Broadcast #${alertId} deployed live to all mobile apps & web!`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = 'ID,Title,Type,Audience,Priority,Status,StartDate,EndDate,Impressions,Clicks\n';
    const rows = filteredAnnouncements
      .map(
        (a) =>
          `"${a.id}","${a.title.replace(/"/g, '""')}","${a.bannerType}","${a.targetAudience}","${a.priority}","${a.status}","${a.startDate}","${a.endDate}",${a.impressions},${a.clicks}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `announcements_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredAnnouncements.length} announcements to CSV`);
  };

  // Helper badge style
  const getTypeBadge = (type: AnnouncementItem['bannerType']) => {
    switch (type) {
      case 'Promo':
        return { bg: 'rgba(236, 72, 153, 0.12)', color: '#EC4899', icon: <Flame size={12} /> };
      case 'Maintenance':
        return { bg: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', icon: <Wrench size={12} /> };
      case 'Notice':
        return { bg: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', icon: <Info size={12} /> };
      case 'Update':
        return { bg: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6', icon: <Sparkles size={12} /> };
      case 'Popup Alert':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', icon: <AlertTriangle size={12} /> };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            padding: '14px 22px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13.5px',
            fontWeight: '700',
            border: '1px solid #334155',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <CheckCircle2 size={18} color="#22C55E" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Top Header Bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-0.4px', margin: 0 }}>
              Announcements & Broadcasts
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', fontWeight: '500', margin: '4px 0 0' }}>
            Broadcast real-time mobile app push banners, top headers, promotional splash popups, and banking maintenance alerts.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsEmergencyModalOpen(true)}
            className="btn btn-secondary"
            style={{
              height: '42px',
              padding: '0 16px',
              color: '#EF4444',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              backgroundColor: 'rgba(239, 68, 68, 0.06)',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
            }}
          >
            <AlertTriangle size={15} color="#EF4444" />
            <span>Emergency Alert</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{
              height: '42px',
              padding: '0 16px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
            }}
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
            style={{
              height: '42px',
              padding: '0 18px',
              borderRadius: '10px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            }}
          >
            <Plus size={17} strokeWidth={2.6} />
            <span>New Announcement</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI Stat Cards ── */}
      <div className="stat-grid-4">
        {/* Card 1: Active Banners */}
        <div className="card" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Active Broadcasts
              </div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-main)', marginTop: '6px', letterSpacing: '-0.5px' }}>
                {counts.active} <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>/ {counts.all}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#22C55E', fontWeight: '700', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
                Live on mobile & web
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(34, 197, 94, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Megaphone size={20} color="#22C55E" />
            </div>
          </div>
        </div>

        {/* Card 2: Total Impressions */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Total Impressions
              </div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#2563EB', marginTop: '6px', letterSpacing: '-0.5px' }}>
                {(counts.impressions / 1000).toFixed(1)}k
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', marginTop: '4px' }}>
                +18.4% user reach this week
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(37, 99, 235, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Eye size={20} color="#2563EB" />
            </div>
          </div>
        </div>

        {/* Card 3: Click-Through Rate */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Click-Through Rate
              </div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#8B5CF6', marginTop: '6px', letterSpacing: '-0.5px' }}>
                {counts.impressions > 0 ? ((counts.clicks / counts.impressions) * 100).toFixed(1) : 0}%
              </div>
              <div style={{ fontSize: '12px', color: '#8B5CF6', fontWeight: '700', marginTop: '4px' }}>
                {counts.clicks.toLocaleString()} total interactions
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(139, 92, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={20} color="#8B5CF6" />
            </div>
          </div>
        </div>

        {/* Card 4: Scheduled / Queue */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Upcoming Queue
              </div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#F59E0B', marginTop: '6px', letterSpacing: '-0.5px' }}>
                {counts.scheduled + counts.draft}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', marginTop: '4px' }}>
                {counts.scheduled} scheduled, {counts.draft} draft
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} color="#F59E0B" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Toolbar Card ── */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Capsule Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div className="filter-tabs-bar" style={{ margin: 0 }}>
            {(['All', 'Active', 'Scheduled', 'Draft', 'Expired'] as const).map((tab) => {
              const tabCount =
                tab === 'All'
                  ? counts.all
                  : tab === 'Active'
                  ? counts.active
                  : tab === 'Scheduled'
                  ? counts.scheduled
                  : tab === 'Draft'
                  ? counts.draft
                  : counts.expired;

              return (
                <button
                  key={tab}
                  className={`filter-pill ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>{tab}</span>
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: '800',
                      backgroundColor: activeTab === tab ? '#2563EB' : 'var(--bg-input)',
                      color: activeTab === tab ? '#FFFFFF' : 'var(--text-secondary)',
                    }}
                  >
                    {tabCount}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: '600' }}>
            Showing <strong style={{ color: 'var(--text-main)' }}>{filteredAnnouncements.length}</strong> of {announcements.length}
          </div>
        </div>

        {/* Search & Dropdowns Row */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '13px' }} />
            <input
              type="text"
              placeholder="Search announcements, title, audience, content..."
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '38px', height: '40px', fontSize: '13.5px' }}
            />
          </div>

          {/* Type Dropdown */}
          <div style={{ position: 'relative', width: '170px' }}>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="form-input"
              style={{ height: '40px', appearance: 'none', paddingRight: '30px', cursor: 'pointer' }}
            >
              <option value="All">All Types</option>
              <option value="Promo">Promo</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Notice">Notice</option>
              <option value="Update">Update</option>
              <option value="Popup Alert">Popup Alert</option>
            </select>
            <ChevronDown size={14} color="#94A3B8" style={{ position: 'absolute', right: '12px', top: '13px', pointerEvents: 'none' }} />
          </div>

          {/* Audience Dropdown */}
          <div style={{ position: 'relative', width: '170px' }}>
            <select
              value={selectedAudience}
              onChange={(e) => setSelectedAudience(e.target.value)}
              className="form-input"
              style={{ height: '40px', appearance: 'none', paddingRight: '30px', cursor: 'pointer' }}
            >
              <option value="All">All Audiences</option>
              <option value="All Users">All Users</option>
              <option value="KYC Verified">KYC Verified</option>
              <option value="VIP Traders">VIP Traders</option>
              <option value="New Users">New Users</option>
            </select>
            <ChevronDown size={14} color="#94A3B8" style={{ position: 'absolute', right: '12px', top: '13px', pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      {/* ── Announcements Table ── */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '70px' }}>ID</th>
              <th>Banner Title & Message</th>
              <th style={{ width: '130px' }}>Type</th>
              <th style={{ width: '140px' }}>Audience</th>
              <th style={{ width: '120px' }}>Duration</th>
              <th style={{ width: '120px' }}>Reach / CTR</th>
              <th style={{ width: '110px' }}>Status</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAnnouncements.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                  No announcements match your search criteria.
                </td>
              </tr>
            ) : (
              filteredAnnouncements.map((ann) => {
                const badge = getTypeBadge(ann.bannerType);
                const ctr = ann.impressions > 0 ? ((ann.clicks / ann.impressions) * 100).toFixed(1) : '0';

                return (
                  <tr key={ann.id}>
                    {/* ID */}
                    <td>
                      <span
                        style={{
                          fontWeight: '800',
                          fontSize: '12.5px',
                          color: '#2563EB',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {ann.id}
                      </span>
                    </td>

                    {/* Title & Preview */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxWidth: '420px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '13.5px' }}>
                            {ann.title}
                          </span>
                          {ann.priority === 'Critical' && (
                            <span
                              style={{
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: '800',
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                color: '#EF4444',
                                textTransform: 'uppercase',
                              }}
                            >
                              Urgent
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ann.content}
                        </span>
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 9px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          backgroundColor: badge.bg,
                          color: badge.color,
                        }}
                      >
                        {badge.icon}
                        <span>{ann.bannerType}</span>
                      </span>
                    </td>

                    {/* Audience */}
                    <td>
                      <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                        {ann.targetAudience}
                      </span>
                    </td>

                    {/* Duration */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{ann.startDate}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>to {ann.endDate}</span>
                      </div>
                    </td>

                    {/* Performance / CTR */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: '700' }}>
                          <span style={{ color: 'var(--text-main)' }}>{ann.impressions.toLocaleString()}</span>
                          <span style={{ color: '#2563EB' }}>{ctr}%</span>
                        </div>
                        <div style={{ height: '4px', backgroundColor: 'var(--bg-input)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(100, Math.max(8, Number(ctr) * 4))}%`,
                              backgroundColor: '#2563EB',
                              borderRadius: '2px',
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status with Toggle */}
                    <td>
                      <button
                        onClick={() => toggleStatus(ann.id)}
                        title="Click to toggle Active / Expired"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span
                          className={`badge ${
                            ann.status === 'Active'
                              ? 'badge-completed'
                              : ann.status === 'Scheduled'
                              ? 'badge-processing'
                              : ann.status === 'Draft'
                              ? 'badge-pending'
                              : 'badge-failed'
                          }`}
                        >
                          {ann.status}
                        </span>
                        {ann.status === 'Active' ? (
                          <ToggleRight size={18} color="#22C55E" />
                        ) : (
                          <ToggleLeft size={18} color="#94A3B8" />
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button
                          onClick={() => setPreviewItem(ann)}
                          title="Preview banner mockup"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 9px', color: '#2563EB' }}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(ann.id)}
                          title="Delete announcement"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 9px', color: '#EF4444' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal: Create Announcement ── */}
      {isCreateModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '620px',
              padding: '28px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(37, 99, 235, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Megaphone size={20} color="#2563EB" />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>
                    Create In-App Announcement
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    Publish instantly to mobile users and web dashboard headers.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Bonanza: 0% Trading Fees on all INR orders"
                  className="form-input"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  style={{ height: '42px', fontSize: '13.5px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  Message Content / Body
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain the announcement details, terms, and benefits..."
                  className="form-input"
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  style={{ fontSize: '13.5px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    Banner Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="form-input"
                    style={{ height: '42px' }}
                  >
                    <option value="Promo">Promo 🔥</option>
                    <option value="Maintenance">Maintenance 🔧</option>
                    <option value="Notice">Notice ℹ️</option>
                    <option value="Update">Update ✨</option>
                    <option value="Popup Alert">Popup Alert 🚨</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    Target Audience
                  </label>
                  <select
                    value={formAudience}
                    onChange={(e) => setFormAudience(e.target.value as any)}
                    className="form-input"
                    style={{ height: '42px' }}
                  >
                    <option value="All Users">All Users</option>
                    <option value="KYC Verified">KYC Verified Only</option>
                    <option value="VIP Traders">VIP Traders Only</option>
                    <option value="New Users">New Users Only</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    Priority
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="form-input"
                    style={{ height: '42px' }}
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High 🔥</option>
                    <option value="Critical">Critical 🚨</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    Start Date
                  </label>
                  <input
                    type="text"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="form-input"
                    style={{ height: '42px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="form-input"
                    style={{ height: '42px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    Button (CTA Text)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Trade Now"
                    value={formCtaText}
                    onChange={(e) => setFormCtaText(e.target.value)}
                    className="form-input"
                    style={{ height: '42px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    Button Action / Route
                  </label>
                  <input
                    type="text"
                    placeholder="/orders"
                    value={formCtaLink}
                    onChange={(e) => setFormCtaLink(e.target.value)}
                    className="form-input"
                    style={{ height: '42px' }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ height: '42px', padding: '0 20px', fontWeight: '700' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ height: '42px', padding: '0 24px', fontWeight: '800' }}
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Preview In-App Mockup ── */}
      {previewItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '28px',
              borderRadius: '24px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={18} color="#2563EB" />
                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>
                  In-App Banner Preview
                </span>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile Banner Simulator Card */}
            <div
              style={{
                borderRadius: '16px',
                padding: '20px',
                background:
                  previewItem.bannerType === 'Promo'
                    ? 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)'
                    : previewItem.bannerType === 'Maintenance'
                    ? 'linear-gradient(135deg, #D97706 0%, #B45309 100%)'
                    : previewItem.bannerType === 'Popup Alert'
                    ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)'
                    : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.22)',
                  }}
                >
                  {previewItem.bannerType} • {previewItem.targetAudience}
                </span>
                <span style={{ fontSize: '11px', opacity: 0.85 }}>{previewItem.startDate}</span>
              </div>

              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '900', margin: '0 0 6px', lineHeight: 1.3 }}>
                  {previewItem.title}
                </h4>
                <p style={{ fontSize: '12.5px', opacity: 0.92, margin: 0, lineHeight: 1.45 }}>
                  {previewItem.content}
                </p>
              </div>

              {previewItem.ctaText && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#FFFFFF',
                      color: '#0F172A',
                      fontWeight: '800',
                      fontSize: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <span>{previewItem.ctaText}</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              )}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setPreviewItem(null)}
                className="btn btn-secondary"
                style={{ height: '38px', padding: '0 18px', fontWeight: '700' }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Emergency Broadcast ── */}
      {isEmergencyModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '28px',
              borderRadius: '20px',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              boxShadow: '0 24px 60px rgba(239, 68, 68, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={20} color="#EF4444" />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#EF4444', margin: 0 }}>
                    Emergency Platform Alert
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    Select a high-priority advisory to push instantly across the system.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEmergencyModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '20px 0' }}>
              <button
                onClick={() => handleEmergencyBroadcast('freeze')}
                className="btn btn-secondary"
                style={{
                  padding: '14px',
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                }}
              >
                <Zap size={20} color="#EF4444" />
                <div>
                  <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '13.5px' }}>
                    UPI / Bank Maintenance Alert
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Notifies users of temporary deposit/withdrawal banking gateway delays.
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleEmergencyBroadcast('market')}
                className="btn btn-secondary"
                style={{
                  padding: '14px',
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                }}
              >
                <AlertTriangle size={20} color="#F59E0B" />
                <div>
                  <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '13.5px' }}>
                    Market Volatility Risk Advisory
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Advises traders to set stop-loss limits during unexpected market spikes.
                  </div>
                </div>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsEmergencyModalOpen(false)}
                className="btn btn-secondary"
                style={{ height: '38px', padding: '0 18px', fontWeight: '700' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
