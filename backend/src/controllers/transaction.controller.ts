import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { TransactionService } from '../services/transaction.service.js';
import { sendResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

export class TransactionController {
  static async getMyTransactions(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const transactions = await TransactionService.getUserTransactions(req.user.userId);
      sendResponse({
        res,
        message: 'Transactions retrieved successfully',
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }
}
