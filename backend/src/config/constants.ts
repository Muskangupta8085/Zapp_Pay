export const APP_CONSTANTS = {
  ROLES: {
    USER: 'user',
    ADMIN: 'admin',
    SUPERADMIN: 'superadmin',
    MODERATOR: 'moderator',
  } as const,

  KYC_STATUS: {
    NOT_SUBMITTED: 'not_submitted',
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
  } as const,

  TRANSACTION_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
  } as const,

  TRANSACTION_TYPE: {
    DEPOSIT: 'deposit',
    WITHDRAWAL: 'withdrawal',
    TRANSFER: 'transfer',
    REWARD: 'reward',
    TRADE: 'trade',
  } as const,
};
