import { z } from 'zod';

export const sendTransferSchema = {
  body: z.object({
    receiverAddress: z.string().min(1, 'Receiver address is required'),
    symbol: z.string().min(1, 'Symbol is required'),
    amount: z.number().positive('Amount must be greater than zero'),
    notes: z.string().optional(),
  }),
};
