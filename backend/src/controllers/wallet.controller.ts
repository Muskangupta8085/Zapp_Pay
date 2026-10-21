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
      const { receiverAddress, symbol, amount, notes, pin } = req.body;
      const idempotencyKey =
        (req.headers['idempotency-key'] ||
          req.headers['x-idempotency-key'] ||
          req.body.idempotencyKey) as string | undefined;

      // Server-side PIN verification for funds transfer
      const { User } = await import('../models/user.model.js');
      const bcrypt = (await import('bcryptjs')).default;
      const user = await User.findById(req.user.userId).select('+transactionPinHash');

      if (!user) throw ApiError.unauthorized('User not found');

      if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
        const remainingSec = Math.ceil((user.pinLockedUntil.getTime() - Date.now()) / 1000);
        throw ApiError.forbidden(
          `Transaction PIN verification locked for ${remainingSec} seconds due to previous failed attempts.`
        );
      }

      if (user.transactionPinHash) {
        if (!pin) {
          throw ApiError.badRequest('Transaction PIN is required to authorize this transfer.');
        }

        const matches = await bcrypt.compare(String(pin).trim(), user.transactionPinHash);
        if (!matches) {
          user.pinAttemptCount = (user.pinAttemptCount || 0) + 1;
          if (user.pinAttemptCount >= 3) {
            user.pinLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
            user.pinAttemptCount = 0;
            await user.save();
            throw ApiError.forbidden(
              'Maximum incorrect PIN attempts reached. Transfers locked for 15 minutes.'
            );
          }
          await user.save();
          const rem = 3 - user.pinAttemptCount;
          throw ApiError.badRequest(`Incorrect transaction PIN. ${rem} attempt(s) remaining.`);
        }

        if (user.pinAttemptCount > 0) {
          user.pinAttemptCount = 0;
          await user.save();
        }
      }

      const tx = await TransactionService.transfer({
        senderUserId: req.user.userId,
        receiverAddress,
        symbol,
        amount: Number(amount),
        notes,
        idempotencyKey,
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

  /**
   * Authorizes and initiates fiat or crypto withdrawal with 24-hour cooling-off check,
   * server-side PIN verification, fee calculation, and atomic balance deduction.
   */
  static async withdraw(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const currentUserId = req.user.userId;
      const {
        symbol = 'INR',
        amount,
        destinationType = 'BANK',
        bankAccountId,
        upiId,
        cryptoAddress,
        pin,
      } = req.body;

      const idempotencyKey =
        (req.headers['idempotency-key'] ||
          req.headers['x-idempotency-key'] ||
          req.body.idempotencyKey) as string | undefined;

      const cleanAmount = Number(amount);
      if (!cleanAmount || cleanAmount <= 0) {
        throw ApiError.badRequest('Withdrawal amount must be greater than zero');
      }

      const { User } = await import('../models/user.model.js');
      const { Wallet } = await import('../models/wallet.model.js');
      const { Transaction } = await import('../models/transaction.model.js');
      const { LedgerEntry } = await import('../models/ledger.model.js');
      const { runInTransaction } = await import('../utils/dbTransaction.js');
      const { ENV } = await import('../config/env.js');
      const crypto = await import('crypto');

      // Check idempotency replay
      if (idempotencyKey) {
        const existingTx = await Transaction.findOne({ idempotencyKey });
        if (existingTx) {
          sendResponse({
            res,
            statusCode: 200,
            message: 'Withdrawal already processed (Idempotent)',
            data: existingTx,
          });
          return;
        }
      }

      // Check user and verify PIN
      await WalletController.verifyUserPin(currentUserId, pin);

      const user = await User.findById(currentUserId);
      if (!user) throw ApiError.unauthorized('User not found');

      // 24h Cooling-Off Security Enforcement: Block withdrawal if bank/UPI was recently modified
      if (user.payoutCoolingOffUntil && user.payoutCoolingOffUntil > new Date()) {
        const remainingHours = Math.ceil(
          (user.payoutCoolingOffUntil.getTime() - Date.now()) / (1000 * 60 * 60)
        );
        throw ApiError.forbidden(
          `Withdrawals are temporarily locked for ${remainingHours} hour(s) following recent bank/UPI modifications for account security.`
        );
      }

      const cleanSymbol = symbol.trim().toUpperCase();
      const fee = cleanSymbol === 'INR' ? (ENV.WITHDRAWAL_FEE_INR || 10) : 0;
      const totalDebit = cleanAmount + fee;

      let destinationAddress = '';
      if (destinationType === 'BANK') {
        const targetAcc = user.bankAccount?.accountNumber;
        if (!targetAcc) {
          throw ApiError.badRequest('No verified bank account linked. Please link a bank account before withdrawing.');
        }
        destinationAddress = `bank:${user.bankAccount?.bankName || 'IMPS'}:${targetAcc.slice(-4)}`;
      } else if (destinationType === 'UPI') {
        const targetUpi = upiId?.trim() || user.upiId;
        if (!targetUpi) {
          throw ApiError.badRequest('No UPI ID provided or linked.');
        }
        destinationAddress = `upi:${targetUpi}`;
      } else {
        if (!cryptoAddress?.trim()) {
          throw ApiError.badRequest('Crypto withdrawal address is required');
        }
        destinationAddress = cryptoAddress.trim();
      }

      const senderWallet = await Wallet.findOne({ userId: currentUserId });
      if (!senderWallet) throw ApiError.notFound('User wallet not found');

      const tx = await runInTransaction(async (session) => {
        // Atomic deduction of amount + fee
        const debited = await Wallet.findOneAndUpdate(
          {
            userId: currentUserId,
            balances: {
              $elemMatch: {
                symbol: cleanSymbol,
                amount: { $gte: totalDebit },
              },
            },
          },
          {
            $inc: { 'balances.$.amount': -totalDebit },
          },
          session ? { session, new: true } : { new: true }
        );

        if (!debited) {
          throw ApiError.badRequest(
            `Insufficient ${cleanSymbol} balance. Required: ${totalDebit} (Amount: ${cleanAmount} + Fee: ${fee})`
          );
        }

        const referenceId = `WDL-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

        const txData = {
          referenceId,
          idempotencyKey,
          senderId: user._id,
          senderAddress: senderWallet.walletAddress,
          receiverAddress: destinationAddress,
          symbol: cleanSymbol,
          amount: cleanAmount,
          fee,
          type: 'withdrawal' as const,
          status: 'processing' as const,
          notes: `Withdrawal of ${cleanAmount} ${cleanSymbol} to ${destinationAddress} (Fee: ₹${fee})`,
          txHash: '0x' + crypto.randomBytes(16).toString('hex'),
        };

        const [createdTx] = session
          ? await Transaction.create([txData], { session })
          : [await Transaction.create(txData)];

        // Balanced double-entry ledger record
        const ledgerData = {
          referenceId,
          transactionId: createdTx._id,
          debitAccount: `user:${user._id}:${cleanSymbol}`,
          creditAccount: `payout:${destinationType.toLowerCase()}:${destinationAddress}`,
          symbol: cleanSymbol,
          amount: cleanAmount,
          entryType: 'withdrawal' as const,
          description: `Withdrawal request: ${cleanAmount} ${cleanSymbol} to ${destinationAddress}`,
        };

        if (session) {
          await LedgerEntry.create([ledgerData], { session });
        } else {
          await LedgerEntry.create(ledgerData);
        }

        return createdTx;
      });

      sendResponse({
        res,
        statusCode: 201,
        message: 'Withdrawal request initiated successfully. Payout processing via IMPS/Bank gateway.',
        data: tx,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Accepts and pays an in-app payment request with server-side PIN verification and instant atomic settlement
   */
  static async payRequest(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const currentUserId = req.user.userId;
      const { id } = req.params;
      const { pin } = req.body;
      const idempotencyKey =
        (req.headers['idempotency-key'] ||
          req.headers['x-idempotency-key'] ||
          req.body.idempotencyKey) as string | undefined;

      const { PaymentRequest } = await import('../models/paymentRequest.model.js');
      const { Wallet } = await import('../models/wallet.model.js');
      const { Transaction } = await import('../models/transaction.model.js');
      const { LedgerEntry } = await import('../models/ledger.model.js');
      const { runInTransaction } = await import('../utils/dbTransaction.js');
      const crypto = await import('crypto');

      const request = await PaymentRequest.findById(id);
      if (!request) {
        throw ApiError.notFound('Payment request not found');
      }

      if (request.status !== 'pending') {
        throw ApiError.badRequest(`Payment request is already ${request.status}`);
      }

      if (request.userId.toString() === currentUserId) {
        throw ApiError.badRequest('Cannot pay your own payment request');
      }

      // Verify PIN
      await WalletController.verifyUserPin(currentUserId, pin);

      const cleanSymbol = request.currency === 'XCOIN' ? 'ZAP' : request.currency.toUpperCase();
      const payAmount = request.amount;

      const payerWallet = await Wallet.findOne({ userId: currentUserId });
      if (!payerWallet) throw ApiError.notFound('Payer wallet not found');

      const payeeWallet = await Wallet.findOne({ userId: request.userId });
      if (!payeeWallet) throw ApiError.notFound('Payee wallet not found');

      const tx = await runInTransaction(async (session) => {
        // Atomic deduction from payer
        const debited = await Wallet.findOneAndUpdate(
          {
            userId: currentUserId,
            balances: {
              $elemMatch: {
                symbol: cleanSymbol,
                amount: { $gte: payAmount },
              },
            },
          },
          {
            $inc: { 'balances.$.amount': -payAmount },
          },
          session ? { session, new: true } : { new: true }
        );

        if (!debited) {
          throw ApiError.badRequest(`Insufficient ${cleanSymbol} balance to fulfill this payment request.`);
        }

        // Atomic credit to payee
        let credited = await Wallet.findOneAndUpdate(
          {
            userId: request.userId,
            'balances.symbol': cleanSymbol,
          },
          {
            $inc: { 'balances.$.amount': payAmount },
          },
          session ? { session, new: true } : { new: true }
        );

        if (!credited) {
          await Wallet.findOneAndUpdate(
            { userId: request.userId },
            {
              $push: {
                balances: {
                  symbol: cleanSymbol,
                  amount: payAmount,
                  lockedAmount: 0,
                },
              },
            },
            session ? { session, new: true } : { new: true }
          );
        }

        // Update request status
        request.status = 'completed';
        if (session) {
          await request.save({ session });
        } else {
          await request.save();
        }

        const referenceId = `PAY-${request.requestId || Date.now().toString(36).toUpperCase()}`;

        const txData = {
          referenceId,
          idempotencyKey,
          senderId: currentUserId,
          receiverId: request.userId,
          senderAddress: payerWallet.walletAddress,
          receiverAddress: payeeWallet.walletAddress,
          symbol: cleanSymbol,
          amount: payAmount,
          fee: 0,
          type: 'transfer' as const,
          status: 'completed' as const,
          notes: request.note || `Paid Payment Request ${request.requestId}`,
          txHash: '0x' + crypto.randomBytes(16).toString('hex'),
        };

        const [createdTx] = session
          ? await Transaction.create([txData], { session })
          : [await Transaction.create(txData)];

        const ledgerData = {
          referenceId,
          transactionId: createdTx._id,
          debitAccount: `user:${currentUserId}:${cleanSymbol}`,
          creditAccount: `user:${request.userId}:${cleanSymbol}`,
          symbol: cleanSymbol,
          amount: payAmount,
          entryType: 'transfer' as const,
          description: `Settled payment request ${request.requestId}`,
        };

        if (session) {
          await LedgerEntry.create([ledgerData], { session });
        } else {
          await LedgerEntry.create(ledgerData);
        }

        return createdTx;
      });

      sendResponse({
        res,
        statusCode: 200,
        message: 'Payment request fulfilled and settled successfully',
        data: {
          request,
          transaction: tx,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves paginated user wallet transaction history
   */
  static async getTransactions(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const currentUserId = req.user.userId;
      const { Transaction } = await import('../models/transaction.model.js');
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const type = req.query.type as string | undefined;
      const status = req.query.status as string | undefined;
      const skip = (page - 1) * limit;

      const query: any = {
        $or: [{ senderId: currentUserId }, { receiverId: currentUserId }],
      };

      if (type && type !== 'all') {
        query.type = type.toLowerCase();
      }
      if (status && status !== 'all') {
        query.status = status.toLowerCase();
      }

      const [transactions, total] = await Promise.all([
        Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Transaction.countDocuments(query),
      ]);

      sendResponse({
        res,
        message: 'Transaction history retrieved successfully',
        data: {
          transactions,
          total,
          page,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Internal helper for uniform server-side PIN verification with 3-attempt lockout
   */
  static async verifyUserPin(userId: string, pin?: string): Promise<void> {
    const { User } = await import('../models/user.model.js');
    const bcrypt = (await import('bcryptjs')).default;
    const user = await User.findById(userId).select('+transactionPinHash');

    if (!user) throw ApiError.unauthorized('User not found');

    if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
      const remainingSec = Math.ceil((user.pinLockedUntil.getTime() - Date.now()) / 1000);
      throw ApiError.forbidden(
        `Transaction operations locked for ${remainingSec} seconds due to repeated failed PIN attempts.`
      );
    }

    if (user.transactionPinHash) {
      if (!pin) {
        throw ApiError.badRequest('Transaction PIN is required to authorize this operation.');
      }

      const matches = await bcrypt.compare(String(pin).trim(), user.transactionPinHash);
      if (!matches) {
        user.pinAttemptCount = (user.pinAttemptCount || 0) + 1;
        if (user.pinAttemptCount >= 3) {
          user.pinLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
          user.pinAttemptCount = 0;
          await user.save();
          throw ApiError.forbidden(
            'Maximum incorrect PIN attempts reached. Transaction operations locked for 15 minutes.'
          );
        }
        await user.save();
        const rem = 3 - user.pinAttemptCount;
        throw ApiError.badRequest(`Incorrect transaction PIN. ${rem} attempt(s) remaining.`);
      }

      if (user.pinAttemptCount > 0) {
        user.pinAttemptCount = 0;
        await user.save();
      }
    }
  }
}

