import React, { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CheckCircle, XCircle } from 'lucide-react';
import { Colors } from '../../constants/colors';
import type { PaymentVerificationItem } from '../../types';

export const PaymentVerifyPage: React.FC = () => {
  const [items, setItems] = useState<PaymentVerificationItem[]>([
    {
      id: 'PAY-881',
      userUid: 'UID-88214',
      userName: 'Rahul Sharma',
      type: 'Bank Account',
      details: 'HDFC Bank - 50100294819201 (IFSC: HDFC0000128)',
      holderName: 'Rahul Sharma',
      status: 'Pending',
      submittedAt: 'Today, 11:20 AM',
    },
    {
      id: 'PAY-882',
      userUid: 'UID-91042',
      userName: 'Pooja Verma',
      type: 'UPI VPA',
      details: 'pooja.verma@oksbi',
      holderName: 'Pooja Verma',
      status: 'Pending',
      submittedAt: 'Today, 10:05 AM',
    },
    {
      id: 'PAY-870',
      userUid: 'UID-76120',
      userName: 'Amit Patel',
      type: 'Bank Account',
      details: 'ICICI Bank - 001201948192 (IFSC: ICIC0000012)',
      holderName: 'Amit S Patel',
      status: 'Verified',
      submittedAt: 'Yesterday, 03:40 PM',
    },
  ]);

  const handleVerify = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'Verified' } : i))
    );
  };

  const handleReject = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'Rejected' } : i))
    );
  };

  return (
    <div>
      <PageHeader
        title="UPI & Bank Account Verification"
        subtitle="Validate user payout credentials, match bank beneficiary names against KYC Aadhaar/PAN"
        badge="Compliance Gateway"
        badgeType="indigo"
      />

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>User</th>
              <th>Account Type</th>
              <th>Account Details</th>
              <th>Beneficiary Name</th>
              <th>Status</th>
              <th>Submitted At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td style={{ fontWeight: '700', color: Colors.textSecondary }}>{item.id}</td>
                <td>
                  <div style={{ fontWeight: '800', color: Colors.textPrimary }}>{item.userName}</div>
                  <div style={{ fontSize: '11px', color: Colors.textMuted }}>{item.userUid}</div>
                </td>
                <td>
                  <span className="badge badge-indigo">{item.type}</span>
                </td>
                <td style={{ fontWeight: '700', color: Colors.textPrimary, fontSize: '13px' }}>
                  {item.details}
                </td>
                <td style={{ color: Colors.primary, fontWeight: '700' }}>
                  {item.holderName}
                </td>
                <td>
                  <StatusBadge status={item.status} />
                </td>
                <td style={{ fontSize: '12px', color: Colors.textSecondary, fontWeight: '500' }}>
                  {item.submittedAt}
                </td>
                <td>
                  {item.status === 'Pending' ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => handleVerify(item.id)}>
                        <CheckCircle size={14} /> Verify
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleReject(item.id)}>
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: Colors.textMuted, fontWeight: '600' }}>Verified</span>
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
