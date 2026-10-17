import mongoose, { Schema, Document } from 'mongoose';

export interface IWalletBalance {
  symbol: string; // e.g., 'ZAP', 'BTC', 'ETH', 'USDT'
  amount: number;
  lockedAmount: number;
}

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  walletAddress: string;
  balances: IWalletBalance[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const walletBalanceSchema = new Schema<IWalletBalance>(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lockedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const walletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    balances: [walletBalanceSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Wallet = mongoose.model<IWallet>('Wallet', walletSchema);
