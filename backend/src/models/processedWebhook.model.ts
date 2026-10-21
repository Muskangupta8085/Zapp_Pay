import mongoose, { Schema, Document } from 'mongoose';

export interface IProcessedWebhook extends Document {
  eventId: string;
  provider: string;
  eventType: string;
  payloadHash: string;
  createdAt: Date;
}

const processedWebhookSchema = new Schema<IProcessedWebhook>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    payloadHash: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 30 * 86400, // 30-day TTL cleanup
    },
  },
  {
    timestamps: true,
  }
);

export const ProcessedWebhook = mongoose.model<IProcessedWebhook>(
  'ProcessedWebhook',
  processedWebhookSchema
);
