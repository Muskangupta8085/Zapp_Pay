import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Shield, Plus } from 'lucide-react';
import { Colors } from '../../constants/colors';
import type { AdminRoleItem } from '../../types';

export const RolesPermissionsPage: React.FC = () => {
  const roles: AdminRoleItem[] = [
    {
      id: '1',
      name: 'Super Admin',
      usersAssigned: 2,
      permissions: ['All Permissions', 'System Config', 'Rate Changes', 'Wallet Sweep', 'User Delete'],
      description: 'Unrestricted full access to all Zapp Pay modules, financials, and configurations',
    },
    {
      id: '2',
      name: 'Finance Admin',
      usersAssigned: 3,
      permissions: ['Deposits (UTR) Approve/Reject', 'Withdrawals Release', 'Bank Account Verify', 'Reports Export'],
      description: 'Handles fiat payment operations, deposits verification, and bank IMPS settlements',
    },
    {
      id: '3',
      name: 'Compliance Officer',
      usersAssigned: 4,
      permissions: ['KYC Review', 'User Freeze/Unfreeze', 'Risk Alerts Monitor', 'Audit Logs Read'],
      description: 'Customer identification, document verification, and fraud/risk inspection',
    },
    {
      id: '4',
      name: 'Support Agent',
      usersAssigned: 6,
      permissions: ['User Lookup', 'Order Status View', 'Push Notifications Send', 'Ticket Resolve'],
      description: 'Read-only customer service desk for resolving trader questions and transaction statuses',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Admin Roles & Permissions"
        subtitle="Manage administrative staff accounts, assign granular module permissions, and enforce two-factor security"
        badge="Staff RBAC Desk"
        badgeType="indigo"
        actionButton={
          <button className="btn btn-primary btn-sm">
            <Plus size={14} /> Add Staff Account
          </button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {roles.map((role) => (
          <div key={role.id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} color={Colors.primary} />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: Colors.textPrimary }}>{role.name}</h3>
              </div>
              <span className="badge badge-emerald">{role.usersAssigned} Staff Assigned</span>
            </div>

            <p style={{ fontSize: '13px', color: Colors.textSecondary, marginBottom: '16px', minHeight: '38px', fontWeight: '500' }}>
              {role.description}
            </p>

            <div>
              <span style={{ fontSize: '11px', fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Assigned Permissions
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {role.permissions.map((perm) => (
                  <span
                    key={perm}
                    style={{
                      fontSize: '11.5px',
                      padding: '4px 9px',
                      borderRadius: '8px',
                      backgroundColor: '#F4F7FE',
                      border: '1px solid var(--border-color)',
                      color: Colors.textPrimary,
                      fontWeight: '600'
                    }}
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Edit Permissions</button>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>Manage Staff</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
