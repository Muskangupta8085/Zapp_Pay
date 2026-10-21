import mongoose, { Schema, Document } from 'mongoose';

export interface IIdempotencyKey extends Document {
  key: string;
  userId: string;
  endpoint: string;
  requestHash: string;
  status: 'processing' | 'completed';
  statusCode?: number;
  responseBody?: any;
  createdAt: Date;
  updatedAt: Date;
}

const idempotencyKeySchema = new Schema<IIdempotencyKey>(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    requestHash: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['processing', 'completed'],
      default: 'processing',
    },
    statusCode: {
      type: Number,
    },
    responseBody: {
      type: Schema.Types.Mixed,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // 24-hour TTL automatic cleanup
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index per user and idempotency key
idempotencyKeySchema.index({ userId: 1, key: 1 }, { unique: true });

export const IdempotencyKey = mongoose.model<IIdempotencyKey>('IdempotencyKey', idempotencyKeySchema);
