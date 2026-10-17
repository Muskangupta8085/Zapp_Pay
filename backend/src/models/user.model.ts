import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, KycStatus } from '../types/index.js';

export interface IBankAccount {
  accountNumber?: string;
  ifsc?: string;
  bankName?: string;
  accountHolderName?: string;
  isVerified?: boolean;
}

export interface INotificationPreferences {
  trades: boolean;
  deposits: boolean;
  marketing: boolean;
}

export interface IUser extends Document {
  email?: string;
  passwordHash: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  kycStatus: KycStatus;
  isActive: boolean;
  avatarUrl?: string;
  referralCode: string;
  referredBy?: string;
  transactionPinHash?: string;
  upiId?: string;
  bankAccount?: IBankAccount;
  biometricEnabled: boolean;
  notificationPreferences: INotificationPreferences;
  comparePassword(password: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      sparse: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'superadmin', 'moderator'],
      default: 'user',
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    kycStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'verified', 'rejected'],
      default: 'not_submitted',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    avatarUrl: {
      type: String,
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    referredBy: {
      type: String,
      uppercase: true,
      trim: true,
      index: true,
    },
    transactionPinHash: {
      type: String,
      select: false,
    },
    upiId: {
      type: String,
      trim: true,
    },
    bankAccount: {
      accountNumber: { type: String, trim: true },
      ifsc: { type: String, uppercase: true, trim: true },
      bankName: { type: String, trim: true },
      accountHolderName: { type: String, trim: true },
      isVerified: { type: Boolean, default: false },
    },
    biometricEnabled: {
      type: Boolean,
      default: true,
    },
    notificationPreferences: {
      trades: { type: Boolean, default: true },
      deposits: { type: Boolean, default: true },
      marketing: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', userSchema);
