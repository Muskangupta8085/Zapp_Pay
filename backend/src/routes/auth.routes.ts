import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimit.middleware.js';
import {
  checkIdentifierSchema,
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from '../validations/auth.validation.js';

const router = Router();

// Public auth endpoints protected with strict auth rate limiting
router.post('/check-identifier', authRateLimiter, validate(checkIdentifierSchema), AuthController.checkIdentifier);
router.post('/register', authRateLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authRateLimiter, validate(loginSchema), AuthController.login);
router.post('/verify-otp', authRateLimiter, validate(verifyOtpSchema), AuthController.verifyOtp);
router.post('/resend-otp', authRateLimiter, validate(resendOtpSchema), AuthController.resendOtp);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), AuthController.resetPassword);
router.post('/refresh-token', validate(refreshTokenSchema), AuthController.refreshToken);
router.post('/logout', AuthController.logout);

// Protected auth endpoint
router.get('/me', authenticate, AuthController.me);

export default router;
