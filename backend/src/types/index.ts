import { Request } from 'express';

export type UserRole = 'user' | 'admin' | 'superadmin' | 'moderator';

export type KycStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected';

export type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'reward' | 'trade';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface TokenPayload {
  userId: string;
  email?: string;
  phone?: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}
