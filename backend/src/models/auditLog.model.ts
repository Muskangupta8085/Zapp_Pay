import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  adminId: mongoose.Types.ObjectId;
  adminName: string;
  adminEmail: string;
  adminRole: string;
  action: string;
  targetResource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'Success' | 'Failed';
  details?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    adminName: {
      type: String,
      required: true,
      trim: true,
    },
    adminEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    adminRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetResource: {
      type: String,
      required: true,
    },
    resourceId: {
      type: String,
      index: true,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Success', 'Failed'],
      default: 'Success',
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize audit log queries
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
