export const API_ENDPOINTS = {
  AUTH: {
    CHECK_IDENTIFIER: '/auth/check-identifier',
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY_OTP: '/auth/verify-otp',
    RESEND_OTP: '/auth/resend-otp',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    REFRESH_TOKEN: '/auth/refresh-token',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/me',
  },
  WALLET: {
    DETAILS: '/wallet/overview',
    BALANCES: '/wallet/balances',
    TRANSACTIONS: '/wallet/transactions',
    SEND: '/wallet/send',
    RECEIVE: '/wallet/receive-address',
  },
  MARKET: {
    PRICES: '/market/prices',
    RATES: '/market/rates',
    CHART_DATA: (symbol: string) => `/market/chart/${symbol}`,
  },
};
