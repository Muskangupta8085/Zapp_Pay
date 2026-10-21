import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Colors } from '../../constants/colors';
import { adminApi } from '../../api/adminApi';
import type { AuditLogItem } from '../../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getAuditLogs(1, 50);
      if (res && res.data && Array.isArray(res.data.logs)) {
        setLogs(res.data.logs);
      } else {
        setLogs([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch audit logs:', err);
      setError(err?.message || 'Failed to fetch audit logs from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div>
      <PageHeader
        title="Audit Logs – System Activity Trail"
        subtitle="Immutable security trail of every configuration change, financial settlement, and administrative action"
        badge="Compliance Ledger"
        badgeType="indigo"
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button
          onClick={fetchLogs}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: Colors.primary,
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Refreshing...' : '↻ Refresh Trail'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #F87171', borderRadius: '8px', color: '#B91C1C', marginBottom: '16px', fontSize: '14px' }}>
          {error}
        </div>
      )}

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
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: Colors.textMuted }}>
                  Loading secure audit records...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: Colors.textMuted }}>
                  No administrative actions logged yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
