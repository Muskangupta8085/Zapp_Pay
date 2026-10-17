import { z } from 'zod';

export const checkIdentifierSchema = {
  body: z.object({
    identifier: z.string().trim().min(3, 'Identifier is required'),
    type: z.enum(['mobile', 'email']).optional(),
  }),
};

export const registerSchema = {
  body: z
    .object({
      authMethod: z.enum(['mobile', 'email']).default('mobile'),
      phone: z.string().trim().optional(),
      email: z.string().trim().optional(),
      password: z.string().min(6, 'Password must be at least 6 characters long'),
      fullName: z.string().trim().optional(),
      referralCode: z.string().trim().toUpperCase().optional(),
    })
    .refine(
      (data) => {
        if (data.authMethod === 'mobile') {
          if (!data.phone) return false;
          // Clean phone format
          const cleaned = data.phone.replace(/[^0-9]/g, '');
          const tenDigits = cleaned.length === 12 && cleaned.startsWith('91') ? cleaned.slice(2) : cleaned;
          return tenDigits.length === 10 && /^[6-9]/.test(tenDigits);
        }
        if (data.authMethod === 'email') {
          if (!data.email) return false;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
        }
        return true;
      },
      {
        message: 'Please provide a valid 10-digit mobile number or valid email address according to authMethod',
        path: ['phone'],
      }
    ),
};

export const loginSchema = {
  body: z.object({
    identifier: z.string().trim().min(1, 'Mobile number or email is required'),
    password: z.string().min(1, 'Password is required'),
    authMethod: z.enum(['mobile', 'email']).optional(),
  }),
};

export const verifyOtpSchema = {
  body: z.object({
    contactInfo: z.string().trim().min(1, 'Contact information is required'),
    otp: z.string().trim().length(6, 'OTP must be exactly 6 digits'),
    isRegistered: z.boolean().optional(),
    purpose: z.enum(['register', 'login', 'reset_password', 'pin_change']).optional(),
  }),
};

export const resendOtpSchema = {
  body: z.object({
    contactInfo: z.string().trim().min(1, 'Contact information is required'),
    purpose: z.enum(['register', 'login', 'reset_password', 'pin_change']).optional(),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    identifier: z.string().trim().min(1, 'Mobile number or email is required'),
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    contactInfo: z.string().trim().min(1, 'Contact information is required'),
    otp: z.string().trim().length(6, 'OTP must be exactly 6 digits'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
  }),
};

export const refreshTokenSchema = {
  body: z.object({
    refreshToken: z.string().trim().min(1, 'Refresh token is required'),
  }),
};
