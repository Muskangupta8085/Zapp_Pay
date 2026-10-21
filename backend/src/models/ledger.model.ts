import mongoose, { Schema, Document } from 'mongoose';

export interface ILedgerEntry extends Document {
  referenceId: string;
  transactionId?: mongoose.Types.ObjectId;
  debitAccount: string;  // Account debited (source)
  creditAccount: string; // Account credited (destination)
  symbol: string;        // INR, USDT, ZAP
  amount: number;
  entryType: 'transfer' | 'trade' | 'deposit' | 'withdrawal' | 'fee' | 'reward';
  description?: string;
  createdAt: Date;
}

const ledgerEntrySchema = new Schema<ILedgerEntry>(
  {
    referenceId: {
      type: String,
      required: true,
      index: true,
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      index: true,
    },
    debitAccount: {
      type: String,
      required: true,
      index: true,
    },
    creditAccount: {
      type: String,
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    entryType: {
      type: String,
      enum: ['transfer', 'trade', 'deposit', 'withdrawal', 'fee', 'reward'],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable: no updates allowed
  }
);

ledgerEntrySchema.index({ debitAccount: 1, createdAt: -1 });
ledgerEntrySchema.index({ creditAccount: 1, createdAt: -1 });

export const LedgerEntry = mongoose.model<ILedgerEntry>('LedgerEntry', ledgerEntrySchema);
