import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/zapcoin',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_key_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  CORS_ORIGIN: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*'],
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:8081',
  ADMIN_URL: process.env.ADMIN_URL || 'http://localhost:5173',
  PII_ENCRYPTION_KEY: process.env.PII_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'dev_webhook_signing_secret_key_32bytes',
  WITHDRAWAL_FEE_INR: process.env.WITHDRAWAL_FEE_INR ? parseFloat(process.env.WITHDRAWAL_FEE_INR) : 10,
  USD_INR_RATE: process.env.USD_INR_RATE ? parseFloat(process.env.USD_INR_RATE) : 83.5,
  ZAP_INR_PRICE: process.env.ZAP_INR_PRICE ? parseFloat(process.env.ZAP_INR_PRICE) : 108.37,
};
