import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Eye,
  ThumbsUp,
  Video,
  FileText,
  CheckCircle2,
  Trash2,
  Download,
  LayoutGrid,
  List,
  ChevronDown,
  X,
  Play,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface TutorialItem {
  id: string;
  title: string;
  summary: string;
  category: 'Basics & Onboarding' | 'Security & 2FA' | 'xCoin & Trading' | 'Referrals & Growth' | 'Tax & Compliance';
  format: 'Video Tutorial' | 'Article & Guide' | 'Interactive Cheatsheet';
  duration: string;
  reads: number;
  likes: number;
  status: 'Published' | 'Draft';
  lastUpdated: string;
  author: string;
  keySteps?: string[];
  videoUrl?: string;
}

const INITIAL_ARTICLES: TutorialItem[] = [
  {
    id: 'TUT-101',
    title: 'How to deposit INR via Instant UPI & submit 12-digit UTR',
    summary: 'A step-by-step visual tutorial guiding new users through scanning the admin QR code, completing UPI payment, and pasting the reference number for instant balance approval.',
    category: 'Basics & Onboarding',
    format: 'Video Tutorial',
    duration: '3 mins video',
    reads: 42500,
    likes: 3820,
    status: 'Published',
    lastUpdated: '04 Oct 2026',
    author: 'Compliance Team',
    videoUrl: 'https://youtube.com/watch?v=sample-upi-deposit',
    keySteps: [
      'Open the ZapCoin app and navigate to "Deposit INR".',
      'Select UPI / Instant QR and enter your deposit amount (min ₹100).',
      'Scan the dynamic QR in GPay, PhonePe, or Paytm and complete the transfer.',
      'Copy the 12-digit Bank Reference (UTR) number from your payment app.',
      'Paste the UTR on ZapCoin and tap "Confirm Deposit" for 60-second settlement.',
    ],
  },
  {
    id: 'TUT-102',
    title: 'Understanding xCoin Liquidity Pools and 24-Hour Price Matching',
    summary: 'Explore how the automated market maker algorithm matches peer buy/sell orders, provides instant slippage-free execution, and calculates native reserve token value.',
    category: 'xCoin & Trading',
    format: 'Article & Guide',
    duration: '6 mins read',
    reads: 28900,
    likes: 2140,
    status: 'Published',
    lastUpdated: '02 Oct 2026',
    author: 'Chief Quantitative Analyst',
    keySteps: [
      'Navigate to the Trade tab and inspect the live 24h xCoin depth chart.',
      'Understand the spread difference between Maker buy rates and Taker sell orders.',
      'Executing market orders ensures 0% fee with sub-second finality.',
    ],
  },
  {
    id: 'TUT-103',
    title: 'Setting up Google Authenticator 2FA for Instant Bank Payouts',
    summary: 'Protect your account against phishing. Learn how to bind your mobile authenticator and secure crypto withdrawals with time-based OTP codes.',
    category: 'Security & 2FA',
    format: 'Video Tutorial',
    duration: '4 mins video',
    reads: 36200,
    likes: 3410,
    status: 'Published',
    lastUpdated: '28 Sep 2026',
    author: 'Security Operations',
    videoUrl: 'https://youtube.com/watch?v=sample-2fa-setup',
    keySteps: [
      'Go to Profile -> Security Settings -> Two-Factor Authentication.',
      'Backup your 16-character emergency recovery secret key on paper.',
      'Scan the barcode in Google Authenticator or Microsoft Authenticator.',
      'Enter the generated 6-digit PIN to activate instant withdrawals.',
    ],
  },
  {
    id: 'TUT-104',
    title: 'Maximizing Your 3-Tier Referral Commissions & Lifetime Royalties',
    summary: 'Comprehensive playbook on sharing your invite code, building an active trader network, and claiming up to 25% automated daily referral payouts.',
    category: 'Referrals & Growth',
    format: 'Article & Guide',
    duration: '5 mins read',
    reads: 19800,
    likes: 1720,
    status: 'Published',
    lastUpdated: '24 Sep 2026',
    author: 'Growth Lead',
    keySteps: [
      'Find your personal referral invite code in the Team dashboard.',
      'Tier 1 direct referrals yield 15% of all platform trade spreads.',
      'Tier 2 yields 7% and Tier 3 yields 3% recurring monthly royalty.',
    ],
  },
  {
    id: 'TUT-105',
    title: 'Taxation Guidelines: Understanding 1% TDS on Crypto Transfers',
    summary: 'Official advisory on Indian VDA (Virtual Digital Asset) compliance, tracking your annual transaction statement, and submitting tax returns.',
    category: 'Tax & Compliance',
    format: 'Interactive Cheatsheet',
    duration: '8 mins read',
    reads: 14600,
    likes: 980,
    status: 'Published',
    lastUpdated: '18 Sep 2026',
    author: 'Legal & Tax Counsel',
    keySteps: [
      'Every sell order automatically deducts 1% Section 194S TDS.',
      'Download your quarterly Form 16A TDS certificate from the Reports tab.',
      'Reconcile transaction ledger hashes with your annual IT filing.',
    ],
  },
  {
    id: 'TUT-106',
    title: 'Advanced Order Types: Setting Stop-Loss & Limit Orders',
    summary: 'Master order book execution to mitigate market risk during volatile Bitcoin and Ethereum price swings.',
    category: 'xCoin & Trading',
    format: 'Article & Guide',
    duration: '7 mins read',
    reads: 8900,
    likes: 640,
    status: 'Draft',
    lastUpdated: '06 Oct 2026',
    author: 'Trading Desk',
    keySteps: [
      'Configure limit order price triggers above the support trendline.',
      'Trigger notifications alert when target prices execute.',
    ],
  },
];

export const LearningPage: React.FC = () => {
  useTheme();

  // State
  const [articles, setArticles] = useState<TutorialItem[]>(INITIAL_ARTICLES);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFormat, setSelectedFormat] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [readerItem, setReaderItem] = useState<TutorialItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Tutorial Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formCategory, setFormCategory] = useState<TutorialItem['category']>('Basics & Onboarding');
  const [formFormat, setFormFormat] = useState<TutorialItem['format']>('Article & Guide');
  const [formDuration, setFormDuration] = useState('5 mins read');
  const [formSteps, setFormSteps] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Aggregated Counts
  const counts = useMemo(() => {
    return {
      all: articles.length,
      published: articles.filter((a) => a.status === 'Published').length,
      draft: articles.filter((a) => a.status === 'Draft').length,
      totalReads: articles.reduce((sum, a) => sum + a.reads, 0),
      totalLikes: articles.reduce((sum, a) => sum + a.likes, 0),
    };
  }, [articles]);

  // Filtered Articles
  const filteredArticles = useMemo(() => {
    return articles.filter((item) => {
      const matchCat = selectedCategory === 'All' ? true : item.category === selectedCategory;
      const matchFormat = selectedFormat === 'All' ? true : item.format === selectedFormat;
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchFormat && matchSearch;
    });
  }, [articles, selectedCategory, selectedFormat, searchQuery]);

  // Toggle Publish Status
  const togglePublishStatus = (id: string) => {
    setArticles((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const next = a.status === 'Published' ? 'Draft' : 'Published';
          showToast(`Guide "${a.title.slice(0, 30)}..." changed to ${next}`);
          return { ...a, status: next };
        }
        return a;
      })
    );
  };

  // Delete article
  const handleDelete = (id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
    showToast(`Tutorial #${id} removed from Academy`);
  };

  // Like incrementer
  const handleLike = (id: string) => {
    setArticles((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          return { ...a, likes: a.likes + 1 };
        }
        return a;
      })
    );
    if (readerItem && readerItem.id === id) {
      setReaderItem({ ...readerItem, likes: readerItem.likes + 1 });
    }
    showToast('❤️ Thank you! Feedback recorded.');
  };

  // Submit Add
  const handleAddTutorial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const newId = `TUT-${100 + articles.length + 1}`;
    const stepsArray = formSteps
      ? formSteps.split('\n').filter((s) => s.trim().length > 0)
      : ['Follow the in-app guidance steps to complete this process safely.'];

    const newRecord: TutorialItem = {
      id: newId,
      title: formTitle,
      summary: formSummary || formTitle,
      category: formCategory,
      format: formFormat,
      duration: formDuration,
      reads: 120,
      likes: 18,
      status: 'Published',
      lastUpdated: 'Today',
      author: 'Admin Editorial',
      keySteps: stepsArray,
      videoUrl: formVideoUrl || undefined,
    };

    setArticles([newRecord, ...articles]);
    setIsAddModalOpen(false);
    showToast(`📚 "${formTitle}" published successfully!`);

    // Reset Form
    setFormTitle('');
    setFormSummary('');
    setFormSteps('');
    setFormVideoUrl('');
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = 'ID,Title,Category,Format,Duration,Reads,Likes,Status,LastUpdated,Author\n';
    const rows = filteredArticles
      .map(
        (a) =>
          `"${a.id}","${a.title.replace(/"/g, '""')}","${a.category}","${a.format}","${a.duration}",${a.reads},${a.likes},"${a.status}","${a.lastUpdated}","${a.author}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `academy_guides_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredArticles.length} guides to CSV`);
  };

  // Category Badge Colors
  const getCategoryColor = (cat: TutorialItem['category']) => {
    switch (cat) {
      case 'Basics & Onboarding':
        return { bg: 'rgba(34, 197, 94, 0.12)', color: '#16A34A' };
      case 'Security & 2FA':
        return { bg: 'rgba(239, 68, 68, 0.12)', color: '#EF4444' };
      case 'xCoin & Trading':
        return { bg: 'rgba(59, 130, 246, 0.12)', color: '#2563EB' };
      case 'Referrals & Growth':
        return { bg: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6' };
      case 'Tax & Compliance':
        return { bg: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' };
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

      {/* ── Top Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-0.4px', margin: 0 }}>
              Learning Academy & CMS
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', fontWeight: '500', margin: '4px 0 0' }}>
            Author, publish, and manage in-app onboarding guides, trading masterclasses, and step-by-step videos.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* View Mode Toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-input)',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              padding: '3px',
            }}
          >
            <button
              onClick={() => setViewMode('grid')}
              title="Card Grid View"
              style={{
                padding: '6px 10px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: viewMode === 'grid' ? 'var(--bg-card)' : 'transparent',
                color: viewMode === 'grid' ? '#2563EB' : 'var(--text-secondary)',
                boxShadow: viewMode === 'grid' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Compact Table View"
              style={{
                padding: '6px 10px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: viewMode === 'table' ? 'var(--bg-card)' : 'transparent',
                color: viewMode === 'table' ? '#2563EB' : 'var(--text-secondary)',
                boxShadow: viewMode === 'table' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <List size={16} />
            </button>
          </div>

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
            onClick={() => setIsAddModalOpen(true)}
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
            <span>Add Tutorial / Guide</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI Stat Cards ── */}
      <div className="stat-grid-4">
        {/* Card 1: Published Guides */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Published Guides
              </div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-main)', marginTop: '6px', letterSpacing: '-0.5px' }}>
                {counts.published} <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>/ {counts.all}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#22C55E', fontWeight: '700', marginTop: '4px' }}>
                100% indexed in-app mobile search
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(34, 197, 94, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={20} color="#22C55E" />
            </div>
          </div>
        </div>

        {/* Card 2: Total Academy Reads */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Total Readers
              </div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#2563EB', marginTop: '6px', letterSpacing: '-0.5px' }}>
                {(counts.totalReads / 1000).toFixed(1)}k
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', marginTop: '4px' }}>
                +24.1% monthly academy engagement
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(37, 99, 235, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Eye size={20} color="#2563EB" />
            </div>
          </div>
        </div>

        {/* Card 3: User Helpful Likes */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Helpful Rating
              </div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#EC4899', marginTop: '6px', letterSpacing: '-0.5px' }}>
                98.4%
              </div>
              <div style={{ fontSize: '12px', color: '#EC4899', fontWeight: '700', marginTop: '4px' }}>
                {counts.totalLikes.toLocaleString()} positive upvotes
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(236, 72, 153, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ThumbsUp size={20} color="#EC4899" />
            </div>
          </div>
        </div>

        {/* Card 4: Video Lessons */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Video Tutorials
              </div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#8B5CF6', marginTop: '6px', letterSpacing: '-0.5px' }}>
                {articles.filter((a) => a.format === 'Video Tutorial').length}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', marginTop: '4px' }}>
                HD video guides embedded
              </div>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(139, 92, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Video size={20} color="#8B5CF6" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Toolbar Card ── */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Category Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div className="filter-tabs-bar" style={{ margin: 0 }}>
            {['All', 'Basics & Onboarding', 'Security & 2FA', 'xCoin & Trading', 'Referrals & Growth', 'Tax & Compliance'].map((cat) => {
              const catCount = cat === 'All' ? articles.length : articles.filter((a) => a.category === cat).length;
              return (
                <button
                  key={cat}
                  className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>{cat}</span>
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: '800',
                      backgroundColor: selectedCategory === cat ? '#2563EB' : 'var(--bg-input)',
                      color: selectedCategory === cat ? '#FFFFFF' : 'var(--text-secondary)',
                    }}
                  >
                    {catCount}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: '600' }}>
            Showing <strong style={{ color: 'var(--text-main)' }}>{filteredArticles.length}</strong> of {articles.length} items
          </div>
        </div>

        {/* Search & Format Filter */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '13px' }} />
            <input
              type="text"
              placeholder="Search tutorials, UPI guide, 2FA, xCoin staking, tax..."
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '38px', height: '40px', fontSize: '13.5px' }}
            />
          </div>

          {/* Format dropdown */}
          <div style={{ position: 'relative', width: '200px' }}>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="form-input"
              style={{ height: '40px', appearance: 'none', paddingRight: '30px', cursor: 'pointer' }}
            >
              <option value="All">All Formats</option>
              <option value="Video Tutorial">Video Tutorials 🎬</option>
              <option value="Article & Guide">Articles & Guides 📄</option>
              <option value="Interactive Cheatsheet">Interactive Cheatsheet ⚡</option>
            </select>
            <ChevronDown size={14} color="#94A3B8" style={{ position: 'absolute', right: '12px', top: '13px', pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      {/* ── Visual Presentation: Card Grid View or Table View ── */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredArticles.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              No learning guides found for this selection.
            </div>
          ) : (
            filteredArticles.map((art) => {
              const catBadge = getCategoryColor(art.category);

              return (
                <div
                  key={art.id}
                  className="card"
                  style={{
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '18px',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    position: 'relative',
                  }}
                >
                  {/* Card Top */}
                  <div>
                    {/* Header Row: Category Badge + Status Toggle */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: catBadge.bg,
                          color: catBadge.color,
                        }}
                      >
                        {art.category}
                      </span>

                      <button
                        onClick={() => togglePublishStatus(art.id)}
                        title="Click to toggle Published / Draft"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <span
                          className={`badge ${art.status === 'Published' ? 'badge-completed' : 'badge-pending'}`}
                          style={{ fontSize: '11px', padding: '2px 8px' }}
                        >
                          {art.status}
                        </span>
                        {art.status === 'Published' ? (
                          <ToggleRight size={18} color="#22C55E" />
                        ) : (
                          <ToggleLeft size={18} color="#94A3B8" />
                        )}
                      </button>
                    </div>

                    {/* Title */}
                    <h3
                      onClick={() => setReaderItem(art)}
                      style={{
                        fontSize: '16px',
                        fontWeight: '800',
                        color: 'var(--text-main)',
                        margin: '0 0 8px',
                        cursor: 'pointer',
                        lineHeight: 1.4,
                      }}
                    >
                      {art.title}
                    </h3>

                    {/* Summary */}
                    <p
                      style={{
                        fontSize: '12.5px',
                        color: 'var(--text-secondary)',
                        margin: 0,
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {art.summary}
                    </p>
                  </div>

                  {/* Card Meta & Bottom Actions */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 0',
                        borderTop: '1px solid var(--border-color)',
                        borderBottom: '1px solid var(--border-color)',
                        fontSize: '11.5px',
                        color: 'var(--text-secondary)',
                        fontWeight: '600',
                        marginBottom: '14px',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {art.format === 'Video Tutorial' ? <Video size={13} color="#8B5CF6" /> : <FileText size={13} color="#2563EB" />}
                        {art.duration}
                      </span>
                      <span>👁️ {art.reads.toLocaleString()} reads</span>
                      <span
                        onClick={() => handleLike(art.id)}
                        style={{ cursor: 'pointer', color: '#EC4899', fontWeight: '700' }}
                      >
                        👍 {art.likes}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        Updated {art.lastUpdated}
                      </span>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setReaderItem(art)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#2563EB', fontWeight: '700', padding: '5px 12px' }}
                        >
                          <Eye size={13} />
                          <span>Preview</span>
                        </button>
                        <button
                          onClick={() => handleDelete(art.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#EF4444', padding: '5px 8px' }}
                          title="Delete guide"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table View */
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '70px' }}>ID</th>
                <th>Tutorial Title</th>
                <th style={{ width: '150px' }}>Category</th>
                <th style={{ width: '130px' }}>Format</th>
                <th style={{ width: '100px' }}>Reads</th>
                <th style={{ width: '90px' }}>Likes</th>
                <th style={{ width: '110px' }}>Status</th>
                <th style={{ width: '110px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.map((art) => {
                const catBadge = getCategoryColor(art.category);

                return (
                  <tr key={art.id}>
                    <td>
                      <span style={{ fontWeight: '800', color: '#2563EB', fontFamily: 'var(--font-mono)' }}>
                        {art.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '13.5px' }}>
                          {art.title}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {art.duration} • By {art.author}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: catBadge.bg,
                          color: catBadge.color,
                        }}
                      >
                        {art.category}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {art.format === 'Video Tutorial' ? <Video size={13} color="#8B5CF6" /> : <FileText size={13} color="#2563EB" />}
                        {art.format}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{art.reads.toLocaleString()}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '700', color: '#EC4899' }}>{art.likes}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => togglePublishStatus(art.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        <span className={`badge ${art.status === 'Published' ? 'badge-completed' : 'badge-pending'}`}>
                          {art.status}
                        </span>
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <button
                          onClick={() => setReaderItem(art)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 9px', color: '#2563EB' }}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(art.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 9px', color: '#EF4444' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal: Add Tutorial / Guide ── */}
      {isAddModalOpen && (
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
              maxWidth: '640px',
              padding: '28px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(37, 99, 235, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={20} color="#2563EB" />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>
                    Add Academy Tutorial / Guide
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    Create educational content indexed directly in the user app.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddTutorial} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  Tutorial Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How to buy xCoin with instant INR UPI transfer"
                  className="form-input"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  style={{ height: '42px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  Brief Summary / Intro
                </label>
                <textarea
                  rows={2}
                  placeholder="Short introductory overview explaining what the reader will learn..."
                  className="form-input"
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="form-input"
                    style={{ height: '42px' }}
                  >
                    <option value="Basics & Onboarding">Basics & Onboarding</option>
                    <option value="Security & 2FA">Security & 2FA</option>
                    <option value="xCoin & Trading">xCoin & Trading</option>
                    <option value="Referrals & Growth">Referrals & Growth</option>
                    <option value="Tax & Compliance">Tax & Compliance</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    Format
                  </label>
                  <select
                    value={formFormat}
                    onChange={(e) => setFormFormat(e.target.value as any)}
                    className="form-input"
                    style={{ height: '42px' }}
                  >
                    <option value="Article & Guide">Article & Guide 📄</option>
                    <option value="Video Tutorial">Video Tutorial 🎬</option>
                    <option value="Interactive Cheatsheet">Interactive Cheatsheet ⚡</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    Estimated Read / Watch Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5 mins read"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    className="form-input"
                    style={{ height: '42px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    Video URL (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://youtube.com/watch?v=..."
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    className="form-input"
                    style={{ height: '42px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                  Step-by-Step Instructions (One per line)
                </label>
                <textarea
                  rows={4}
                  placeholder={"Step 1: Open wallet tab\nStep 2: Enter transaction amount\nStep 3: Confirm with 2FA..."}
                  className="form-input"
                  value={formSteps}
                  onChange={(e) => setFormSteps(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
                  Publish Guide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Reader & Video Simulator ── */}
      {readerItem && (
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
              maxWidth: '680px',
              padding: '32px',
              borderRadius: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid var(--border-color)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: getCategoryColor(readerItem.category).bg,
                    color: getCategoryColor(readerItem.category).color,
                    display: 'inline-block',
                    marginBottom: '8px',
                  }}
                >
                  {readerItem.category} • {readerItem.format}
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-main)', margin: 0, lineHeight: 1.35 }}>
                  {readerItem.title}
                </h2>
                <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  <span>⏱️ {readerItem.duration}</span>
                  <span>✍️ By {readerItem.author}</span>
                  <span>🗓️ Updated {readerItem.lastUpdated}</span>
                </div>
              </div>

              <button
                onClick={() => setReaderItem(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Video Player Simulator if Video */}
            {readerItem.format === 'Video Tutorial' && (
              <div
                style={{
                  height: '220px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  color: '#FFFFFF',
                  marginBottom: '20px',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#8B5CF6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 18px rgba(139, 92, 246, 0.5)',
                    cursor: 'pointer',
                  }}
                >
                  <Play size={24} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: '3px' }} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700' }}>
                  Interactive HD Video Player Simulation
                </span>
              </div>
            )}

            {/* Summary */}
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                fontSize: '13.5px',
                color: 'var(--text-main)',
                lineHeight: 1.6,
                marginBottom: '20px',
              }}
            >
              {readerItem.summary}
            </div>

            {/* Key Action Steps */}
            {readerItem.keySteps && readerItem.keySteps.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px' }}>
                  Key Action Steps:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {readerItem.keySteps.map((step, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <span
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          backgroundColor: '#2563EB',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.5 }}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions: Helpful like, share, close */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button
                onClick={() => handleLike(readerItem.id)}
                className="btn btn-secondary"
                style={{
                  height: '40px',
                  padding: '0 18px',
                  fontWeight: '700',
                  color: '#EC4899',
                  borderColor: 'rgba(236, 72, 153, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ThumbsUp size={16} />
                <span>Helpful ({readerItem.likes})</span>
              </button>

              <button
                onClick={() => setReaderItem(null)}
                className="btn btn-primary"
                style={{ height: '40px', padding: '0 24px', fontWeight: '800' }}
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningPage;
