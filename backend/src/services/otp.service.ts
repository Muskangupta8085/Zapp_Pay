import crypto from 'crypto';
import { Otp, OtpPurpose } from '../models/otp.model.js';
import { ApiError } from '../utils/apiError.js';
import { ENV } from '../config/env.js';

export class OtpService {
  /**
   * Hashes an OTP code using SHA-256 for secure database storage
   */
  private static hashOtp(otpCode: string, identifier: string): string {
    return crypto
      .createHash('sha256')
      .update(`${identifier}:${otpCode.trim()}`)
      .digest('hex');
  }

  /**
   * Normalizes an identifier (phone or email)
   */
  static normalizeIdentifier(raw: string): { normalized: string; type: 'mobile' | 'email' } {
    const trimmed = raw.trim();
    if (trimmed.includes('@')) {
      return {
        normalized: trimmed.toLowerCase(),
        type: 'email',
      };
    }

    const digitsOnly = trimmed.replace(/[^0-9]/g, '');
    let tenDigits = digitsOnly;
    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      tenDigits = digitsOnly.slice(2);
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
      tenDigits = digitsOnly.slice(1);
    }

    if (tenDigits.length !== 10) {
      throw ApiError.badRequest('Invalid mobile number. Must be a 10-digit number.');
    }

    return {
      normalized: `+91${tenDigits}`,
      type: 'mobile',
    };
  }

  /**
   * Generates a cryptographically secure 6-digit numeric OTP code
   */
  static generateOtpCode(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Dispatches OTP via console (dev) or configured SMS/Email provider
   */
  static async dispatchOtp(identifier: string, otpCode: string, purpose: OtpPurpose): Promise<void> {
    const banner = `\n=========================================================\n🔔 [ZAPP PAY OTP] [${purpose.toUpperCase()}]\nTarget: ${identifier}\nCode:   >>> ${otpCode} <<<\nExpires in 3 minutes\n=========================================================\n`;
    console.log(banner);

    // In production, integrate SMS provider (e.g., Twilio, Fast2SMS) or SMTP
    if (ENV.NODE_ENV === 'production') {
      // Configurable provider hook
    }
  }

  /**
   * Creates or updates an OTP record with cooldown and 3-min TTL with hashed DB storage
   */
  static async requestOtp(
    rawIdentifier: string,
    purpose: OtpPurpose,
    tempUserData?: Record<string, any>
  ): Promise<{ contactInfo: string; expiresInSeconds: number; resendAvailableInSeconds: number; devOtp?: string }> {
    const { normalized } = this.normalizeIdentifier(rawIdentifier);

    // Check existing OTP for cooldown
    const existing = await Otp.findOne({ identifier: normalized, purpose, isVerified: false });
    const now = new Date();

    if (existing && existing.resendAfter > now) {
      const waitSeconds = Math.ceil((existing.resendAfter.getTime() - now.getTime()) / 1000);
      throw ApiError.badRequest(`Please wait ${waitSeconds} seconds before requesting a new verification code.`);
    }

    const rawOtpCode = this.generateOtpCode();
    const hashedOtp = this.hashOtp(rawOtpCode, normalized);

    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes
    const resendAfter = new Date(Date.now() + 60 * 1000); // 60 seconds cooldown

    // Clear previous pending OTPs for this identifier & purpose
    await Otp.deleteMany({ identifier: normalized, purpose });

    await Otp.create({
      identifier: normalized,
      otpCode: hashedOtp,
      purpose,
      attempts: 0,
      expiresAt,
      resendAfter,
      isVerified: false,
      tempUserData,
    });

    await this.dispatchOtp(normalized, rawOtpCode, purpose);

    return {
      contactInfo: normalized,
      expiresInSeconds: 180,
      resendAvailableInSeconds: 60,
      devOtp: ENV.NODE_ENV === 'development' ? rawOtpCode : undefined,
    };
  }

  /**
   * Verifies an entered OTP code against the hashed database entry
   */
  static async verifyOtp(
    rawIdentifier: string,
    enteredOtp: string,
    purpose: OtpPurpose
  ): Promise<{ verified: boolean; tempUserData?: Record<string, any> }> {
    const { normalized } = this.normalizeIdentifier(rawIdentifier);

    const otpRecord = await Otp.findOne({
      identifier: normalized,
      purpose,
      isVerified: false,
    });

    if (!otpRecord) {
      throw ApiError.badRequest('No active verification code found or code has expired. Please request a new one.');
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      throw ApiError.badRequest('Verification code has expired. Please request a new code.');
    }

    if (otpRecord.attempts >= 3) {
      await Otp.deleteOne({ _id: otpRecord._id });
      throw ApiError.badRequest('Maximum attempts exceeded. Verification code invalidated. Please request a new code.');
    }

    const hashedEntered = this.hashOtp(enteredOtp, normalized);
    const isValid = crypto.timingSafeEqual(Buffer.from(hashedEntered), Buffer.from(otpRecord.otpCode));

    if (!isValid) {
      otpRecord.attempts += 1;
      if (otpRecord.attempts >= 3) {
        await Otp.deleteOne({ _id: otpRecord._id });
        throw ApiError.badRequest('Maximum attempts exceeded. Verification code invalidated. Please request a new code.');
      }
      await otpRecord.save();
      const remaining = 3 - otpRecord.attempts;
      throw ApiError.badRequest(`Invalid verification code. ${remaining} attempt(s) remaining.`);
    }

    // Success: mark as verified and clean up
    otpRecord.isVerified = true;
    await otpRecord.save();

    const tempUserData = otpRecord.tempUserData;

    // Delete verified OTP to prevent reuse
    await Otp.deleteOne({ _id: otpRecord._id });

    return {
      verified: true,
      tempUserData,
    };
  }
}
