import mongoose, { Schema, Document } from 'mongoose';

export interface IBannerItem {
  id: string;
  title: string;
  subtitle: string;
  bannerType: 'Promo' | 'Notice' | 'Maintenance' | 'Update';
  ctaText?: string;
  ctaAction?: string;
  isActive: boolean;
}

export interface IAppConfig extends Document {
  minAppVersion: string;
  latestAppVersion: string;
  forceUpdate: boolean;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  activeBanners: IBannerItem[];
  termsOfService: string;
  privacyPolicy: string;
  updatedAt: Date;
}

const appConfigSchema = new Schema<IAppConfig>(
  {
    minAppVersion: {
      type: String,
      default: '1.0.0',
    },
    latestAppVersion: {
      type: String,
      default: '1.0.0',
    },
    forceUpdate: {
      type: Boolean,
      default: false,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: 'Zapp Pay system is undergoing brief scheduled maintenance. Please check back shortly.',
    },
    activeBanners: [
      {
        id: String,
        title: String,
        subtitle: String,
        bannerType: {
          type: String,
          enum: ['Promo', 'Notice', 'Maintenance', 'Update'],
          default: 'Promo',
        },
        ctaText: String,
        ctaAction: String,
        isActive: { type: Boolean, default: true },
      },
    ],
    termsOfService: {
      type: String,
      default: 'Zapp Pay Terms of Service v1.4 (Updated 2026). Compliant peer-to-peer crypto liquidity intermediary node.',
    },
    privacyPolicy: {
      type: String,
      default: 'Zapp Pay End-to-End Cryptographic Privacy Charter. Your personal identity is strictly encrypted and secure.',
    },
  },
  {
    timestamps: true,
  }
);

export const AppConfig = mongoose.model<IAppConfig>('AppConfig', appConfigSchema);
