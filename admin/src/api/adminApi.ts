import { apiRequest, setAuthToken, clearAuthToken } from './client';

export interface AdminLoginResponse {
  admin: {
    id: string;
    email: string;
    name: string;
    role: string;
    phone?: string;
    lastLogin: string;
  };
  token: string;
}

export const adminApi = {
  // Auth
  async login(email: string, password: string) {
    const res = await apiRequest<AdminLoginResponse>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.data?.token) {
      setAuthToken(res.data.token);
    }
    return res;
  },

  async getMe() {
    return apiRequest('/admin/auth/me');
  },

  async updateProfile(payload: {
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
    currentPassword?: string;
    newPassword?: string;
  }) {
    return apiRequest('/admin/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  logout() {
    clearAuthToken();
  },

  // Dashboard
  async getDashboardStats() {
    return apiRequest('/admin/dashboard/stats');
  },

  async getDashboardCharts(range: '7D' | '30D' | '90D' | '1Y' = '7D') {
    return apiRequest(`/admin/dashboard/charts?range=${range}`);
  },

  async getRecentActivities() {
    return apiRequest('/admin/dashboard/activities');
  },

  async getRecentTransactions(type: string = 'All', search: string = '') {
    const query = new URLSearchParams();
    if (type && type !== 'All') query.append('type', type);
    if (search) query.append('search', search);
    return apiRequest(`/admin/dashboard/recent-transactions?${query.toString()}`);
  },

  // Users & KYC
  async listUsers() {
    return apiRequest('/admin/users');
  },

  async listKyc() {
    return apiRequest('/admin/kyc');
  },

  async listTransactions() {
    return apiRequest('/admin/transactions');
  },

  async updateTransactionStatus(id: string, status: string, note?: string) {
    return apiRequest(`/admin/transactions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
  },


  async listOrders(type: string = 'All', status: string = 'All', search: string = '') {
    const query = new URLSearchParams();
    if (type && type !== 'All') query.append('type', type);
    if (status && status !== 'All') query.append('status', status);
    if (search) query.append('search', search);
    return apiRequest(`/admin/orders?${query.toString()}`);
  },

  async getTreasuryVaults() {
    return apiRequest('/admin/treasury/vaults');
  },

  // xCoin Market & Engine
  async getXCoinMarketData(timeframe = '24H') {
    return apiRequest(`/admin/market/xcoin?timeframe=${encodeURIComponent(timeframe)}`);
  },

  async updateXCoinSettings(payload: {
    minBuy?: number;
    maxBuy?: number;
    minSell?: number;
    maxSell?: number;
  }) {
    return apiRequest('/admin/market/xcoin', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // Team & Referrals
  async getTeamReferralsData(range = '7D') {
    return apiRequest(`/admin/team/referrals?range=${encodeURIComponent(range)}`);
  },

  async creditReferralReward(payload: { userId: string; amount?: number }) {
    return apiRequest('/admin/team/referrals/bonus', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Rewards & Engagement Hub
  async getRewardsOverview() {
    return apiRequest('/admin/rewards');
  },

  async updateStreakConfig(streakDays: any[]) {
    return apiRequest('/admin/rewards/streak', {
      method: 'PUT',
      body: JSON.stringify({ streakDays }),
    });
  },

  async addBountyTask(payload: {
    title: string;
    description?: string;
    rewardXCoin: number;
    targetCount: number;
    type: string;
  }) {
    return apiRequest('/admin/rewards/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async toggleBountyTask(id: string) {
    return apiRequest(`/admin/rewards/tasks/${id}/toggle`, {
      method: 'PATCH',
    });
  },

  async deleteBountyTask(id: string) {
    return apiRequest(`/admin/rewards/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  async airdropReward(payload: {
    userId: string;
    amountXCoin: number;
    reason?: string;
  }) {
    return apiRequest('/admin/rewards/airdrop', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Notifications
  async listNotifications(type: string = 'All') {
    const query = type && type !== 'All' ? `?type=${encodeURIComponent(type)}` : '';
    return apiRequest(`/admin/notifications${query}`);
  },

  async sendNotification(payload: {
    title: string;
    message: string;
    type: string;
    audience: string;
    channels?: string[];
  }) {
    return apiRequest('/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteNotification(id: string | number) {
    return apiRequest(`/admin/notifications/${id}`, {
      method: 'DELETE',
    });
  },

  // Quick Actions
  async quickCreateUser(payload: {
    fullName: string;
    email: string;
    phone?: string;
    role?: string;
    initialBalance?: number;
  }) {
    return apiRequest('/admin/dashboard/quick-user', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async quickApproveDeposit(payload: {
    userEmail?: string;
    amount: number;
    method?: string;
    utrNumber?: string;
    note?: string;
  }) {
    return apiRequest('/admin/dashboard/quick-deposit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async quickAuthorizeWithdrawal(payload: {
    userEmail?: string;
    amount: number;
    method?: string;
    bankOrUpi?: string;
    note?: string;
  }) {
    return apiRequest('/admin/dashboard/quick-withdrawal', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Audit Logs
  async getAuditLogs(page = 1, limit = 50) {
    return apiRequest<{ logs: any[]; total: number; page: number }>(`/admin/audit-logs?page=${page}&limit=${limit}`);
  },
};
