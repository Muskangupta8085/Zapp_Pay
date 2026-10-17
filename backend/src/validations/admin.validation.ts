import { z } from 'zod';

export const adminLoginSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
};

export const quickUserSchema = {
  body: z.object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    role: z.enum(['user', 'admin', 'moderator', 'superadmin']).optional().default('user'),
    initialBalance: z.number().optional().default(0),
  }),
};

export const quickDepositSchema = {
  body: z.object({
    userId: z.string().optional(),
    userEmail: z.string().optional(),
    amount: z.number().positive('Amount must be positive'),
    method: z.string().optional().default('UPI'),
    utrNumber: z.string().optional(),
    note: z.string().optional(),
  }),
};

export const quickWithdrawalSchema = {
  body: z.object({
    userId: z.string().optional(),
    userEmail: z.string().optional(),
    amount: z.number().positive('Amount must be positive'),
    method: z.string().optional().default('IMPS'),
    bankOrUpi: z.string().optional(),
    note: z.string().optional(),
  }),
};
