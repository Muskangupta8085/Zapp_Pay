import rateLimit from 'express-rate-limit';

/**
 * Standard API rate limiter: 300 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
  },
});

/**
 * Strict rate limiter for Authentication and OTP endpoints: 10 requests per 15 minutes
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait 15 minutes before retrying.',
  },
});

/**
 * Strict rate limiter for Transaction PIN verification: 5 requests per 15 minutes
 */
export const pinRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many PIN verification attempts. Please wait 15 minutes before retrying.',
  },
});

/**
 * Rate limiter for financial transfers & orders: 20 operations per minute
 */
export const financialRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Financial transaction rate limit reached. Please wait a minute before submitting further requests.',
  },
});
