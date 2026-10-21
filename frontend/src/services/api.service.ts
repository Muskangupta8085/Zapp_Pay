import { apiClient } from '../api/client';

export const HomeService = {
  async getDashboard() {
    const res = await apiClient.get('/home/dashboard');
    return res.data?.data;
  },

  async getTickers() {
    const res = await apiClient.get('/home/tickers');
    return res.data?.data;
  },

  async getNetworkStatus() {
    const res = await apiClient.get('/home/network');
    return res.data?.data;
  },

  async getNotifications(unreadOnly = false) {
    const res = await apiClient.get(`/notifications${unreadOnly ? '?unread=true' : ''}`);
    return res.data?.data;
  },

  async markNotificationRead(id: string) {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res.data?.data;
  },

  async markAllNotificationsRead() {
    const res = await apiClient.post('/notifications/read-all');
    return res.data;
  },
};

export const OrdersService = {
  async getOrders(params: {
    status?: string;
    type?: string;
    asset?: string;
    search?: string;
    limit?: number;
    page?: number;
  } = {}) {
    const res = await apiClient.get('/orders', { params });
    return res.data;
  },

  async getOrderDetails(id: string) {
    const res = await apiClient.get(`/orders/${id}`);
    return res.data?.data;
  },

  async cancelOrder(id: string) {
    const res = await apiClient.post(`/orders/${id}/cancel`);
    return res.data;
  },

  async exportOrders(format: 'PDF' | 'CSV', range: string) {
    const res = await apiClient.post('/orders/export', { format, range });
    return res.data;
  },
};

export const RewardsService = {
  async getOverview() {
    const res = await apiClient.get('/rewards/overview');
    return res.data?.data;
  },

  async checkIn() {
    const res = await apiClient.post('/rewards/checkin');
    return res.data;
  },

  async claimMission(missionKey: string) {
    const res = await apiClient.post(`/rewards/claim/${missionKey}`);
    return res.data;
  },

  async openMysteryBox() {
    const res = await apiClient.post('/rewards/mystery-box/open');
    return res.data;
  },

  async claimAll() {
    const res = await apiClient.post('/rewards/claim-all');
    return res.data;
  },
};

export const TeamService = {
  async getOverview() {
    const res = await apiClient.get('/team/overview');
    return res.data?.data;
  },

  async claimCommission() {
    const res = await apiClient.post('/team/claim-commission');
    return res.data;
  },

  async boostMember(memberId: string) {
    const res = await apiClient.post(`/team/boost/${memberId}`);
    return res.data;
  },
};

export const ProfileService = {
  async getBankAccounts() {
    const res = await apiClient.get('/user/bank-accounts');
    return res.data?.data;
  },

  async addBankAccount(data: {
    type: 'BANK' | 'UPI';
    accountHolderName?: string;
    accountNumber?: string;
    ifsc?: string;
    bankName?: string;
    upiId?: string;
    isDefault?: boolean;
  }) {
    const res = await apiClient.post('/user/bank-accounts', data);
    return res.data;
  },

  async setDefaultAccount(id: string) {
    const res = await apiClient.patch(`/user/bank-accounts/${id}/default`);
    return res.data;
  },

  async deleteAccount(id: string) {
    const res = await apiClient.delete(`/user/bank-accounts/${id}`);
    return res.data;
  },

  async requestPinOtp() {
    const res = await apiClient.post('/user/pin/request-otp');
    return res.data;
  },

  async setPin(pin: string, otpCode?: string, currentPin?: string) {
    const res = await apiClient.post('/user/pin/set', { pin, otpCode, currentPin });
    return res.data;
  },

  async verifyPin(pin: string) {
    const res = await apiClient.post('/user/pin/verify', { pin });
    return res.data;
  },

  async updateSecurityPreferences(data: { biometricEnabled?: boolean; notificationPreferences?: any }) {
    const res = await apiClient.patch('/user/security-preferences', data);
    return res.data;
  },

  async submitSupportTicket(data: { subject: string; category?: string; message: string; priority?: string }) {
    const res = await apiClient.post('/user/support/tickets', data);
    return res.data;
  },

  async getSupportTickets() {
    const res = await apiClient.get('/user/support/tickets');
    return res.data?.data;
  },
};

export const AppService = {
  async getConfig(version?: string) {
    const res = await apiClient.get('/app/config', { params: { version } });
    return res.data?.data;
  },

  async getPolicies() {
    const res = await apiClient.get('/app/policies');
    return res.data?.data;
  },
};

export const WalletService = {
  async getOverview() {
    const res = await apiClient.get('/wallet/overview');
    return res.data?.data;
  },

  async getReceiveAddress() {
    const res = await apiClient.get('/wallet/receive-address');
    return res.data?.data;
  },

  async send(data: { receiverAddress: string; symbol: string; amount: number; notes?: string; pin?: string }) {
    const res = await apiClient.post('/wallet/send', data);
    return res.data;
  },

  async withdraw(data: {
    symbol?: string;
    amount: number;
    destinationType?: 'BANK' | 'UPI' | 'CRYPTO';
    bankAccountId?: string;
    upiId?: string;
    cryptoAddress?: string;
    pin: string;
  }) {
    const res = await apiClient.post('/wallet/withdraw', data);
    return res.data;
  },

  async createRequest(data: {
    payerContact?: string;
    amount: number;
    currency?: string;
    note?: string;
    requestType?: 'coin_request' | 'seller_request' | 'upi_request';
    payoutDetails?: any;
  }) {
    const res = await apiClient.post('/wallet/request', data);
    return res.data;
  },

  async getRequests(type?: string) {
    const res = await apiClient.get('/wallet/requests', { params: { type } });
    return res.data?.data;
  },

  async cancelRequest(id: string) {
    const res = await apiClient.delete(`/wallet/requests/${id}`);
    return res.data;
  },

  async payRequest(id: string, pin: string) {
    const res = await apiClient.post(`/wallet/requests/${id}/pay`, { pin });
    return res.data;
  },

  async getTransactions(params?: { page?: number; limit?: number; type?: string; status?: string }) {
    const res = await apiClient.get('/wallet/transactions', { params });
    return res.data?.data;
  },
};

