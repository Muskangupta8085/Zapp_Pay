import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { Kyc } from '../models/kyc.model.js';
import { User } from '../models/user.model.js';
import { sendResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { encryptPii, decryptPii, maskAadhaar, maskPan } from '../utils/crypto.js';

export class KycController {
  /**
   * Submits or updates KYC identity documents with AES-256 PII encryption at rest
   */
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

      // Encrypt document numbers before storing in database
      const secureDocuments = Array.isArray(documents)
        ? documents.map((doc: any) => ({
            ...doc,
            documentNumber: encryptPii(doc.documentNumber),
          }))
        : [];

      const kyc = await Kyc.findOneAndUpdate(
        { userId: req.user.userId },
        {
          fullName: fullName?.trim(),
          dob: dob ? encryptPii(dob) : undefined,
          country,
          address: address ? encryptPii(address) : undefined,
          documents: secureDocuments,
          status: 'pending',
          rejectionReason: undefined,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await User.findByIdAndUpdate(req.user.userId, { kycStatus: 'pending' });

      // Return masked document info to client
      const maskedDocs = secureDocuments.map((doc: any) => {
        const raw = decryptPii(doc.documentNumber);
        return {
          ...doc,
          documentNumber: doc.docType === 'national_id' ? maskAadhaar(raw) : maskPan(raw),
        };
      });

      sendResponse({
        res,
        statusCode: 201,
        message: 'KYC submitted successfully and is pending review',
        data: {
          _id: kyc._id,
          fullName: kyc.fullName,
          status: kyc.status,
          country: kyc.country,
          documents: maskedDocs,
          createdAt: kyc.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves KYC status with PII masking in API response
   */
  static async getStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const kyc = await Kyc.findOne({ userId: req.user.userId });
      
      if (!kyc) {
        sendResponse({
          res,
          message: 'KYC status retrieved',
          data: { status: 'not_submitted' },
        });
        return;
      }

      const maskedDocs = kyc.documents.map((doc: any) => {
        const raw = decryptPii(doc.documentNumber);
        return {
          docType: doc.docType,
          documentNumber: doc.docType === 'national_id' ? maskAadhaar(raw) : maskPan(raw),
          frontImageUrl: doc.frontImageUrl,
          backImageUrl: doc.backImageUrl,
        };
      });

      sendResponse({
        res,
        message: 'KYC status retrieved',
        data: {
          _id: kyc._id,
          fullName: kyc.fullName,
          country: kyc.country,
          status: kyc.status,
          rejectionReason: kyc.rejectionReason,
          documents: maskedDocs,
          createdAt: kyc.createdAt,
          updatedAt: kyc.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
