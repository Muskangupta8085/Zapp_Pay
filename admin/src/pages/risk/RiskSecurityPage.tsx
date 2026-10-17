import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Lock, UserX } from 'lucide-react';
import { Colors } from '../../constants/colors';
import type { RiskAlert } from '../../types';

export const RiskSecurityPage: React.FC = () => {
  const [alerts, setAlerts] = useState<RiskAlert[]>([
    {
      id: 'RISK-401',
      userUid: 'UID-76120',
      userName: 'Amit Patel',
      severity: 'Critical',
      reason: 'Rapid high-value withdrawal attempts within 5 minutes of deposit',
      flaggedDate: 'Today, 11:42 AM',
      ipAddress: '103.21.244.12',
      actionTaken: 'Frozen',
    },
    {
      id: 'RISK-398',
      userUid: 'UID-54210',
      userName: 'Sameer Khan',
      severity: 'High',
      reason: 'Duplicate UTR submission detected (UTR already claimed by another user)',
      flaggedDate: 'Today, 09:15 AM',
      ipAddress: '49.36.120.88',
      actionTaken: 'Monitored',
    },
    {
      id: 'RISK-350',
      userUid: 'UID-22109',
      userName: 'Anonymous Trader',
      severity: 'Critical',
      reason: 'Multiple failed PIN / OTP brute force attempts',
      flaggedDate: 'Yesterday, 10:05 PM',
      ipAddress: '185.220.101.5',
      actionTaken: 'Blocked',
    },
  ]);

  const handleAction = (id: string, action: 'Monitored' | 'Frozen' | 'Blocked') => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, actionTaken: action } : a))
    );
  };

  return (
    <div>
      <PageHeader
        title="Risk & Security – Suspicious Users"
        subtitle="Identify fraudulent UTR submissions, wash trading, bot velocity, and enforce instant account freezes"
        badge="Security Threat Radar"
        badgeType="rose"
      />

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Alert ID</th>
              <th>Suspect User</th>
              <th>Threat Level</th>
              <th>Detected Risk Reason</th>
              <th>IP Address</th>
              <th>Flagged At</th>
              <th>Current Status</th>
              <th>Enforce Action</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.id}>
                <td style={{ fontWeight: '700', color: Colors.textSecondary }}>{alert.id}</td>
                <td>
                  <div style={{ fontWeight: '800', color: Colors.textPrimary }}>{alert.userName}</div>
                  <div style={{ fontSize: '11px', color: Colors.textMuted }}>{alert.userUid}</div>
                </td>
                <td>
                  <span className={`badge ${alert.severity === 'Critical' ? 'badge-rose' : 'badge-amber'}`}>
                    {alert.severity}
                  </span>
                </td>
                <td style={{ fontSize: '13px', color: Colors.textPrimary, maxWidth: '300px', fontWeight: '600' }}>
                  {alert.reason}
                </td>
                <td>
                  <code style={{ fontSize: '12px', color: Colors.textSecondary, backgroundColor: '#F4F7FE', padding: '3px 6px', borderRadius: '4px' }}>
                    {alert.ipAddress}
                  </code>
                </td>
                <td style={{ fontSize: '12px', color: Colors.textMuted, fontWeight: '500' }}>{alert.flaggedDate}</td>
                <td>
                  <StatusBadge status={alert.actionTaken} />
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      onClick={() => handleAction(alert.id, 'Frozen')}
                      title="Freeze Wallet Balance"
                    >
                      <Lock size={12} color={Colors.warning} /> Freeze
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      onClick={() => handleAction(alert.id, 'Blocked')}
                      title="Permanently Block"
                    >
                      <UserX size={12} /> Block
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
