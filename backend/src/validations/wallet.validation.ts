import { z } from 'zod';

export const sendTransferSchema = {
  body: z.object({
    receiverAddress: z.string().min(1, 'Receiver address is required'),
    symbol: z.string().min(1, 'Symbol is required'),
    amount: z.number().positive('Amount must be greater than zero'),
    notes: z.string().optional(),
    pin: z.string().optional(),
    idempotencyKey: z.string().optional(),
  }),
};

export const withdrawSchema = {
  body: z.object({
    symbol: z.string().default('INR'),
    amount: z.number().positive('Withdrawal amount must be greater than zero'),
    destinationType: z.enum(['BANK', 'UPI', 'CRYPTO']).default('BANK'),
    bankAccountId: z.string().optional(),
    upiId: z.string().optional(),
    cryptoAddress: z.string().optional(),
    pin: z.string().min(4, 'PIN is required to authorize withdrawal'),
    idempotencyKey: z.string().optional(),
  }),
};

export const payRequestSchema = {
  body: z.object({
    pin: z.string().min(4, 'PIN is required to authorize payment'),
    idempotencyKey: z.string().optional(),
  }),
};
