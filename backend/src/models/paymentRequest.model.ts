import mongoose, { Schema, Document } from 'mongoose';

export type PaymentRequestStatus = 'pending' | 'completed' | 'cancelled' | 'expired';
export type PaymentRequestCurrency = 'INR' | 'XCOIN' | 'USDT';
export type PaymentRequestType = 'coin_request' | 'seller_request' | 'upi_request';

export interface IPaymentRequest extends Document {
  requestId: string;
  userId: mongoose.Types.ObjectId;
  requestType: PaymentRequestType;
  payerContact?: string;
  amount: number;
  currency: PaymentRequestCurrency;
  note?: string;
  status: PaymentRequestStatus;
  payoutDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
    netPayout?: number;
    tds?: number;
  };
  upiLink?: string;
  qrPayload?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentRequestSchema = new Schema<IPaymentRequest>(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestType: {
      type: String,
      enum: ['coin_request', 'seller_request', 'upi_request'],
      default: 'coin_request',
      index: true,
    },
    payerContact: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      enum: ['INR', 'XCOIN', 'USDT'],
      default: 'INR',
    },
    note: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    payoutDetails: {
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifsc: { type: String, trim: true },
      netPayout: { type: Number },
      tds: { type: Number },
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'expired'],
      default: 'pending',
      index: true,
    },
    upiLink: {
      type: String,
      trim: true,
    },
    qrPayload: {
      type: String,
      trim: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days validity
    },
  },
  {
    timestamps: true,
  }
);

paymentRequestSchema.index({ userId: 1, createdAt: -1 });

export const PaymentRequest = mongoose.model<IPaymentRequest>('PaymentRequest', paymentRequestSchema);
