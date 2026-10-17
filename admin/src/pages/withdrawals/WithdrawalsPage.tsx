import React, { useState, useMemo, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import {
  Search,
  Download,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  Eye,
  X,
  Building,
  Smartphone,
  Send,
  RefreshCw,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface WithdrawalItem {
  id: number;
  rawId: string;
  withdrawId: string;
  user: string;
  email: string;
  phone: string;
  amount: string;
  rawAmount: number;
  method: 'Bank' | 'UPI';
  account: string;
  ifsc?: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Rejected';
  date: string;
  txHash?: string;
}

export const WithdrawalsPage: React.FC = () => {
  useTheme();

  // State
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Processing' | 'Completed' | 'Rejected'>('All');
  const [methodFilter, setMethodFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewItem, setReviewItem] = useState<WithdrawalItem | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
    showToast(`Copied: ${text}`);
  };

  // Fetch real withdrawals from API
  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const res = await adminApi.listTransactions();
      if (res.success && Array.isArray(res.data)) {
        const wdTxs = res.data.filter((t: any) => t.type === 'withdrawal');
        const mapped: WithdrawalItem[] = wdTxs.map((t: any, idx: number) => {
          const userObj = t.senderId || t.receiverId || {};
          const statusMap: Record<string, WithdrawalItem['status']> = {
            completed: 'Completed',
            pending: 'Pending',
            processing: 'Processing',
            failed: 'Rejected',
            cancelled: 'Rejected',
          };
          const txDate = t.createdAt ? new Date(t.createdAt) : new Date();
          const isUpi = t.receiverAddress?.includes('@') || t.notes?.includes('UPI');

          return {
            id: idx + 1,
            rawId: t._id || '',
            withdrawId: t.referenceId || `WD${String(t._id || idx).slice(-5).toUpperCase()}`,
            user: userObj.fullName || userObj.email?.split('@')[0] || 'Trader',
            email: userObj.email || '',
            phone: userObj.phone || '',
            amount: `₹ ${Number(t.amount || 0).toLocaleString('en-IN')}`,
            rawAmount: Number(t.amount || 0),
            method: isUpi ? 'UPI' : 'Bank',
            account: t.receiverAddress || 'Registered Bank Account',
            ifsc: isUpi ? undefined : 'HDFC0000128',
            status: statusMap[t.status] || 'Completed',
            date: txDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' + txDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            txHash: t.txHash || (t.status === 'completed' ? `IMPS-${String(t._id || '').slice(-8)}` : undefined),
          };
        });
        setWithdrawals(mapped);
      } else {
        setWithdrawals([]);
      }
    } catch (err) {
      console.error('Failed to load withdrawals', err);
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  // Counts
  const counts = useMemo(() => {
    return {
      all: withdrawals.length,
      pending: withdrawals.filter((w) => w.status === 'Pending').length,
      processing: withdrawals.filter((w) => w.status === 'Processing').length,
      completed: withdrawals.filter((w) => w.status === 'Completed').length,
      rejected: withdrawals.filter((w) => w.status === 'Rejected').length,
      totalDisbursed: withdrawals.reduce((sum, w) => sum + (w.status === 'Completed' ? w.rawAmount : 0), 0),
    };
  }, [withdrawals]);

  // Filtered List
  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter((w) => {
      const matchTab = activeTab === 'All' ? true : w.status === activeTab;
      const matchMethod = methodFilter === 'All' ? true : w.method === methodFilter;
      const matchSearch =
        w.withdrawId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.account.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTab && matchMethod && matchSearch;
    });
  }, [withdrawals, activeTab, methodFilter, searchQuery]);

  // Action: Approve & Dispatch Payout via API
  const handleApprovePayout = async (item: WithdrawalItem) => {
    try {
      setActionLoading(true);
      if (item.rawId) {
        const res = await adminApi.updateTransactionStatus(item.rawId, 'completed', 'Payout approved and cleared via IMPS');
        if (res.success) {
          showToast(`Withdrawal #${item.withdrawId} approved and dispatched via IMPS!`);
          setReviewItem(null);
          fetchWithdrawals();
          return;
        } else {
          showToast(res.message || 'Failed to approve payout');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Error processing payout');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Mark Processing via API
  const handleMarkProcessing = async (item: WithdrawalItem) => {
    try {
      setActionLoading(true);
      if (item.rawId) {
        const res = await adminApi.updateTransactionStatus(item.rawId, 'processing', 'Moved to banking gateway queue');
        if (res.success) {
          showToast(`Withdrawal #${item.withdrawId} moved to banking gateway processing queue.`);
          setReviewItem(null);
          fetchWithdrawals();
          return;
        } else {
          showToast(res.message || 'Failed to mark processing');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating status');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Reject & Refund via API
  const handleRejectPayout = async (item: WithdrawalItem) => {
    try {
      setActionLoading(true);
      if (item.rawId) {
        const res = await adminApi.updateTransactionStatus(item.rawId, 'failed', 'Payout rejected by Admin. Balance refunded to wallet.');
        if (res.success) {
          showToast(`Withdrawal #${item.withdrawId} rejected. Funds refunded to trader's live wallet.`);
          setReviewItem(null);
          fetchWithdrawals();
          return;
        } else {
          showToast(res.message || 'Failed to reject payout');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Error rejecting payout');
    } finally {
      setActionLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredWithdrawals.length === 0) {
      alert('No withdrawal records to export');
      return;
    }

    const headers = 'ID,WithdrawID,User,Email,Phone,Amount,Method,Account,Status,Date,TxHash\n';
    const rows = filteredWithdrawals
      .map(
        (w) =>
          `"${w.id}","${w.withdrawId}","${w.user}","${w.email}","${w.phone}","${w.amount}","${w.method}","${w.account}","${w.status}","${w.date}","${w.txHash || ''}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `withdrawals_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredWithdrawals.length} withdrawal records`);
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
            Fiat INR Withdrawals
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', fontWeight: '500', margin: '4px 0 0' }}>
            Review, verify, and approve instant IMPS and UPI bank transfers to user accounts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchWithdrawals}
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
            style={{ height: '42px', padding: '0 18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '7px' }}
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── Dynamic Filter Tabs with Real Counts ── */}
      <div className="filter-tabs-bar" style={{ margin: 0 }}>
        {(['All', 'Pending', 'Processing', 'Completed', 'Rejected'] as const).map((tab) => {
          const tabCount =
            tab === 'All'
              ? counts.all
              : tab === 'Pending'
              ? counts.pending
              : tab === 'Processing'
              ? counts.processing
              : tab === 'Completed'
              ? counts.completed
              : counts.rejected;

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

      {/* ── Toolbar Card ── */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '13px' }} />
          <input
            type="text"
            placeholder="Search by Withdrawal ID, Trader Name, Phone, or Account..."
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
              <option value="Bank">Bank IMPS</option>
              <option value="UPI">UPI Transfer</option>
            </select>
            <ChevronDown size={14} color="#94A3B8" style={{ position: 'absolute', right: '12px', top: '13px', pointerEvents: 'none' }} />
          </div>

          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: '600' }}>
            Showing <strong style={{ color: 'var(--text-main)' }}>{filteredWithdrawals.length}</strong> records
          </div>
        </div>
      </div>

      {/* ── Withdrawals Table ── */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>#</th>
              <th>Withdrawal ID</th>
              <th>Trader / User</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Payout Account</th>
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
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>Loading withdrawals...</span>
                  </div>
                </td>
              </tr>
            ) : filteredWithdrawals.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  No withdrawal requests match your search criteria.
                </td>
              </tr>
            ) : (
              filteredWithdrawals.map((w) => (
                <tr key={w.rawId || w.id}>
                  <td style={{ color: 'var(--text-muted)', fontWeight: '700' }}>{w.id}</td>
                  <td>
                    <span style={{ fontWeight: '800', color: '#2563EB', fontFamily: 'var(--font-mono)' }}>
                      {w.withdrawId}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '13.5px' }}>{w.user}</span>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{w.phone || w.email}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: '900', color: 'var(--text-main)', fontSize: '14px' }}>
                      {w.amount}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: '600', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {w.method === 'UPI' ? <Smartphone size={13} color="#2563EB" /> : <Building size={13} color="#8B5CF6" />}
                      {w.method}
                    </span>
                  </td>
                  <td>
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
                      {w.account}
                    </code>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        w.status === 'Completed'
                          ? 'badge-completed'
                          : w.status === 'Processing'
                          ? 'badge-processing'
                          : w.status === 'Pending'
                          ? 'badge-pending'
                          : 'badge-failed'
                      }`}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>
                    {w.date}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => setReviewItem(w)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '5px 12px', fontSize: '12px', color: '#2563EB', fontWeight: '700' }}
                    >
                      <Eye size={12} />
                      <span>Review</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal: Review & Process Payout (Real API Connected) ── */}
      {reviewItem && (
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
              maxWidth: '540px',
              padding: '28px',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#2563EB', fontFamily: 'var(--font-mono)' }}>
                  {reviewItem.withdrawId}
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main)', margin: '2px 0 0' }}>
                  Review & Approve Payout
                </h3>
              </div>
              <button
                onClick={() => setReviewItem(null)}
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
                  Net Payout Amount
                </div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: 'var(--text-main)' }}>
                  {reviewItem.amount}
                </div>
              </div>
              <span
                className={`badge ${
                  reviewItem.status === 'Completed'
                    ? 'badge-completed'
                    : reviewItem.status === 'Processing'
                    ? 'badge-processing'
                    : reviewItem.status === 'Pending'
                    ? 'badge-pending'
                    : 'badge-failed'
                }`}
              >
                {reviewItem.status}
              </span>
            </div>

            {/* Bank Info Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Trader Identity:</span>
                <strong style={{ color: 'var(--text-main)' }}>{reviewItem.user} ({reviewItem.phone || reviewItem.email})</strong>
              </div>
              {reviewItem.email && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Email:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{reviewItem.email}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Disbursement Method:</span>
                <strong style={{ color: 'var(--text-main)' }}>{reviewItem.method} Transfer</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Account / UPI ID:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <code style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#2563EB' }}>
                    {reviewItem.account}
                  </code>
                  <button
                    onClick={() => handleCopy(reviewItem.account)}
                    title="Copy Account / UPI"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    {copiedText === reviewItem.account ? (
                      <Check size={13} color="#22C55E" />
                    ) : (
                      <Copy size={13} color="#94A3B8" />
                    )}
                  </button>
                </div>
              </div>
              {reviewItem.ifsc && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>IFSC Code:</span>
                  <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{reviewItem.ifsc}</strong>
                </div>
              )}
              {reviewItem.txHash && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Bank Transfer Ref:</span>
                  <code style={{ color: '#22C55E', fontWeight: '700' }}>{reviewItem.txHash}</code>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Request Submitted:</span>
                <span style={{ color: 'var(--text-main)' }}>{reviewItem.date}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {reviewItem.status !== 'Completed' && (
                <button
                  onClick={() => handleApprovePayout(reviewItem)}
                  disabled={actionLoading}
                  className="btn btn-primary"
                  style={{ backgroundColor: '#22C55E', borderColor: '#22C55E', fontWeight: '800' }}
                >
                  <Send size={15} />
                  <span>{actionLoading ? 'Dispatching...' : 'Approve & Dispatch IMPS'}</span>
                </button>
              )}

              {reviewItem.status === 'Pending' && (
                <button
                  onClick={() => handleMarkProcessing(reviewItem)}
                  disabled={actionLoading}
                  className="btn btn-secondary"
                  style={{ color: '#F59E0B', borderColor: 'rgba(245, 158, 11, 0.3)', fontWeight: '700' }}
                >
                  <Clock size={15} />
                  <span>{actionLoading ? 'Updating...' : 'Mark Processing'}</span>
                </button>
              )}

              {reviewItem.status !== 'Rejected' && reviewItem.status !== 'Completed' && (
                <button
                  onClick={() => handleRejectPayout(reviewItem)}
                  disabled={actionLoading}
                  className="btn btn-secondary"
                  style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)', fontWeight: '700' }}
                >
                  <XCircle size={15} />
                  <span>{actionLoading ? 'Refunding...' : 'Reject & Refund'}</span>
                </button>
              )}

              <button
                onClick={() => setReviewItem(null)}
                className="btn btn-secondary"
                style={{ fontWeight: '700' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalsPage;
