import mongoose, { Schema, Document } from 'mongoose';

export type PaymentMethodType = 'BANK' | 'UPI';

export interface IBankAccountModel extends Document {
  userId: mongoose.Types.ObjectId;
  type: PaymentMethodType;
  accountHolderName?: string;
  accountNumber?: string;
  ifsc?: string;
  bankName?: string;
  upiId?: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bankAccountSchema = new Schema<IBankAccountModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['BANK', 'UPI'],
      default: 'BANK',
    },
    accountHolderName: {
      type: String,
      trim: true,
    },
    accountNumber: {
      type: String,
      trim: true,
    },
    ifsc: {
      type: String,
      trim: true,
      uppercase: true,
    },
    bankName: {
      type: String,
      trim: true,
    },
    upiId: {
      type: String,
      trim: true,
      lowercase: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

bankAccountSchema.index({ userId: 1, isDefault: -1 });

export const BankAccount = mongoose.model<IBankAccountModel>('BankAccount', bankAccountSchema);
