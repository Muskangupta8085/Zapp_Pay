import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, TokenPayload } from '../types/index.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { ENV } from '../config/env.js';

export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('No authorization token provided'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;

    // Check user in database for instant revocation and active status
    const user = await User.findById(decoded.userId).select('isActive tokenVersion role email phone');
    if (!user) {
      return next(ApiError.unauthorized('User not found'));
    }

    if (!user.isActive) {
      return next(ApiError.forbidden('Your account has been deactivated'));
    }

    if (
      decoded.tokenVersion !== undefined &&
      user.tokenVersion !== undefined &&
      decoded.tokenVersion !== user.tokenVersion
    ) {
      return next(ApiError.unauthorized('Session has expired or was revoked. Please log in again.'));
    }

    req.user = {
      ...decoded,
      role: user.role,
    };
    next();
  } catch (err) {
    return next(ApiError.unauthorized('Invalid or expired authentication token'));
  }
};

export const authenticateOptional = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
    const user = await User.findById(decoded.userId).select('isActive tokenVersion role');
    if (user && user.isActive && (decoded.tokenVersion === undefined || user.tokenVersion === undefined || decoded.tokenVersion === user.tokenVersion)) {
      req.user = {
        ...decoded,
        role: user.role,
      };
    }
  } catch {
    // Ignore invalid token for optional auth
  }
  next();
};
