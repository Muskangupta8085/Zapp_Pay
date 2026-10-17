import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { sendResponse } from '../utils/apiResponse.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiError } from '../utils/apiError.js';

export class AuthController {
  /**
   * Pre-checks if phone or email is available
   */
  static async checkIdentifier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier } = req.body;
      const result = await AuthService.checkIdentifier(identifier);
      sendResponse({
        res,
        statusCode: 200,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Starts user registration and sends 6-digit OTP
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { authMethod, phone, email, password, fullName, referralCode } = req.body;
      const result = await AuthService.register({
        authMethod: authMethod || (phone ? 'mobile' : 'email'),
        phone,
        email,
        password,
        fullName,
        referralCode,
      });

      sendResponse({
        res,
        statusCode: 200,
        message: 'Verification code sent successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validates credentials and initiates 2FA login via OTP
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier, password, authMethod } = req.body;
      const result = await AuthService.login({
        identifier,
        password,
        authMethod,
      });

      sendResponse({
        res,
        statusCode: 200,
        message: 'Verification code sent to your registered contact',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verifies 6-digit OTP for Registration, Login, or Password Reset
   */
  static async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { contactInfo, otp, isRegistered, purpose } = req.body;
      const userAgent = req.headers['user-agent'];
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

      const result = await AuthService.verifyOtp({
        contactInfo,
        otp,
        isRegistered,
        purpose,
        userAgent,
        ipAddress,
      });

      sendResponse({
        res,
        statusCode: 200,
        message: isRegistered ? 'Login successful' : 'Account verified and activated successfully!',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resends 6-digit verification code with 45s cooldown
   */
  static async resendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { contactInfo, purpose } = req.body;
      const result = await AuthService.resendOtp(contactInfo, purpose);

      sendResponse({
        res,
        statusCode: 200,
        message: 'A fresh verification code has been dispatched',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Requests password reset OTP
   */
  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier } = req.body;
      const result = await AuthService.forgotPassword(identifier);

      sendResponse({
        res,
        statusCode: 200,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resets password using verified OTP
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { contactInfo, otp, newPassword } = req.body;
      const result = await AuthService.resetPassword(contactInfo, otp, newPassword);

      sendResponse({
        res,
        statusCode: 200,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Issues a new access token using a valid refresh token
   */
  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);

      sendResponse({
        res,
        statusCode: 200,
        message: 'Token refreshed successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logs out user and invalidates session
   */
  static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const userId = req.user?.userId;
      const result = await AuthService.logout(refreshToken, userId);

      sendResponse({
        res,
        statusCode: 200,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves profile and wallet info for current authenticated user
   */
  static async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        throw ApiError.unauthorized('User not authenticated');
      }

      const result = await AuthService.getMe(req.user.userId);

      sendResponse({
        res,
        statusCode: 200,
        message: 'Profile retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
