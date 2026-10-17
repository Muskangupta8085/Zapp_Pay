import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { WalletService } from '../services/wallet.service.js';
import { TransactionService } from '../services/transaction.service.js';
import { sendResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

export class WalletController {
  static async getOverview(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const wallet = await WalletService.getWalletByUserId(req.user.userId);
      sendResponse({
        res,
        message: 'Wallet overview retrieved',
        data: wallet,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getReceiveAddress(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const wallet = await WalletService.getWalletByUserId(req.user.userId);
      sendResponse({
        res,
        message: 'Receive address retrieved',
        data: {
          walletAddress: wallet.walletAddress,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async send(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const { receiverAddress, symbol, amount, notes } = req.body;
      const tx = await TransactionService.transfer({
        senderUserId: req.user.userId,
        receiverAddress,
        symbol,
        amount: Number(amount),
        notes,
      });
      sendResponse({
        res,
        statusCode: 201,
        message: 'Transaction sent successfully',
        data: tx,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createRequest(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const {
        payerContact,
        amount,
        currency = 'INR',
        note,
        requestType = 'coin_request',
        payoutDetails,
      } = req.body;

      if (!amount || Number(amount) <= 0) {
        throw ApiError.badRequest('Amount must be greater than zero');
      }

      const crypto = await import('crypto');
      const { PaymentRequest } = await import('../models/paymentRequest.model.js');
      const { User } = await import('../models/user.model.js');

      const user = await User.findById(req.user.userId);
      const recipientVpa = user?.upiId || 'zapppay@icici';
      const payeeName = user?.fullName || 'Zapp Pay User';
      const cleanNote = (note || 'Payment Request via Zapp Pay').trim();
      const reqId = (requestType === 'seller_request' ? 'SR_' : 'PR_') + crypto.randomBytes(6).toString('hex').toUpperCase();

      // Standard NPCI UPI Intent Link format
      const upiLink = `upi://pay?pa=${encodeURIComponent(recipientVpa)}&pn=${encodeURIComponent(
        payeeName
      )}&am=${encodeURIComponent(Number(amount).toFixed(2))}&cu=INR&tn=${encodeURIComponent(cleanNote)}`;

      const paymentRequest = await PaymentRequest.create({
        requestId: reqId,
        userId: req.user.userId,
        requestType,
        payerContact: payerContact?.trim() || (requestType === 'seller_request' ? 'Zapp Liquidity Escrow' : undefined),
        amount: Number(amount),
        currency: (currency || 'INR').toUpperCase(),
        note: cleanNote,
        payoutDetails: payoutDetails || undefined,
        status: 'pending',
        upiLink,
        qrPayload: upiLink,
      });

      sendResponse({
        res,
        statusCode: 201,
        message: requestType === 'seller_request' ? 'Seller request submitted' : 'Payment request created successfully',
        data: paymentRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRequests(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const { PaymentRequest } = await import('../models/paymentRequest.model.js');
      const { type } = req.query;

      const queryFilter: any = { userId: req.user.userId };
      if (type && type !== 'all') {
        queryFilter.requestType = type;
      }

      const requests = await PaymentRequest.find(queryFilter)
        .sort({ createdAt: -1 })
        .limit(50);

      sendResponse({
        res,
        message: 'Payment requests retrieved successfully',
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancelRequest(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const { id } = req.params;
      const { PaymentRequest } = await import('../models/paymentRequest.model.js');

      const request = await PaymentRequest.findOne({
        _id: id,
        userId: req.user.userId,
      });

      if (!request) {
        throw ApiError.notFound('Payment request not found');
      }

      request.status = 'cancelled';
      await request.save();

      sendResponse({
        res,
        message: 'Payment request cancelled',
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }
}

