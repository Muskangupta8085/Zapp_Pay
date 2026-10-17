import mongoose, { Schema, Document } from 'mongoose';

export type OtpPurpose = 'register' | 'login' | 'reset_password' | 'pin_change';

export interface IOtp extends Document {
  identifier: string; // phone or email (normalized)
  otpCode: string;
  purpose: OtpPurpose;
  attempts: number;
  resendAfter: Date;
  expiresAt: Date;
  isVerified: boolean;
  tempUserData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    identifier: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    otpCode: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['register', 'login', 'reset_password', 'pin_change'],
      default: 'register',
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    resendAfter: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    tempUserData: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export const Otp = mongoose.model<IOtp>('Otp', otpSchema);
