import React, { useState, useMemo, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import {
  Search,
  Download,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Copy,
  Eye,
  X,
  ShieldCheck,
  Check,
  Radio,
  Award,
  CreditCard,
  Building,
  Smartphone,
  RefreshCw,
  Gift,
  Coins,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface TransactionRecord {
  id: string;
  txHash: string;
  user: string;
  email: string;
  phone: string;
  avatarBg: string;
  type: 'Deposit' | 'Withdrawal' | 'Trade' | 'Reward';
  displayAmount: string;
  displaySubAmount: string;
  rawAmount: number;
  cryptoAmt: string;
  asset: string;
  methodTitle: string;
  methodSubtitle: string;
  methodRaw: string;
  ref: string;
  status: 'Completed' | 'Pending' | 'Processing' | 'Failed';
  timestamp: string;
  fullDate: string;
  fee: string;
  rawFee: number;
  kycTier: string;
  rawDate: Date;
  isAdmin?: boolean;
}

export const TransactionsPage: React.FC = () => {
  const { isDark } = useTheme();

  const [activeTypeTab, setActiveTypeTab] = useState<'All' | 'Deposit' | 'Withdrawal' | 'Trade' | 'Reward'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Pending' | 'Processing' | 'Failed'>('All');
  const [assetFilter, setAssetFilter] = useState<'All' | 'INR Fiat' | 'xCoin' | 'USDT'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.listTransactions();
      if (res.success && Array.isArray(res.data)) {
        const avatarColors = ['#2563EB', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#6366F1'];
        const mapped: TransactionRecord[] = res.data.map((tx: any, idx: number) => {
          const userObj = tx.senderId || tx.receiverId || {};
          const isDeposit = tx.type === 'deposit';
          const isWithdrawal = tx.type === 'withdrawal';
          const isReward = tx.type === 'reward';
          const isTrade = tx.type === 'trade';

          let typeFormatted: TransactionRecord['type'] = 'Deposit';
          if (isWithdrawal) typeFormatted = 'Withdrawal';
          else if (isReward) typeFormatted = 'Reward';
          else if (isTrade) typeFormatted = 'Trade';

          const statusMap: Record<string, TransactionRecord['status']> = {
            completed: 'Completed',
            pending: 'Pending',
            processing: 'Processing',
            failed: 'Failed',
            cancelled: 'Failed',
          };

          const txDate = tx.createdAt ? new Date(tx.createdAt) : new Date();
          const symbol = String(tx.symbol || 'INR').toUpperCase();
          const isZap = symbol === 'ZAP';
          const isUsdt = symbol === 'USDT';
          const assetName = isZap ? 'xCoin' : (isUsdt ? 'USDT' : 'INR Fiat');
          const numAmt = Number(tx.amount || 0);

          let displayAmount = '';
          let displaySubAmount = '';

          if (isZap) {
            displayAmount = `${isDeposit || isReward ? '+' : isWithdrawal ? '-' : ''}${numAmt.toLocaleString('en-IN')} xCoin`;
            displaySubAmount = `≈ ₹${numAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          } else if (isUsdt) {
            displayAmount = `${isDeposit ? '+' : isWithdrawal ? '-' : ''}${numAmt.toFixed(2)} USDT`;
            displaySubAmount = `≈ ₹${(numAmt * 90).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          } else {
            displayAmount = `${isDeposit || isReward ? '+' : isWithdrawal ? '-' : ''}₹ ${numAmt.toLocaleString('en-IN')}`;
            displaySubAmount = isDeposit ? 'Instant UPI / QR' : isWithdrawal ? 'Bank IMPS Payout' : 'Fiat Balance';
          }

          // Parse notes into clean title + subtitle
          const rawNotes = tx.notes || (isDeposit ? 'Instant UPI Gateway' : isWithdrawal ? 'Bank IMPS Payout' : isReward ? 'Reward Airdrop' : 'Automated Engine');
          let methodTitle = rawNotes;
          let methodSubtitle = '';
          if (rawNotes.includes(':')) {
            const parts = rawNotes.split(':');
            methodTitle = parts[0].trim();
            methodSubtitle = parts.slice(1).join(':').trim();
          }

          const userName = userObj.fullName || userObj.email?.split('@')[0] || 'Trader';
          const userEmail = userObj.email || '';
          const isAdmin = userEmail.includes('admin') || userName.toLowerCase().includes('admin');

          return {
            id: tx.referenceId || `TXN-${(tx._id || String(idx)).slice(-6).toUpperCase()}`,
            txHash: tx.txHash || `0x${tx._id || ''}`,
            user: userName,
            email: userEmail,
            phone: userObj.phone || '',
            avatarBg: avatarColors[idx % avatarColors.length],
            type: typeFormatted,
            displayAmount,
            displaySubAmount,
            rawAmount: numAmt,
            cryptoAmt: isZap ? `${numAmt} xCoin` : isUsdt ? `${numAmt} USDT` : `₹ ${numAmt.toLocaleString('en-IN')}`,
            asset: assetName,
            methodTitle,
            methodSubtitle,
            methodRaw: rawNotes,
            ref: tx.referenceId || `REF-${(tx._id || '').slice(-8)}`,
            status: statusMap[tx.status] || 'Completed',
            timestamp: txDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fullDate: txDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + txDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fee: `₹ ${Number(tx.fee || 0).toFixed(2)}`,
            rawFee: Number(tx.fee || 0),
            kycTier: userObj.kycStatus === 'verified' ? 'Tier 3 (Verified)' : 'Tier 1 (Basic)',
            rawDate: txDate,
            isAdmin,
          };
        });
        setTransactions(mapped);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error('Failed to load transactions', err);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Computed KPI Metrics from real data
  const kpiMetrics = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    let volume24h = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let feeRevenue = 0;

    transactions.forEach((t) => {
      feeRevenue += t.rawFee;
      if (t.status === 'Completed') {
        completedCount++;
      } else if (t.status === 'Pending' || t.status === 'Processing') {
        pendingCount++;
      }

      if (now - t.rawDate.getTime() <= oneDayMs) {
        volume24h += t.rawAmount;
      }
    });

    const totalCount = transactions.length;
    const successRate = totalCount > 0 ? ((completedCount / totalCount) * 100).toFixed(1) : '100.0';

    const formatCurrency = (val: number) => {
      if (val >= 10000000) return `₹ ${(val / 10000000).toFixed(2)} Cr`;
      if (val >= 100000) return `₹ ${(val / 100000).toFixed(2)} L`;
      return `₹ ${Math.round(val).toLocaleString('en-IN')}`;
    };

    return {
      volume24hFormatted: formatCurrency(volume24h),
      volume24h,
      successRate: `${successRate}%`,
      completedCount,
      pendingCount: `${pendingCount} Txns`,
      pendingRaw: pendingCount,
      feeRevenueFormatted: `₹ ${Math.round(feeRevenue).toLocaleString('en-IN')}`,
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesType = activeTypeTab === 'All' || tx.type === activeTypeTab;
      const matchesStatus = statusFilter === 'All' || tx.status === statusFilter;
      const matchesAsset = assetFilter === 'All' || tx.asset.includes(assetFilter);
      const matchesSearch =
        tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.methodRaw.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.txHash.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesStatus && matchesAsset && matchesSearch;
    });
  }, [transactions, activeTypeTab, statusFilter, assetFilter, searchQuery]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    triggerToast(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('No transactions to export');
      return;
    }

    const headers = ['TXN ID', 'User', 'Email', 'Phone', 'Type', 'Amount', 'Asset', 'Method', 'Reference', 'Status', 'Timestamp', 'Fee'];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.user,
      t.email,
      t.phone,
      t.type,
      `"${t.displayAmount}"`,
      t.asset,
      `"${t.methodRaw}"`,
      t.ref,
      t.status,
      `"${t.fullDate}"`,
      `"${t.fee}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ZappPay_Transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast(`Exported ${filteredTransactions.length} transactions to CSV!`);
  };

  // Helper for KPI Sparklines
  const generateSparkline = (data: number[], color: string) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 80;
    const height = 34;

    const pts = data.map((val, idx) => ({
      x: (idx / (data.length - 1)) * width,
      y: height - ((val - min) / range) * (height - 8) - 4,
    }));

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

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`grad_${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={isDark ? 0.4 : 0.25} />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#grad_${color.replace('#', '')})`} />
        <path d={d} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  const getStatusBadge = (status: TransactionRecord['status']) => {
    switch (status) {
      case 'Completed':
        return (
          <span
            className="badge badge-completed"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap',
              fontWeight: '700',
              padding: '3px 10px',
            }}
          >
            <CheckCircle2 size={13} />
            Completed
          </span>
        );
      case 'Processing':
        return (
          <span
            className="badge badge-processing"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap',
              fontWeight: '700',
              padding: '3px 10px',
            }}
          >
            <Clock size={13} />
            Processing
          </span>
        );
      case 'Pending':
        return (
          <span
            className="badge badge-pending"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap',
              fontWeight: '700',
              padding: '3px 10px',
            }}
          >
            <AlertTriangle size={13} />
            Pending
          </span>
        );
      case 'Failed':
        return (
          <span
            className="badge badge-failed"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap',
              fontWeight: '700',
              padding: '3px 10px',
            }}
          >
            <XCircle size={13} />
            Failed
          </span>
        );
    }
  };

  const getTypeBadge = (type: TransactionRecord['type']) => {
    switch (type) {
      case 'Deposit':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '12px',
              fontWeight: '800',
              color: '#10B981',
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
              padding: '3px 10px',
              borderRadius: '999px',
              whiteSpace: 'nowrap',
            }}
          >
            <ArrowDownLeft size={13} strokeWidth={2.4} />
            Deposit
          </span>
        );
      case 'Withdrawal':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '12px',
              fontWeight: '800',
              color: '#E11D48',
              backgroundColor: isDark ? 'rgba(225, 29, 72, 0.15)' : '#FCE7F3',
              padding: '3px 10px',
              borderRadius: '999px',
              whiteSpace: 'nowrap',
            }}
          >
            <ArrowUpRight size={13} strokeWidth={2.4} />
            Withdrawal
          </span>
        );
      case 'Trade':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '12px',
              fontWeight: '800',
              color: '#6366F1',
              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
              padding: '3px 10px',
              borderRadius: '999px',
              whiteSpace: 'nowrap',
            }}
          >
            <ArrowLeftRight size={13} strokeWidth={2.4} />
            Trade
          </span>
        );
      case 'Reward':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '12px',
              fontWeight: '800',
              color: '#D97706',
              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7',
              padding: '3px 10px',
              borderRadius: '999px',
              whiteSpace: 'nowrap',
            }}
          >
            <Award size={13} strokeWidth={2.4} />
            Reward
          </span>
        );
    }
  };

  const getMethodIcon = (type: TransactionRecord['type'], method: string) => {
    if (type === 'Reward' || method.toLowerCase().includes('reward') || method.toLowerCase().includes('airdrop')) {
      return <Gift size={14} color="#D97706" />;
    }
    if (method.includes('UPI') || method.includes('GPay') || method.includes('PhonePe')) {
      return <Smartphone size={14} color="#2563EB" />;
    }
    if (method.includes('IMPS') || method.includes('Bank') || method.includes('Payout')) {
      return <Building size={14} color="#7C3AED" />;
    }
    return <CreditCard size={14} color="#10B981" />;
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

      {/* ── Top Header Bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: '900',
                color: 'var(--text-main)',
                letterSpacing: '-0.5px',
                margin: 0,
              }}
            >
              Transactions Ledger
            </h1>
          </div>
          <p
            style={{
              fontSize: '13.5px',
              color: 'var(--text-secondary)',
              fontWeight: '500',
              margin: '4px 0 0',
            }}
          >
            Complete real-time audit ledger for user deposits, bank payouts, crypto orders, and airdrop rewards.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={fetchTransactions}
            disabled={isLoading}
            className="btn btn-secondary btn-sm"
            style={{
              borderRadius: '999px',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Syncing...' : 'Sync Live'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="btn btn-secondary btn-sm"
            style={{
              borderRadius: '999px',
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
            }}
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── 4 Top KPI Stat Cards ── */}
      <div className="stat-grid-4">
        {/* Card 1: 24h Volume */}
        <div
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 22px',
            borderRadius: '16px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#EDE9FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6366F1',
              }}
            >
              <CreditCard size={22} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  fontWeight: '800',
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                }}
              >
                24H TRADING VOLUME
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: '900',
                  color: 'var(--text-main)',
                  letterSpacing: '-0.5px',
                  margin: '2px 0',
                }}
              >
                {kpiMetrics.volume24hFormatted}
              </div>
              <div style={{ fontSize: '11.5px', color: '#16A34A', fontWeight: '800' }}>
                Live Stream <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>from today</span>
              </div>
            </div>
          </div>
          <div style={{ width: '80px', height: '36px' }}>
            {generateSparkline([15, 24, 20, 32, 28, 40, 48], '#6366F1')}
          </div>
        </div>

        {/* Card 2: Success Rate */}
        <div
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 22px',
            borderRadius: '16px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981',
              }}
            >
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  fontWeight: '800',
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                }}
              >
                SUCCESS RATE
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: '900',
                  color: 'var(--text-main)',
                  letterSpacing: '-0.5px',
                  margin: '2px 0',
                }}
              >
                {kpiMetrics.successRate}
              </div>
              <div style={{ fontSize: '11.5px', color: '#10B981', fontWeight: '800' }}>
                {kpiMetrics.completedCount}{' '}
                <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>cleared transactions</span>
              </div>
            </div>
          </div>
          <div style={{ width: '80px', height: '36px' }}>
            {generateSparkline([28, 30, 32, 29, 36, 38, 42], '#10B981')}
          </div>
        </div>

        {/* Card 3: Pending Queue */}
        <div
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 22px',
            borderRadius: '16px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F59E0B',
              }}
            >
              <Clock size={22} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  fontWeight: '800',
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                }}
              >
                PENDING QUEUE
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: '900',
                  color: 'var(--text-main)',
                  letterSpacing: '-0.5px',
                  margin: '2px 0',
                }}
              >
                {kpiMetrics.pendingCount}
              </div>
              <div style={{ fontSize: '11.5px', color: '#F59E0B', fontWeight: '800' }}>
                {kpiMetrics.pendingRaw > 0 ? 'Requires admin audit' : 'Queue fully cleared'}
              </div>
            </div>
          </div>
          <div style={{ width: '80px', height: '36px' }}>
            {generateSparkline([10, 16, 12, 20, 15, 22, 18], '#F59E0B')}
          </div>
        </div>

        {/* Card 4: Fee Revenue */}
        <div
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 22px',
            borderRadius: '16px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: isDark ? 'rgba(236, 72, 153, 0.2)' : '#FCE7F3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EC4899',
              }}
            >
              <Coins size={22} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  fontWeight: '800',
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                }}
              >
                FEE REVENUE
              </div>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: '900',
                  color: 'var(--text-main)',
                  letterSpacing: '-0.5px',
                  margin: '2px 0',
                }}
              >
                {kpiMetrics.feeRevenueFormatted}
              </div>
              <div style={{ fontSize: '11.5px', color: '#16A34A', fontWeight: '800' }}>
                Trading & IMPS spreads
              </div>
            </div>
          </div>
          <div style={{ width: '80px', height: '36px' }}>
            {generateSparkline([12, 18, 25, 22, 30, 28, 38], '#EC4899')}
          </div>
        </div>
      </div>

      {/* ── Main Ledger Card with Filter Toolbar & Data Table ── */}
      <div
        className="card"
        style={{
          padding: '22px 24px',
          borderRadius: '20px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-card)',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Type Tabs Bar */}
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
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(
              [
                { key: 'All', label: 'All Types' },
                { key: 'Deposit', label: 'Deposit' },
                { key: 'Withdrawal', label: 'Withdrawal' },
                { key: 'Trade', label: 'Trade' },
                { key: 'Reward', label: 'Reward & Airdrop' },
              ] as const
            ).map((tab) => {
              const count =
                tab.key === 'All'
                  ? transactions.length
                  : transactions.filter((t) => t.type === tab.key).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTypeTab(tab.key)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '999px',
                    fontSize: '12.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: activeTypeTab === tab.key ? '#6366F1' : 'var(--border-color)',
                    backgroundColor:
                      activeTypeTab === tab.key
                        ? isDark
                          ? 'rgba(99, 102, 241, 0.22)'
                          : 'rgba(99, 102, 241, 0.1)'
                        : 'var(--bg-card)',
                    color: activeTypeTab === tab.key ? '#6366F1' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                    boxShadow:
                      activeTypeTab === tab.key ? '0 2px 8px rgba(99, 102, 241, 0.2)' : 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      opacity: 0.8,
                      padding: '1px 6px',
                      borderRadius: '999px',
                      backgroundColor:
                        activeTypeTab === tab.key
                          ? 'rgba(99, 102, 241, 0.25)'
                          : 'var(--bg-input)',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>
            Showing <strong style={{ color: 'var(--text-main)' }}>{filteredTransactions.length}</strong> of{' '}
            {transactions.length} records
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '18px',
            flexWrap: 'wrap',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '12px' }} />
            <input
              type="text"
              placeholder="Search TXN ID, Trader Name, Phone, UTR, or Hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{
                paddingLeft: '38px',
                height: '40px',
                fontSize: '13px',
                borderRadius: '12px',
                width: '100%',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Status Dropdown */}
            <div style={{ position: 'relative', width: '150px' }}>
              <select
                className="form-input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{
                  height: '40px',
                  borderRadius: '12px',
                  paddingRight: '30px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Failed">Failed</option>
              </select>
              <ChevronDown
                size={14}
                color="#94A3B8"
                style={{ position: 'absolute', right: '12px', top: '13px', pointerEvents: 'none' }}
              />
            </div>

            {/* Asset Dropdown */}
            <div style={{ position: 'relative', width: '140px' }}>
              <select
                className="form-input"
                value={assetFilter}
                onChange={(e) => setAssetFilter(e.target.value as any)}
                style={{
                  height: '40px',
                  borderRadius: '12px',
                  paddingRight: '30px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <option value="All">All Assets</option>
                <option value="INR Fiat">INR Fiat</option>
                <option value="xCoin">xCoin Native</option>
                <option value="USDT">USDT Vault</option>
              </select>
              <ChevronDown
                size={14}
                color="#94A3B8"
                style={{ position: 'absolute', right: '12px', top: '13px', pointerEvents: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div
          className="data-table-container"
          style={{
            overflowX: 'auto',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card)',
            boxShadow: 'var(--shadow-sm)',
            width: '100%',
          }}
        >
          <table
            className="data-table"
            style={{
              width: '100%',
              minWidth: '1100px',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr>
                <th style={{ whiteSpace: 'nowrap', width: '180px' }}>TXN ID</th>
                <th style={{ whiteSpace: 'nowrap', width: '220px' }}>Trader / User</th>
                <th style={{ whiteSpace: 'nowrap', width: '130px' }}>Type</th>
                <th style={{ whiteSpace: 'nowrap', width: '150px' }}>Amount</th>
                <th style={{ whiteSpace: 'nowrap', width: '110px' }}>Asset</th>
                <th style={{ whiteSpace: 'nowrap', width: '260px' }}>Gateway / Method</th>
                <th style={{ whiteSpace: 'nowrap', width: '200px' }}>Reference / UTR</th>
                <th style={{ whiteSpace: 'nowrap', width: '130px' }}>Status</th>
                <th style={{ whiteSpace: 'nowrap', width: '90px' }}>Time</th>
                <th style={{ textAlign: 'center', whiteSpace: 'nowrap', width: '100px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '48px 20px', color: '#94A3B8' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <RefreshCw size={24} className="animate-spin" color="#2563EB" />
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>Loading ledger transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                  >
                    {/* TXN ID */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: '800',
                            fontSize: '12px',
                            color: 'var(--primary)',
                            backgroundColor: 'rgba(37, 99, 235, 0.08)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(37, 99, 235, 0.15)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {tx.id}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(tx.id, 'Transaction ID');
                          }}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: copiedHash === tx.id ? '#10B981' : 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '3px',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                          title="Copy TXN ID"
                        >
                          {copiedHash === tx.id ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>

                    {/* Trader */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            backgroundColor: tx.avatarBg,
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '800',
                            fontSize: '12.5px',
                            flexShrink: 0,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                          }}
                        >
                          {tx.user[0] ? tx.user[0].toUpperCase() : 'U'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                fontWeight: '800',
                                color: 'var(--text-main)',
                                fontSize: '13px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {tx.user}
                            </span>
                            {tx.isAdmin && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: '800',
                                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                                  color: '#6366F1',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  textTransform: 'uppercase',
                                }}
                              >
                                Admin
                              </span>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {tx.email || tx.phone || 'Verified User'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td style={{ whiteSpace: 'nowrap' }}>{getTypeBadge(tx.type)}</td>

                    {/* Amount */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div
                        style={{
                          fontWeight: '900',
                          color:
                            tx.type === 'Reward'
                              ? '#D97706'
                              : tx.type === 'Deposit'
                              ? '#10B981'
                              : tx.type === 'Withdrawal'
                              ? '#E11D48'
                              : 'var(--text-main)',
                          fontSize: '13.5px',
                          fontFamily: 'var(--font-mono)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tx.displayAmount}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                          fontWeight: '600',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tx.displaySubAmount}
                      </div>
                    </td>

                    {/* Asset */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          fontWeight: '700',
                          fontSize: '12.5px',
                          color: 'var(--text-main)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-app)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        {tx.asset}
                      </span>
                    </td>

                    {/* Gateway / Method */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            backgroundColor:
                              tx.type === 'Reward'
                                ? 'rgba(245, 158, 11, 0.12)'
                                : tx.type === 'Deposit'
                                ? 'rgba(16, 185, 129, 0.12)'
                                : tx.type === 'Withdrawal'
                                ? 'rgba(225, 29, 72, 0.12)'
                                : 'rgba(99, 102, 241, 0.12)',
                            color:
                              tx.type === 'Reward'
                                ? '#D97706'
                                : tx.type === 'Deposit'
                                ? '#10B981'
                                : tx.type === 'Withdrawal'
                                ? '#E11D48'
                                : '#6366F1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {getMethodIcon(tx.type, tx.methodRaw)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span
                            style={{
                              fontWeight: '700',
                              color: 'var(--text-main)',
                              fontSize: '12.5px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {tx.methodTitle}
                          </span>
                          {tx.methodSubtitle && (
                            <span
                              style={{
                                fontSize: '11px',
                                color: 'var(--text-muted)',
                                whiteSpace: 'nowrap',
                                maxWidth: '240px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title={tx.methodSubtitle}
                            >
                              {tx.methodSubtitle}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Reference / UTR */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <code
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11.5px',
                            color: 'var(--text-secondary)',
                            backgroundColor: 'var(--bg-input)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            fontWeight: '700',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {tx.ref}
                        </code>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(tx.ref, 'Reference');
                          }}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: copiedHash === tx.ref ? '#10B981' : 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '3px',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                          title="Copy reference / UTR"
                        >
                          {copiedHash === tx.ref ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ whiteSpace: 'nowrap' }}>{getStatusBadge(tx.status)}</td>

                    {/* Timestamp */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                        {tx.timestamp}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTx(tx);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{
                          padding: '5px 12px',
                          fontSize: '12px',
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          color: 'var(--primary)',
                          fontWeight: '800',
                          border: '1px solid var(--border-color)',
                          boxShadow: 'none',
                        }}
                      >
                        <Eye size={13} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No transactions match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Transaction Detail Modal / Inspector ── */}
      {selectedTx && (
        <div
          onClick={() => setSelectedTx(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '24px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--border-color)',
              padding: '26px',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '16px',
                marginBottom: '18px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main)' }}>
                    Transaction #{selectedTx.id}
                  </span>
                  {getStatusBadge(selectedTx.status)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                  {selectedTx.fullDate}
                </div>
              </div>

              <button
                onClick={() => setSelectedTx(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* 3 Summary Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                marginBottom: '18px',
              }}
            >
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    fontSize: '10.5px',
                    color: 'var(--text-secondary)',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                  }}
                >
                  Amount
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: '900',
                    color: 'var(--text-main)',
                    marginTop: '4px',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {selectedTx.displayAmount}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--primary)', fontWeight: '700' }}>
                  {selectedTx.displaySubAmount}
                </div>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    fontSize: '10.5px',
                    color: 'var(--text-secondary)',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                  }}
                >
                  Protocol Fee
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: '900',
                    color: 'var(--text-main)',
                    marginTop: '4px',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {selectedTx.fee}
                </div>
                <div style={{ fontSize: '10.5px', color: '#10B981', fontWeight: '700' }}>
                  Network Cleared
                </div>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    fontSize: '10.5px',
                    color: 'var(--text-secondary)',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                  }}
                >
                  Asset & Type
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: '900',
                    color: 'var(--text-main)',
                    marginTop: '4px',
                  }}
                >
                  {selectedTx.asset}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: '600' }}>
                  {selectedTx.type}
                </div>
              </div>
            </div>

            {/* Trader & Settlement Details */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                fontSize: '13px',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '16px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Trader Identity:</span>
                <span style={{ fontWeight: '800', color: 'var(--text-main)' }}>
                  {selectedTx.user} {selectedTx.phone ? `(${selectedTx.phone})` : ''}
                </span>
              </div>
              {selectedTx.email && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Email Address:</span>
                  <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{selectedTx.email}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>KYC Level:</span>
                <span style={{ fontWeight: '800', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} />
                  {selectedTx.kycTier}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Payment Gateway:</span>
                <span style={{ fontWeight: '800', color: 'var(--text-main)' }}>
                  {selectedTx.methodTitle} {selectedTx.methodSubtitle ? `• ${selectedTx.methodSubtitle}` : ''}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Bank Reference / UTR:</span>
                <span style={{ fontWeight: '800', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                  {selectedTx.ref}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Blockchain Hash:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11.5px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {selectedTx.txHash.slice(0, 16)}...{selectedTx.txHash.slice(-6)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedTx.txHash, 'Blockchain Hash')}
                    style={{
                      border: 'none',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#6366F1',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    <Copy size={11} />
                    {copiedHash === selectedTx.txHash ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setSelectedTx(null)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '8px 18px', fontWeight: '700', borderRadius: '10px' }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  triggerToast(`Receipt for ${selectedTx.id} generated and downloaded!`);
                }}
                className="btn btn-primary btn-sm"
                style={{
                  padding: '8px 20px',
                  fontWeight: '800',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Download size={14} />
                Download Receipt PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
