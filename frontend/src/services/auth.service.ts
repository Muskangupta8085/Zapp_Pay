import { apiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';

export interface RegisterPayload {
  authMethod: 'mobile' | 'email';
  phone?: string;
  email?: string;
  password: string;
  fullName?: string;
  referralCode?: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
  authMethod?: 'mobile' | 'email';
}

export interface VerifyOtpPayload {
  contactInfo: string;
  otp: string;
  isRegistered?: boolean;
  purpose?: 'register' | 'login' | 'reset_password';
}

export interface UserProfile {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: string;
  kycStatus: string;
  referralCode: string;
  referredBy?: string;
  walletAddress?: string;
  upiId?: string;
  bankAccount?: {
    accountNumber?: string;
    ifsc?: string;
    bankName?: string;
    accountHolderName?: string;
  };
  biometricEnabled?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  createdAt?: string;
}

export interface AuthResponseData {
  user: UserProfile;
  token: string;
  refreshToken: string;
}

export class AuthService {
  static async checkIdentifier(identifier: string, type?: 'mobile' | 'email') {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.CHECK_IDENTIFIER, { identifier, type });
    return response.data;
  }

  static async register(data: RegisterPayload) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, data);
    return response.data;
  }

  static async login(data: LoginPayload) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, data);
    return response.data;
  }

  static async verifyOtp(data: VerifyOtpPayload) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_OTP, data);
    return response.data;
  }

  static async resendOtp(contactInfo: string, purpose?: string) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.RESEND_OTP, { contactInfo, purpose });
    return response.data;
  }

  static async forgotPassword(identifier: string) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { identifier });
    return response.data;
  }

  static async resetPassword(contactInfo: string, otp: string, newPassword: string) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { contactInfo, otp, newPassword });
    return response.data;
  }

  static async refreshToken(refreshToken: string) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, { refreshToken });
    return response.data;
  }

  static async logout(refreshToken?: string) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
    return response.data;
  }

  static async getProfile() {
    const response = await apiClient.get(API_ENDPOINTS.AUTH.PROFILE);
    return response.data;
  }
}
