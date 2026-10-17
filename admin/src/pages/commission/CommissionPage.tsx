import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Percent, CheckCircle, XCircle, Save } from 'lucide-react';
import { Colors } from '../../constants/colors';
import type { CommissionClaim } from '../../types';

export const CommissionPage: React.FC = () => {
  const [l1Rate, setL1Rate] = useState(5.0);
  const [l2Rate, setL2Rate] = useState(2.0);
  const [minTradeThreshold, setMinTradeThreshold] = useState(1000);
  const [savedSettings, setSavedSettings] = useState(false);

  const [claims, setClaims] = useState<CommissionClaim[]>([
    {
      id: 'CLM-501',
      uid: 'UID-88214',
      userName: 'Rahul Sharma',
      amount: 428.5,
      tier: 'Level 1',
      sourceVolume: 8570,
      status: 'Pending',
      requestedAt: 'Today, 01:10 PM',
    },
    {
      id: 'CLM-498',
      uid: 'UID-76120',
      userName: 'Amit Patel',
      amount: 1250.0,
      tier: 'Level 1',
      sourceVolume: 25000,
      status: 'Approved',
      requestedAt: 'Yesterday, 05:20 PM',
    },
  ]);

  const handleApprove = (id: string) => {
    setClaims((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'Approved' } : c))
    );
  };

  const handleReject = (id: string) => {
    setClaims((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'Rejected' } : c))
    );
  };

  const handleSaveConfig = () => {
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 3000);
  };

  return (
    <div>
      <PageHeader
        title="Referral Commission – Configure & Claims"
        subtitle="Set commission percentage splits for direct and indirect uplines, review pending claim requests"
        badge="Incentive Engine"
        badgeType="emerald"
      />

      {/* Tier Configuration Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Percent size={18} color={Colors.primary} />
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: Colors.textPrimary }}>Level 1 (Direct Referral)</h3>
          </div>
          <label style={{ fontSize: '11px', color: Colors.textSecondary, fontWeight: '700', display: 'block', marginBottom: '6px' }}>
            COMMISSION RATE (%)
          </label>
          <input
            type="number"
            step="0.1"
            className="form-input"
            value={l1Rate}
            onChange={(e) => setL1Rate(parseFloat(e.target.value) || 0)}
          />
          <span style={{ fontSize: '11px', color: Colors.textMuted, marginTop: '4px', display: 'block', fontWeight: '600' }}>
            Earned by the direct inviter on every completed trade.
          </span>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Percent size={18} color={Colors.info} />
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: Colors.textPrimary }}>Level 2 (Secondary Sub-tier)</h3>
          </div>
          <label style={{ fontSize: '11px', color: Colors.textSecondary, fontWeight: '700', display: 'block', marginBottom: '6px' }}>
            COMMISSION RATE (%)
          </label>
          <input
            type="number"
            step="0.1"
            className="form-input"
            value={l2Rate}
            onChange={(e) => setL2Rate(parseFloat(e.target.value) || 0)}
          />
          <span style={{ fontSize: '11px', color: Colors.textMuted, marginTop: '4px', display: 'block', fontWeight: '600' }}>
            Earned by the second-tier sponsor.
          </span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: Colors.textPrimary, marginBottom: '8px' }}>Activation Threshold</h3>
            <label style={{ fontSize: '11px', color: Colors.textSecondary, fontWeight: '700', display: 'block', marginBottom: '6px' }}>
              MIN TRADE VOLUME REQUIRED (₹)
            </label>
            <input
              type="number"
              className="form-input"
              value={minTradeThreshold}
              onChange={(e) => setMinTradeThreshold(parseInt(e.target.value) || 0)}
            />
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleSaveConfig} style={{ marginTop: '12px' }}>
            <Save size={14} /> {savedSettings ? 'Saved!' : 'Save Tier Rates'}
          </button>
        </div>
      </div>

      {/* Claims Review Table */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', color: Colors.textPrimary, marginBottom: '4px' }}>
          Pending Commission Claims
        </h3>
        <p style={{ fontSize: '13px', color: Colors.textSecondary }}>
          Users who clicked "Claim Earnings" in their Team mobile screen
        </p>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Claim ID</th>
              <th>User</th>
              <th>Claim Amount</th>
              <th>Affiliate Tier</th>
              <th>Source Trade Volume</th>
              <th>Status</th>
              <th>Requested At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => (
              <tr key={claim.id}>
                <td style={{ fontWeight: '700', color: Colors.textSecondary }}>{claim.id}</td>
                <td>
                  <div style={{ fontWeight: '800', color: Colors.textPrimary }}>{claim.userName}</div>
                  <div style={{ fontSize: '11px', color: Colors.textMuted }}>{claim.uid}</div>
                </td>
                <td style={{ fontWeight: '900', color: Colors.primary, fontSize: '15px' }}>
                  ₹ {claim.amount.toFixed(2)}
                </td>
                <td>
                  <span className="badge badge-emerald">{claim.tier}</span>
                </td>
                <td style={{ color: Colors.textSecondary, fontWeight: '600' }}>
                  ₹ {claim.sourceVolume.toLocaleString('en-IN')}
                </td>
                <td>
                  <StatusBadge status={claim.status} />
                </td>
                <td style={{ fontSize: '12px', color: Colors.textSecondary, fontWeight: '500' }}>
                  {claim.requestedAt}
                </td>
                <td>
                  {claim.status === 'Pending' ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => handleApprove(claim.id)}>
                        <CheckCircle size={14} /> Credit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleReject(claim.id)}>
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: Colors.textMuted, fontWeight: '600' }}>Processed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
