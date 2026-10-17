import mongoose, { Schema, Document } from 'mongoose';

export interface IToken extends Document {
  name: string;
  symbol: string;
  decimals: number;
  currentPriceUsd: number;
  change24h: number;
  network: string;
  iconUrl?: string;
  isActive: boolean;
  isTradable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const tokenSchema = new Schema<IToken>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    symbol: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    decimals: {
      type: Number,
      default: 18,
    },
    currentPriceUsd: {
      type: Number,
      required: true,
      default: 1.0,
    },
    change24h: {
      type: Number,
      default: 0.0,
    },
    network: {
      type: String,
      default: 'ZapChain',
    },
    iconUrl: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isTradable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Token = mongoose.model<IToken>('Token', tokenSchema);
