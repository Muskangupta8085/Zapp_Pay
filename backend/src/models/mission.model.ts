import mongoose, { Schema, Document } from 'mongoose';

export type MissionCategory = 'Beginner' | 'Trading' | 'Community';
export type MissionStatus = 'Action' | 'In Progress' | 'Claim' | 'Claimed';

export interface IMission extends Document {
  userId: mongoose.Types.ObjectId;
  missionKey: string; // 'kyc', 'first_deposit', 'trades_5', 'invite_3'
  title: string;
  subtitle: string;
  category: MissionCategory;
  rewardAmount: number;
  rewardText: string;
  progress: number;
  target: number;
  status: MissionStatus;
  claimedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const missionSchema = new Schema<IMission>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    missionKey: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['Beginner', 'Trading', 'Community'],
      default: 'Beginner',
    },
    rewardAmount: {
      type: Number,
      required: true,
    },
    rewardText: {
      type: String,
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
    },
    target: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['Action', 'In Progress', 'Claim', 'Claimed'],
      default: 'Action',
    },
    claimedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

missionSchema.index({ userId: 1, missionKey: 1 }, { unique: true });

export const Mission = mongoose.model<IMission>('Mission', missionSchema);
