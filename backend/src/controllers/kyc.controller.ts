import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { Kyc } from '../models/kyc.model.js';
import { User } from '../models/user.model.js';
import { sendResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

export class KycController {
  static async submit(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const { fullName, dob, country, address, documents } = req.body;

      const existingKyc = await Kyc.findOne({ userId: req.user.userId });
      if (existingKyc && existingKyc.status === 'verified') {
        throw ApiError.badRequest('Your KYC is already verified');
      }

      const kyc = await Kyc.findOneAndUpdate(
        { userId: req.user.userId },
        {
          fullName,
          dob,
          country,
          address,
          documents,
          status: 'pending',
          rejectionReason: undefined,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await User.findByIdAndUpdate(req.user.userId, { kycStatus: 'pending' });

      sendResponse({
        res,
        statusCode: 201,
        message: 'KYC submitted successfully and is pending review',
        data: kyc,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const kyc = await Kyc.findOne({ userId: req.user.userId });
      sendResponse({
        res,
        message: 'KYC status retrieved',
        data: kyc || { status: 'not_submitted' },
      });
    } catch (error) {
      next(error);
    }
  }
}
