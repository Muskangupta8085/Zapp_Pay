import mongoose, { Schema, Document } from 'mongoose';
import { TransactionType, TransactionStatus } from '../types/index.js';

export interface ITransaction extends Document {
  referenceId: string;
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

const transactionSchema = new Schema<ITransaction>(
  {
    referenceId: {
      type: String,
      required: true,
      unique: true,
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
    },
    fee: {
      type: Number,
      default: 0,
      min: 0,
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

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
