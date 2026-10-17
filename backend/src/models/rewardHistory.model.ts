import mongoose, { Schema, Document } from 'mongoose';

export type RewardType = 'Streak' | 'Task' | 'Mystery' | 'Airdrop';

export interface IRewardHistory extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  amount: string;
  amountRaw: number;
  fiatAmount: string;
  type: RewardType;
  txHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const rewardHistorySchema = new Schema<IRewardHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: String,
      required: true,
    },
    amountRaw: {
      type: Number,
      required: true,
    },
    fiatAmount: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['Streak', 'Task', 'Mystery', 'Airdrop'],
      default: 'Task',
    },
    txHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

rewardHistorySchema.index({ userId: 1, createdAt: -1 });

export const RewardHistory = mongoose.model<IRewardHistory>('RewardHistory', rewardHistorySchema);
