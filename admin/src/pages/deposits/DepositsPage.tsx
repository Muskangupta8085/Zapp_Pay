import React, { useState, useMemo, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import {
  Search,
  Download,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Eye,
  Plus,
  X,
  Building,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface DepositItem {
  id: number;
  rawId: string;
  depositId: string;
  user: string;
  email: string;
  phone: string;
  amount: string;
  rawAmount: number;
  method: 'UPI' | 'Bank' | 'IMPS' | 'Other';
  reference: string;
  status: 'Completed' | 'Pending' | 'Processing' | 'Failed';
  date: string;
  kycTier: string;
}

export const DepositsPage: React.FC = () => {
  useTheme();

  // State
  const [deposits, setDeposits] = useState<DepositItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Processing' | 'Completed' | 'Failed'>('All');
  const [methodFilter, setMethodFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Inspection
  const [inspectItem, setInspectItem] = useState<DepositItem | null>(null);
  const [isNewDepositModalOpen, setIsNewDepositModalOpen] = useState(false);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // New Deposit Form
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newMethod, setNewMethod] = useState<'UPI' | 'Bank' | 'IMPS' | 'Other'>('UPI');
  const [newUtrNumber, setNewUtrNumber] = useState('');
  const [newNote, setNewNote] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (refText: string) => {
    navigator.clipboard?.writeText(refText);
    setCopiedRef(refText);
    setTimeout(() => setCopiedRef(null), 2000);
    showToast(`Copied reference: ${refText}`);
  };

  // Fetch real deposits on mount
  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const res = await adminApi.listTransactions();
      if (res.success && Array.isArray(res.data)) {
        const depositTxs = res.data.filter((t: any) => t.type === 'deposit');
        const mapped: DepositItem[] = depositTxs.map((t: any, idx: number) => {
          const userObj = t.senderId || t.receiverId || {};
          const statusMap: Record<string, DepositItem['status']> = {
            completed: 'Completed',
            pending: 'Pending',
            processing: 'Processing',
            failed: 'Failed',
            cancelled: 'Failed',
          };
          const txDate = t.createdAt ? new Date(t.createdAt) : new Date();

          let methodFormatted: DepositItem['method'] = 'UPI';
          const notesStr = String(t.notes || t.senderAddress || '');
          if (notesStr.includes('IMPS')) methodFormatted = 'IMPS';
          else if (notesStr.includes('Bank') || notesStr.includes('NEFT') || notesStr.includes('RTGS')) methodFormatted = 'Bank';
          else if (notesStr.includes('Other')) methodFormatted = 'Other';

          return {
            id: idx + 1,
            rawId: t._id || '',
            depositId: t.referenceId || `DP${String(t._id || idx).slice(-5).toUpperCase()}`,
            user: userObj.fullName || userObj.email?.split('@')[0] || 'Trader',
            email: userObj.email || '',
            phone: userObj.phone || '',
            amount: `₹ ${Number(t.amount || 0).toLocaleString('en-IN')}`,
            rawAmount: Number(t.amount || 0),
            method: methodFormatted,
            reference: t.referenceId || `REF${String(t._id || '').slice(-8)}`,
            status: statusMap[t.status] || 'Completed',
            date: txDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' + txDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            kycTier: userObj.kycStatus === 'verified' ? 'Tier 3 (Verified)' : (userObj.kycStatus === 'pending' ? 'Tier 2 (Under Review)' : 'Tier 1 (Basic)'),
          };
        });
        setDeposits(mapped);
      } else {
        setDeposits([]);
      }
    } catch (err) {
      console.error('Failed to load deposits', err);
      setDeposits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  // Dynamic Counts
  const counts = useMemo(() => {
    return {
      all: deposits.length,
      pending: deposits.filter((d) => d.status === 'Pending').length,
      processing: deposits.filter((d) => d.status === 'Processing').length,
      completed: deposits.filter((d) => d.status === 'Completed').length,
      failed: deposits.filter((d) => d.status === 'Failed').length,
      totalVolume: deposits.reduce((sum, d) => sum + (d.status === 'Completed' ? d.rawAmount : 0), 0),
    };
  }, [deposits]);

  // Filtered List
  const filteredDeposits = useMemo(() => {
    return deposits.filter((d) => {
      const matchTab = activeTab === 'All' ? true : d.status === activeTab;
      const matchMethod = methodFilter === 'All' ? true : d.method === methodFilter;
      const matchSearch =
        d.depositId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.reference.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTab && matchMethod && matchSearch;
    });
  }, [deposits, activeTab, methodFilter, searchQuery]);

  // Action: Approve & Credit Real Deposit via API
  const handleApproveDeposit = async (item: DepositItem) => {
    try {
      setActionLoading(true);
      if (item.rawId) {
        const res = await adminApi.updateTransactionStatus(item.rawId, 'completed', 'Approved & verified by Admin');
        if (res.success) {
          showToast(`Deposit #${item.depositId} verified! Funds credited to trader's live wallet.`);
          setInspectItem(null);
          fetchDeposits();
          return;
        } else {
          showToast(res.message || 'Failed to approve deposit');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Error verifying deposit');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Reject Real Deposit via API
  const handleRejectDeposit = async (item: DepositItem) => {
    try {
      setActionLoading(true);
      if (item.rawId) {
        const res = await adminApi.updateTransactionStatus(item.rawId, 'failed', 'Deposit rejected by Admin');
        if (res.success) {
          showToast(`Deposit #${item.depositId} marked as failed.`);
          setInspectItem(null);
          fetchDeposits();
          return;
        } else {
          showToast(res.message || 'Failed to reject deposit');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Error rejecting deposit');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Add Manual Deposit via API
  const handleAddManualDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim() || !newAmount) {
      alert('Please enter user email or mobile and amount');
      return;
    }

    const raw = parseFloat(newAmount) || 0;
    if (raw <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setActionLoading(true);
      const res = await adminApi.quickApproveDeposit({
        userEmail: newUserEmail.trim(),
        amount: raw,
        method: newMethod,
        utrNumber: newUtrNumber.trim() || undefined,
        note: newNote.trim() || undefined,
      });

      if (res.success) {
        showToast(`Deposit of ₹${raw.toLocaleString()} credited successfully to ${newUserEmail}!`);
        setIsNewDepositModalOpen(false);
        setNewUserEmail('');
        setNewAmount('');
        setNewUtrNumber('');
        setNewNote('');
        fetchDeposits();
      } else {
        alert(res.message || 'Failed to credit manual deposit');
      }
    } catch (err: any) {
      alert(err.message || 'Error processing manual deposit');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Export CSV
  const handleExportCSV = () => {
    if (filteredDeposits.length === 0) {
      alert('No deposit records to export');
      return;
    }

    const headers = 'ID,DepositID,User,Email,Phone,Amount,Method,Reference,Status,Date,KYCTier\n';
    const rows = filteredDeposits
      .map(
        (d) =>
          `"${d.id}","${d.depositId}","${d.user}","${d.email}","${d.phone}","${d.amount}","${d.method}","${d.reference}","${d.status}","${d.date}","${d.kycTier}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `deposits_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredDeposits.length} deposit records`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* ── Toast ── */}
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

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-0.4px', margin: 0 }}>
            Fiat INR Deposits
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', fontWeight: '500', margin: '4px 0 0' }}>
            Verify incoming bank transfers, match UTR numbers, and credit user wallet balances.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchDeposits}
            disabled={loading}
            className="btn btn-secondary"
            style={{ height: '42px', padding: '0 16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '7px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Syncing...' : 'Sync Live'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{ height: '42px', padding: '0 16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '7px' }}
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsNewDepositModalOpen(true)}
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
            <span>Credit Manual Deposit</span>
          </button>
        </div>
      </div>

      {/* ── Filter Pills Bar with Real Live Counts ── */}
      <div className="filter-tabs-bar" style={{ margin: 0 }}>
        {(['All', 'Pending', 'Processing', 'Completed', 'Failed'] as const).map((tab) => {
          const tabCount =
            tab === 'All'
              ? counts.all
              : tab === 'Pending'
              ? counts.pending
              : tab === 'Processing'
              ? counts.processing
              : tab === 'Completed'
              ? counts.completed
              : counts.failed;

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

      {/* ── Filter Toolbar Card ── */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '13px' }} />
          <input
            type="text"
            placeholder="Search by Deposit ID, User Name, Phone, or UTR..."
            className="form-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '38px', height: '40px', fontSize: '13.5px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '160px' }}>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="form-input"
              style={{ height: '40px', appearance: 'none', paddingRight: '30px', cursor: 'pointer' }}
            >
              <option value="All">All Methods</option>
              <option value="UPI">UPI</option>
              <option value="Bank">Bank Transfer</option>
              <option value="IMPS">IMPS</option>
              <option value="Other">Other</option>
            </select>
            <ChevronDown size={14} color="#94A3B8" style={{ position: 'absolute', right: '12px', top: '13px', pointerEvents: 'none' }} />
          </div>

          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: '600' }}>
            Showing <strong style={{ color: 'var(--text-main)' }}>{filteredDeposits.length}</strong> records
          </div>
        </div>
      </div>

      {/* ── Deposits Table ── */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>#</th>
              <th>Deposit ID</th>
              <th>Trader / User</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Bank UTR / Reference</th>
              <th>Status</th>
              <th>Timestamp</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '48px 20px', color: '#94A3B8' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={24} className="animate-spin" color="#2563EB" />
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>Loading deposits...</span>
                  </div>
                </td>
              </tr>
            ) : filteredDeposits.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  No deposits match your search filter.
                </td>
              </tr>
            ) : (
              filteredDeposits.map((d) => (
                <tr key={d.rawId || d.id}>
                  <td style={{ color: 'var(--text-muted)', fontWeight: '700' }}>{d.id}</td>
                  <td>
                    <span style={{ fontWeight: '800', color: '#2563EB', fontFamily: 'var(--font-mono)' }}>
                      {d.depositId}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '13.5px' }}>{d.user}</span>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{d.phone || d.email}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: '900', color: 'var(--text-main)', fontSize: '14px' }}>
                      {d.amount}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: '600', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {d.method === 'UPI' ? <Smartphone size={13} color="#2563EB" /> : <Building size={13} color="#8B5CF6" />}
                      {d.method}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <code
                        style={{
                          fontSize: '11.5px',
                          color: 'var(--text-secondary)',
                          backgroundColor: 'var(--bg-input)',
                          border: '1px solid var(--border-color)',
                          padding: '3px 7px',
                          borderRadius: '6px',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {d.reference}
                      </code>
                      <button
                        onClick={() => handleCopy(d.reference)}
                        title="Copy UTR"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-muted)' }}
                      >
                        {copiedRef === d.reference ? <Check size={12} color="#22C55E" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        d.status === 'Completed'
                          ? 'badge-completed'
                          : d.status === 'Processing'
                          ? 'badge-processing'
                          : d.status === 'Pending'
                          ? 'badge-pending'
                          : 'badge-failed'
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>
                    {d.date}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => setInspectItem(d)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '5px 12px', fontSize: '12px', color: '#2563EB', fontWeight: '700' }}
                    >
                      <Eye size={12} />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal: Inspect & Verify Deposit ── */}
      {inspectItem && (
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
              maxWidth: '520px',
              padding: '28px',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#2563EB', fontFamily: 'var(--font-mono)' }}>
                  {inspectItem.depositId}
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main)', margin: '2px 0 0' }}>
                  Verify Deposit Transaction
                </h3>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Amount Banner */}
            <div
              style={{
                padding: '16px',
                borderRadius: '14px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                  Gross Deposit Amount
                </div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-main)' }}>
                  {inspectItem.amount}
                </div>
              </div>
              <span
                className={`badge ${
                  inspectItem.status === 'Completed'
                    ? 'badge-completed'
                    : inspectItem.status === 'Processing'
                    ? 'badge-processing'
                    : inspectItem.status === 'Pending'
                    ? 'badge-pending'
                    : 'badge-failed'
                }`}
              >
                {inspectItem.status}
              </span>
            </div>

            {/* Details Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Trader Identity:</span>
                <strong style={{ color: 'var(--text-main)' }}>{inspectItem.user} ({inspectItem.phone || inspectItem.email})</strong>
              </div>
              {inspectItem.email && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Email:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{inspectItem.email}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Payment Method:</span>
                <strong style={{ color: 'var(--text-main)' }}>{inspectItem.method}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Bank Reference / UTR:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <code style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#2563EB' }}>
                    {inspectItem.reference}
                  </code>
                  <button
                    onClick={() => handleCopy(inspectItem.reference)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <Copy size={13} color="#94A3B8" />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>KYC Verification:</span>
                <strong style={{ color: '#22C55E' }}>{inspectItem.kycTier}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Submitted At:</span>
                <span style={{ color: 'var(--text-main)' }}>{inspectItem.date}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              {inspectItem.status !== 'Completed' && (
                <button
                  onClick={() => handleApproveDeposit(inspectItem)}
                  disabled={actionLoading}
                  className="btn btn-primary"
                  style={{ backgroundColor: '#22C55E', borderColor: '#22C55E', fontWeight: '800' }}
                >
                  <CheckCircle2 size={16} />
                  <span>{actionLoading ? 'Verifying...' : 'Verify & Credit ₹'}</span>
                </button>
              )}

              {inspectItem.status !== 'Failed' && (
                <button
                  onClick={() => handleRejectDeposit(inspectItem)}
                  disabled={actionLoading}
                  className="btn btn-secondary"
                  style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)', fontWeight: '700' }}
                >
                  <XCircle size={16} />
                  <span>{actionLoading ? 'Rejecting...' : 'Reject'}</span>
                </button>
              )}

              <button
                onClick={() => setInspectItem(null)}
                className="btn btn-secondary"
                style={{ fontWeight: '700' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Credit Manual Deposit (Real API Connected) ── */}
      {isNewDepositModalOpen && (
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
              maxWidth: '500px',
              padding: '28px',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>
                Credit Manual INR Deposit
              </h3>
              <button
                onClick={() => setIsNewDepositModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddManualDeposit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '5px' }}>
                  User Email or Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. user@zappay.com or 9876543210"
                  className="form-input"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  style={{ height: '40px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '5px' }}>
                    Amount (₹ INR) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 25000"
                    className="form-input"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    style={{ height: '40px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '5px' }}>
                    Payment Method
                  </label>
                  <select
                    value={newMethod}
                    onChange={(e) => setNewMethod(e.target.value as any)}
                    className="form-input"
                    style={{ height: '40px', cursor: 'pointer' }}
                  >
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="Bank">Bank Transfer (NEFT / RTGS)</option>
                    <option value="IMPS">Instant IMPS</option>
                    <option value="Other">Cash / Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '5px' }}>
                  Bank UTR / Transaction Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-9982310248"
                  className="form-input"
                  value={newUtrNumber}
                  onChange={(e) => setNewUtrNumber(e.target.value)}
                  style={{ height: '40px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '5px' }}>
                  Admin Operational Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Manual bank verification verified by Admin"
                  className="form-input"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  style={{ height: '40px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsNewDepositModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ fontWeight: '700' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                  style={{ fontWeight: '800' }}
                >
                  {actionLoading ? 'Processing...' : 'Approve & Credit Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
