import crypto from 'crypto';
import { ENV } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM

function getEncryptionKey(): Buffer {
  const hexKey = ENV.PII_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  if (hexKey.length === 64) {
    return Buffer.from(hexKey, 'hex');
  }
  return crypto.createHash('sha256').update(hexKey).digest();
}

/**
 * Encrypts sensitive PII string using AES-256-GCM
 */
export function encryptPii(plainText: string): string {
  if (!plainText) return plainText;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts sensitive PII string encrypted with AES-256-GCM
 */
export function decryptPii(cipherText: string): string {
  if (!cipherText || !cipherText.includes(':')) return cipherText;
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) return cipherText;

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    // Return masked or original if decryption fails
    return '••••••••••••';
  }
}

/**
 * Masks an Aadhaar number to XXXX-XXXX-1234
 */
export function maskAadhaar(aadhaar: string): string {
  if (!aadhaar) return '';
  const digits = aadhaar.replace(/[^0-9]/g, '');
  if (digits.length >= 4) {
    return `XXXX-XXXX-${digits.slice(-4)}`;
  }
  return 'XXXX-XXXX-XXXX';
}

/**
 * Masks a PAN number to ABCDE****F
 */
export function maskPan(pan: string): string {
  if (!pan) return '';
  const clean = pan.trim().toUpperCase();
  if (clean.length === 10) {
    return `${clean.slice(0, 5)}****${clean.slice(-1)}`;
  }
  return '*****' + clean.slice(-4);
}

/**
 * Masks a Bank Account number to •••• •••• 4892
 */
export function maskAccountNumber(acc: string): string {
  if (!acc) return '';
  const clean = acc.replace(/\s+/g, '');
  if (clean.length > 4) {
    return `•••• •••• ${clean.slice(-4)}`;
  }
  return `•••• ${clean}`;
}

/**
 * Masks a phone number to +91 ****** 4321
 */
export function maskPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length >= 10) {
    return `+91 ****** ${digits.slice(-4)}`;
  }
  return '******' + digits.slice(-2);
}
