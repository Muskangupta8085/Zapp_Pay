import mongoose, { Schema, Document } from 'mongoose';
import { TransactionType, TransactionStatus } from '../types/index.js';

export interface ITransaction extends Document {
  referenceId: string;
  idempotencyKey?: string;
  senderId?: mongoose.Types.ObjectId;
  receiverId?: mongoose.Types.ObjectId;
  senderAddress?: string;
  receiverAddress: string;
  symbol: string;
  amount: number;
  fee: number;
  type: TransactionType;
  status: TransactionStatus;
  notes?: string;
  txHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ALLOWED_TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  pending: ['completed', 'failed', 'cancelled'],
  completed: [], // Terminal
  failed: [],    // Terminal
  cancelled: [], // Terminal
};

const transactionSchema = new Schema<ITransaction>(
  {
    referenceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    senderAddress: {
      type: String,
      trim: true,
    },
    receiverAddress: {
      type: String,
      required: true,
      trim: true,
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
      set: (val: number) => Math.round((val + Number.EPSILON) * 100000000) / 100000000, // Clamp to 8 decimal precision
    },
    fee: {
      type: Number,
      default: 0,
      min: 0,
      set: (val: number) => Math.round((val + Number.EPSILON) * 100000000) / 100000000,
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'transfer', 'reward', 'trade'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    txHash: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Finite State Machine pre-save enforcement
transactionSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified('status')) {
    const originalStatus = (this as any)._originalStatus || (this.isModified('status') ? this.get('status') : undefined);
    // When status changes on an existing document, validate against state machine
    const prevStatus = (this as any)._previousStatus;
    if (prevStatus && prevStatus !== this.status) {
      const allowed = ALLOWED_TRANSITIONS[prevStatus as TransactionStatus] || [];
      if (!allowed.includes(this.status)) {
        return next(
          new Error(`Invalid state transition: Cannot change status from '${prevStatus}' to '${this.status}'.`)
        );
      }
    }
  }
  next();
});

// Cache previous status for state transition enforcement
transactionSchema.post('init', function () {
  (this as any)._previousStatus = this.status;
});

transactionSchema.post('save', function () {
  (this as any)._previousStatus = this.status;
});

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
export { ALLOWED_TRANSITIONS };
