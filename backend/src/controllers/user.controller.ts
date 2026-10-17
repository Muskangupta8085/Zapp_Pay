import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { User } from '../models/user.model.js';
import { sendResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

export class UserController {
  static async updateProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { fullName, phone, avatarUrl, upiId } = req.body;
      const updateFields: Record<string, any> = {};
      if (fullName !== undefined) updateFields.fullName = fullName.trim();
      if (phone !== undefined) updateFields.phone = phone.trim();
      if (avatarUrl !== undefined) updateFields.avatarUrl = avatarUrl;
      if (upiId !== undefined) updateFields.upiId = upiId.trim();

      const user = await User.findByIdAndUpdate(
        req.user?.userId,
        { $set: updateFields },
        { new: true, runValidators: true }
      );
      if (!user) {
        throw ApiError.notFound('User not found');
      }
      sendResponse({
        res,
        message: 'Profile updated successfully',
        data: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          upiId: user.upiId,
          avatarUrl: user.avatarUrl,
          kycStatus: user.kycStatus,
          referralCode: user.referralCode,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getReferrals(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const currentUser = await User.findById(req.user.userId);
      if (!currentUser) throw ApiError.notFound('User not found');

      const referrals = await User.find({ referredBy: currentUser.referralCode })
        .select('fullName referralCode createdAt kycStatus phone email')
        .sort({ createdAt: -1 });

      sendResponse({
        res,
        message: 'Referrals retrieved successfully',
        data: {
          referrals,
          totalReferrals: referrals.length,
          referralCode: currentUser.referralCode,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
