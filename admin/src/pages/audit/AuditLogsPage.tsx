import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Colors } from '../../constants/colors';
import type { AuditLogItem } from '../../types';

export const AuditLogsPage: React.FC = () => {
  const logs: AuditLogItem[] = [
    {
      id: 'LOG-8812',
      adminName: 'Super Admin',
      adminRole: 'Super Admin',
      action: 'Updated xCoin Base Price: ₹106.50 -> ₹108.37',
      targetResource: 'Token Pricing Engine',
      ipAddress: '192.168.1.14',
      timestamp: 'Today, 11:35 AM',
      status: 'Success',
    },
    {
      id: 'LOG-8811',
      adminName: 'Super Admin',
      adminRole: 'Super Admin',
      action: 'Approved UPI Deposit DEP-100 (₹10,000)',
      targetResource: 'UID-76120 (Amit Patel)',
      ipAddress: '192.168.1.14',
      timestamp: 'Today, 11:15 AM',
      status: 'Success',
    },
    {
      id: 'LOG-8810',
      adminName: 'Super Admin',
      adminRole: 'Super Admin',
      action: 'System Security Check & Audit Ledger Sync',
      targetResource: 'UID-76120',
      ipAddress: '192.168.1.14',
      timestamp: 'Today, 10:48 AM',
      status: 'Success',
    },
    {
      id: 'LOG-8809',
      adminName: 'Super Admin',
      adminRole: 'Super Admin',
      action: 'Verified KYC Aadhaar/PAN Identity Documents',
      targetResource: 'UID-88214 (Rahul Sharma)',
      ipAddress: '192.168.1.14',
      timestamp: 'Yesterday, 04:12 PM',
      status: 'Success',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Audit Logs – System Activity Trail"
        subtitle="Immutable security trail of every configuration change, financial settlement, and administrative action"
        badge="Compliance Ledger"
        badgeType="indigo"
      />

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Admin Operator</th>
              <th>Action Executed</th>
              <th>Target Resource</th>
              <th>IP Address</th>
              <th>Status</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td style={{ fontWeight: '700', color: Colors.textSecondary }}>{log.id}</td>
                <td>
                  <div style={{ fontWeight: '800', color: Colors.textPrimary }}>{log.adminName}</div>
                  <div style={{ fontSize: '11px', color: Colors.primary, fontWeight: '700' }}>{log.adminRole}</div>
                </td>
                <td style={{ fontWeight: '700', color: Colors.textPrimary }}>
                  {log.action}
                </td>
                <td style={{ color: Colors.textSecondary, fontSize: '13px', fontWeight: '500' }}>
                  {log.targetResource}
                </td>
                <td>
                  <code style={{ fontSize: '12px', color: Colors.textMuted }}>{log.ipAddress}</code>
                </td>
                <td>
                  <StatusBadge status={log.status} />
                </td>
                <td style={{ fontSize: '12px', color: Colors.textSecondary, fontWeight: '500' }}>
                  {log.timestamp}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
