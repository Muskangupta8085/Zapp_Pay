import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '../components/layout/AdminLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Auth Page
import { AdminLoginPage } from '../pages/auth/AdminLoginPage';

// Module Pages
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { UsersPage } from '../pages/users/UsersPage';
import { DepositsPage } from '../pages/deposits/DepositsPage';
import { WithdrawalsPage } from '../pages/withdrawals/WithdrawalsPage';
import { OrdersPage } from '../pages/orders/OrdersPage';
import { WalletPage } from '../pages/wallet/WalletPage';
import { PaymentVerifyPage } from '../pages/payments/PaymentVerifyPage';
import { XCoinPage } from '../pages/xcoin/XCoinPage';
import { TeamReferralsPage } from '../pages/team/TeamReferralsPage';
import { CommissionPage } from '../pages/commission/CommissionPage';
import { RewardsPage } from '../pages/rewards/RewardsPage';
import { NotificationsPage } from '../pages/notifications/NotificationsPage';
import { RiskSecurityPage } from '../pages/risk/RiskSecurityPage';
import { AnalyticsPage } from '../pages/analytics/AnalyticsPage';
import { AuditLogsPage } from '../pages/audit/AuditLogsPage';
import { RolesPermissionsPage } from '../pages/roles/RolesPermissionsPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { TransactionsPage } from '../pages/transactions/TransactionsPage';
import { AnnouncementsPage } from '../pages/announcements/AnnouncementsPage';
import { LearningPage } from '../pages/learning/LearningPage';
import { PoliciesPage } from '../pages/policies/PoliciesPage';
import { AdminProfilePage } from '../pages/profile/AdminProfilePage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Route */}
      <Route path="/login" element={<AdminLoginPage />} />

      {/* Protected Admin Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          {/* Core Operations */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/profile" element={<AdminProfilePage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/deposits" element={<DepositsPage />} />
          <Route path="/withdrawals" element={<WithdrawalsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/payments" element={<PaymentVerifyPage />} />
          <Route path="/xcoin" element={<XCoinPage />} />
          <Route path="/team" element={<TeamReferralsPage />} />
          <Route path="/commission" element={<CommissionPage />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/learning" element={<LearningPage />} />
          <Route path="/policies" element={<PoliciesPage />} />
          <Route path="/risk-security" element={<RiskSecurityPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/roles" element={<RolesPermissionsPage />} />

          {/* Settings Module */}
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/:section" element={<SettingsPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
};
