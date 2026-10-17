import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '../models/user.model.js';
import { Wallet } from '../models/wallet.model.js';
import { RefreshToken } from '../models/refreshToken.model.js';
import { Otp, OtpPurpose } from '../models/otp.model.js';
import { OtpService } from './otp.service.js';
import { ApiError } from '../utils/apiError.js';
import { ENV } from '../config/env.js';
import { TokenPayload } from '../types/index.js';

export class AuthService {
  /**
   * Generates a signed JWT Access Token
   */
  static generateAccessToken(user: { _id: any; email?: string; phone?: string; role: any }): string {
    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
    return jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: (ENV.JWT_EXPIRES_IN || '7d') as any,
    });
  }

  static generateToken(user: { _id: any; email?: string; phone?: string; role: any }): string {
    return this.generateAccessToken(user);
  }

  /**
   * Generates and stores a cryptographic Refresh Token
   */
  static async generateRefreshToken(userId: any, userAgent?: string, ipAddress?: string): Promise<string> {
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await RefreshToken.create({
      userId,
      token,
      expiresAt,
      isRevoked: false,
      userAgent,
      ipAddress,
    });

    return token;
  }

  /**
   * Generates a unique referral code e.g. ZAP8492
   */
  static async generateUniqueReferralCode(): Promise<string> {
    let code = '';
    let exists = true;
    let attempts = 0;

    while (exists && attempts < 10) {
      attempts++;
      const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      code = `ZAP${randomSuffix}`;
      const found = await User.findOne({ referralCode: code });
      if (!found) {
        exists = false;
      }
    }
    return code;
  }

  /**
   * Pre-checks if phone or email exists
   */
  static async checkIdentifier(rawIdentifier: string): Promise<{ exists: boolean; message: string }> {
    const { normalized, type } = OtpService.normalizeIdentifier(rawIdentifier);

    const query = type === 'email' ? { email: normalized } : { phone: normalized };
    const user = await User.findOne(query);

    if (user) {
      return {
        exists: true,
        message: `${type === 'email' ? 'Email' : 'Mobile number'} is already registered`,
      };
    }

    return {
      exists: false,
      message: `${type === 'email' ? 'Email' : 'Mobile number'} is available`,
    };
  }

  /**
   * Initiates registration and dispatches 6-digit OTP
   */
  static async register(data: {
    authMethod: 'mobile' | 'email';
    phone?: string;
    email?: string;
    password: string;
    fullName?: string;
    referralCode?: string;
  }): Promise<{ contactInfo: string; expiresInSeconds: number; resendAvailableInSeconds: number; devOtp?: string }> {
    const target = data.authMethod === 'mobile' ? data.phone! : data.email!;
    const { normalized, type } = OtpService.normalizeIdentifier(target);

    // Check duplicate user
    const query = type === 'email' ? { email: normalized } : { phone: normalized };
    const existing = await User.findOne(query);
    if (existing) {
      throw ApiError.badRequest(`This ${type === 'email' ? 'email' : 'mobile number'} is already registered. Please log in.`);
    }

    // Validate referral code if provided
    let verifiedReferrer: string | undefined;
    if (data.referralCode) {
      const referrer = await User.findOne({ referralCode: data.referralCode.toUpperCase() });
      if (!referrer) {
        throw ApiError.badRequest('Invalid referral code. Please check or remove it.');
      }
      verifiedReferrer = referrer.referralCode;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const tempUserData = {
      phone: type === 'mobile' ? normalized : undefined,
      email: type === 'email' ? normalized : undefined,
      passwordHash,
      fullName: data.fullName || (type === 'mobile' ? `User ${normalized.slice(-4)}` : normalized.split('@')[0]),
      referredBy: verifiedReferrer,
      authMethod: data.authMethod,
    };

    // Request OTP with 5m TTL and 45s resend cooldown
    return OtpService.requestOtp(normalized, 'register', tempUserData);
  }

  /**
   * Initiates login: validates password and dispatches 2FA OTP
   */
  static async login(data: {
    identifier: string;
    password: string;
    authMethod?: 'mobile' | 'email';
  }): Promise<{ contactInfo: string; requiresOtp: boolean; resendAvailableInSeconds: number; devOtp?: string }> {
    const { normalized, type } = OtpService.normalizeIdentifier(data.identifier);

    const query = type === 'email' ? { email: normalized } : { phone: normalized };
    const user = await User.findOne(query).select('+passwordHash');

    if (!user) {
      throw ApiError.unauthorized('Invalid credentials. Account not found.');
    }

    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid credentials. Password incorrect.');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account is deactivated. Please contact support.');
    }

    // Request 6-digit login OTP
    const otpResult = await OtpService.requestOtp(normalized, 'login');

    return {
      contactInfo: normalized,
      requiresOtp: true,
      resendAvailableInSeconds: otpResult.resendAvailableInSeconds,
      devOtp: otpResult.devOtp,
    };
  }

  /**
   * Verifies OTP for Registration or Login
   */
  static async verifyOtp(data: {
    contactInfo: string;
    otp: string;
    isRegistered?: boolean;
    purpose?: OtpPurpose;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<{ user: Partial<IUser>; token: string; refreshToken: string }> {
    const { normalized, type } = OtpService.normalizeIdentifier(data.contactInfo);

    // Determine purpose: if not specified, infer from isRegistered
    let purpose: OtpPurpose = data.purpose || (data.isRegistered ? 'login' : 'register');

    // Attempt verification with the inferred purpose
    let verification: { verified: boolean; tempUserData?: Record<string, any> };
    try {
      verification = await OtpService.verifyOtp(normalized, data.otp, purpose);
    } catch (err: any) {
      // Fallback check if user flipped isRegistered flag
      const alternatePurpose: OtpPurpose = purpose === 'register' ? 'login' : 'register';
      const alternateOtp = await Otp.findOne({ identifier: normalized, purpose: alternatePurpose, isVerified: false });
      if (alternateOtp) {
        purpose = alternatePurpose;
        verification = await OtpService.verifyOtp(normalized, data.otp, purpose);
      } else {
        throw err;
      }
    }

    let user: IUser | null = null;

    if (purpose === 'register') {
      let temp = verification.tempUserData;
      if (!temp) {
        temp = {
          phone: type === 'mobile' ? normalized : undefined,
          email: type === 'email' ? normalized : undefined,
          passwordHash: await bcrypt.hash('Password@123', 10),
          fullName: type === 'mobile' ? `User ${normalized.slice(-4)}` : normalized.split('@')[0],
          authMethod: type,
        };
      }

      // Check if user was already created during previous attempt
      const existingUser = await User.findOne(type === 'email' ? { email: normalized } : { phone: normalized });
      if (existingUser) {
        user = existingUser;
        if (temp.fullName && (!user.fullName || user.fullName.startsWith('User '))) {
          user.fullName = temp.fullName;
          await user.save();
        }
      } else {
        const referralCode = await this.generateUniqueReferralCode();

        const newUserData: any = {
          passwordHash: temp.passwordHash,
          fullName: temp.fullName,
          referredBy: temp.referredBy,
          referralCode,
          role: 'user',
          isActive: true,
          kycStatus: 'not_submitted',
        };

        if (temp.phone) {
          newUserData.phone = temp.phone;
          newUserData.isPhoneVerified = true;
        }

        if (temp.email) {
          newUserData.email = temp.email;
          newUserData.isEmailVerified = true;
        }

        user = await User.create(newUserData);

        // Initialize User Wallet with 100 ZAP welcome bonus + Web3 EVM address
        const randomAddress = '0x' + crypto.randomBytes(20).toString('hex');
        await Wallet.create({
          userId: user._id,
          walletAddress: randomAddress,
          balances: [
            { symbol: 'ZAP', amount: 100, lockedAmount: 0 }, // Welcome bonus
            { symbol: 'USDT', amount: 0, lockedAmount: 0 },
            { symbol: 'BTC', amount: 0, lockedAmount: 0 },
            { symbol: 'ETH', amount: 0, lockedAmount: 0 },
          ],
        });
      }
    } else {
      // Login flow
      const query = type === 'email' ? { email: normalized } : { phone: normalized };
      user = await User.findOne(query);
      if (!user) {
        throw ApiError.notFound('User account not found.');
      }
      if (!user.isActive) {
        throw ApiError.forbidden('Your account is deactivated. Please contact support.');
      }

      // Mark verified flag if not yet set
      if (type === 'mobile' && !user.isPhoneVerified) {
        user.isPhoneVerified = true;
        await user.save();
      } else if (type === 'email' && !user.isEmailVerified) {
        user.isEmailVerified = true;
        await user.save();
      }
    }

    // Generate tokens
    const token = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user._id, data.userAgent, data.ipAddress);

    // Retrieve wallet address if exists
    const wallet = await Wallet.findOne({ userId: user._id });

    return {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        kycStatus: user.kycStatus,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        walletAddress: wallet ? wallet.walletAddress : undefined,
        biometricEnabled: user.biometricEnabled,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
      } as any,
      token,
      refreshToken,
    };
  }

  /**
   * Resends OTP code with cooldown enforcement
   */
  static async resendOtp(
    contactInfo: string,
    purpose: OtpPurpose = 'register'
  ): Promise<{ contactInfo: string; resendAvailableInSeconds: number; devOtp?: string }> {
    const { normalized } = OtpService.normalizeIdentifier(contactInfo);

    // Look for existing pending tempUserData if register
    const existing = await Otp.findOne({ identifier: normalized, purpose });
    const tempUserData = existing?.tempUserData;

    const result = await OtpService.requestOtp(normalized, purpose, tempUserData);
    return {
      contactInfo: result.contactInfo,
      resendAvailableInSeconds: result.resendAvailableInSeconds,
      devOtp: result.devOtp,
    };
  }

  /**
   * Forgot password: generates reset OTP
   */
  static async forgotPassword(identifier: string): Promise<{ contactInfo: string; message: string; devOtp?: string }> {
    const { normalized, type } = OtpService.normalizeIdentifier(identifier);

    const query = type === 'email' ? { email: normalized } : { phone: normalized };
    const user = await User.findOne(query);

    if (!user) {
      throw ApiError.notFound('No account found with this mobile number or email.');
    }

    const otpResult = await OtpService.requestOtp(normalized, 'reset_password');

    return {
      contactInfo: normalized,
      message: 'Password reset code sent successfully',
      devOtp: otpResult.devOtp,
    };
  }

  /**
   * Resets password using verified OTP
   */
  static async resetPassword(contactInfo: string, otp: string, newPassword: string): Promise<{ message: string }> {
    const { normalized, type } = OtpService.normalizeIdentifier(contactInfo);

    // Verify OTP for reset_password
    await OtpService.verifyOtp(normalized, otp, 'reset_password');

    const query = type === 'email' ? { email: normalized } : { phone: normalized };
    const user = await User.findOne(query);

    if (!user) {
      throw ApiError.notFound('User account not found.');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Revoke all active refresh tokens for security
    await RefreshToken.updateMany({ userId: user._id, isRevoked: false }, { isRevoked: true });

    return {
      message: 'Password has been reset successfully. Please log in with your new password.',
    };
  }

  /**
   * Rotates refresh token and issues a new access token
   */
  static async refreshToken(oldToken: string): Promise<{ token: string; refreshToken: string }> {
    const record = await RefreshToken.findOne({ token: oldToken, isRevoked: false });

    if (!record || record.expiresAt < new Date()) {
      throw ApiError.unauthorized('Invalid or expired refresh token. Please log in again.');
    }

    // Revoke old token
    record.isRevoked = true;
    await record.save();

    const user = await User.findById(record.userId);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User not found or deactivated.');
    }

    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = await this.generateRefreshToken(user._id, record.userAgent, record.ipAddress);

    return {
      token: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logs out user by revoking refresh token
   */
  static async logout(refreshToken?: string, userId?: string): Promise<{ message: string }> {
    if (refreshToken) {
      await RefreshToken.updateOne({ token: refreshToken }, { isRevoked: true });
    } else if (userId) {
      await RefreshToken.updateMany({ userId, isRevoked: false }, { isRevoked: true });
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Fetches full profile for authenticated user
   */
  static async getMe(userId: string): Promise<{ user: any; wallet: any }> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User profile not found.');
    }

    const wallet = await Wallet.findOne({ userId });

    return {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        kycStatus: user.kycStatus,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        walletAddress: wallet ? wallet.walletAddress : undefined,
        upiId: user.upiId,
        bankAccount: user.bankAccount,
        biometricEnabled: user.biometricEnabled,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        createdAt: user.createdAt,
      },
      wallet: wallet
        ? {
            walletAddress: wallet.walletAddress,
            balances: wallet.balances,
          }
        : null,
    };
  }
}
