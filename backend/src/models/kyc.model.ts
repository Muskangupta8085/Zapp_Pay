import mongoose, { Schema, Document } from 'mongoose';
import { KycStatus } from '../types/index.js';

export interface IKycDocument {
  docType: 'passport' | 'national_id' | 'driving_license';
  documentNumber: string;
  frontImageUrl: string;
  backImageUrl?: string;
}

export interface IKyc extends Document {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  dob?: string;
  country: string;
  address?: string;
  documents: IKycDocument[];
  status: KycStatus;
  rejectionReason?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const kycDocumentSchema = new Schema<IKycDocument>(
  {
    docType: {
      type: String,
      enum: ['passport', 'national_id', 'driving_license'],
      required: true,
    },
    documentNumber: {
      type: String,
      required: true,
      trim: true,
    },
    frontImageUrl: {
      type: String,
      required: true,
    },
    backImageUrl: {
      type: String,
    },
  },
  { _id: false }
);

const kycSchema = new Schema<IKyc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    dob: {
      type: String,
    },
    country: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    documents: [kycDocumentSchema],
    status: {
      type: String,
      enum: ['not_submitted', 'pending', 'verified', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: {
      type: String,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Kyc = mongoose.model<IKyc>('Kyc', kycSchema);
