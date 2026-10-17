import mongoose, { Schema, Document } from 'mongoose';

export interface IRewardStreak extends Document {
  userId: mongoose.Types.ObjectId;
  currentStreak: number;
  lastCheckInDate?: Date;
  claimedDays: number[]; // e.g. [1, 2, 3]
  totalStreakEarned: number;
  unclaimedBalance: number;
  mysteryBox: {
    isUnlocked: boolean;
    isOpened: boolean;
    openedAt?: Date;
    rewardWon?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const rewardStreakSchema = new Schema<IRewardStreak>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    lastCheckInDate: {
      type: Date,
    },
    claimedDays: {
      type: [Number],
      default: [],
    },
    totalStreakEarned: {
      type: Number,
      default: 0,
    },
    unclaimedBalance: {
      type: Number,
      default: 0,
    },
    mysteryBox: {
      isUnlocked: { type: Boolean, default: false },
      isOpened: { type: Boolean, default: false },
      openedAt: { type: Date },
      rewardWon: { type: Number },
    },
  },
  {
    timestamps: true,
  }
);

export const RewardStreak = mongoose.model<IRewardStreak>('RewardStreak', rewardStreakSchema);
