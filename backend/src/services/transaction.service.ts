import crypto from 'crypto';
import mongoose from 'mongoose';
import { Transaction, ITransaction } from '../models/transaction.model.js';
import { Wallet } from '../models/wallet.model.js';
import { LedgerEntry } from '../models/ledger.model.js';
import { ApiError } from '../utils/apiError.js';
import { runInTransaction } from '../utils/dbTransaction.js';

export class TransactionService {
  /**
   * Executes atomic wallet transfer with concurrency control, idempotency, and double-entry ledger record
   */
  static async transfer(data: {
    senderUserId: string;
    receiverAddress: string;
    symbol: string;
    amount: number;
    notes?: string;
    idempotencyKey?: string;
  }): Promise<ITransaction> {
    const { senderUserId, receiverAddress, symbol, notes, idempotencyKey } = data;
    const cleanSymbol = symbol.trim().toUpperCase();
    const cleanAmount = Math.round((Number(data.amount) + Number.EPSILON) * 100000000) / 100000000;

    if (cleanAmount <= 0 || isNaN(cleanAmount)) {
      throw ApiError.badRequest('Amount must be greater than zero');
    }

    // Check for existing transaction if idempotency key provided
    if (idempotencyKey) {
      const existingTx = await Transaction.findOne({ idempotencyKey });
      if (existingTx) {
        return existingTx;
      }
    }

    let receiverWallet = await Wallet.findOne({ walletAddress: receiverAddress });
    if (!receiverWallet) {
      const { User } = await import('../models/user.model.js');
      const cleanTarget = receiverAddress.trim();
      const matchedUser = await User.findOne({
        $or: [
          { phone: cleanTarget },
          { email: cleanTarget.toLowerCase() },
          { upiId: cleanTarget.toLowerCase() },
          { referralCode: cleanTarget.toUpperCase() },
        ],
      });
      if (matchedUser) {
        receiverWallet = await Wallet.findOne({ userId: matchedUser._id });
      }
    }

    if (!receiverWallet) {
      throw ApiError.notFound('Recipient wallet address, phone, email, or UPI ID not found');
    }

    const senderWallet = await Wallet.findOne({ userId: senderUserId });
    if (!senderWallet) {
      throw ApiError.notFound('Sender wallet not found');
    }

    if (
      senderWallet.walletAddress === receiverWallet.walletAddress ||
      senderWallet.userId.toString() === receiverWallet.userId.toString()
    ) {
      throw ApiError.badRequest('Cannot send funds to your own account');
    }

    const resolvedReceiverAddress = receiverWallet.walletAddress;

    // Use universal database transaction runner (replica sets + standalone fallback)
    return await runInTransaction(async (session) => {
      // 1. Atomic conditional debit check-and-decrement
      // Guarantees balance never goes negative and eliminates race conditions
      const debitedWallet = await Wallet.findOneAndUpdate(
        {
          userId: senderUserId,
          balances: {
            $elemMatch: {
              symbol: cleanSymbol,
              amount: { $gte: cleanAmount },
            },
          },
        },
        {
          $inc: { 'balances.$.amount': -cleanAmount },
        },
        session ? { session, new: true } : { new: true }
      );

      if (!debitedWallet) {
        throw ApiError.badRequest(`Insufficient ${cleanSymbol} balance`);
      }

      // 2. Atomic credit to recipient wallet
      let creditedWallet = await Wallet.findOneAndUpdate(
        {
          walletAddress: resolvedReceiverAddress,
          'balances.symbol': cleanSymbol,
        },
        {
          $inc: { 'balances.$.amount': cleanAmount },
        },
        session ? { session, new: true } : { new: true }
      );

      if (!creditedWallet) {
        // Push symbol entry if recipient doesn't hold it yet
        creditedWallet = await Wallet.findOneAndUpdate(
          {
            walletAddress: resolvedReceiverAddress,
          },
          {
            $push: {
              balances: {
                symbol: cleanSymbol,
                amount: cleanAmount,
                lockedAmount: 0,
              },
            },
          },
          session ? { session, new: true } : { new: true }
        );
      }

      const referenceId = 'TX_' + crypto.randomBytes(8).toString('hex').toUpperCase();

      // 3. Create completed Transaction record
      const txPayload = {
        referenceId,
        idempotencyKey,
        senderId: senderWallet.userId,
        receiverId: receiverWallet.userId,
        senderAddress: senderWallet.walletAddress,
        receiverAddress: resolvedReceiverAddress,
        symbol: cleanSymbol,
        amount: cleanAmount,
        fee: 0,
        type: 'transfer' as const,
        status: 'completed' as const,
        notes,
        txHash: '0x' + crypto.randomBytes(16).toString('hex'),
      };

      const [tx] = session
        ? await Transaction.create([txPayload], { session })
        : [await Transaction.create(txPayload)];

      // 4. Create immutable Double-Entry Ledger record
      const ledgerPayload = {
        referenceId,
        transactionId: tx._id,
        debitAccount: `user:${senderUserId}`,
        creditAccount: `user:${receiverWallet.userId}`,
        symbol: cleanSymbol,
        amount: cleanAmount,
        entryType: 'transfer' as const,
        description: notes || `Direct transfer of ${cleanAmount} ${cleanSymbol}`,
      };

      if (session) {
        await LedgerEntry.create([ledgerPayload], { session });
      } else {
        await LedgerEntry.create(ledgerPayload);
      }

      return tx;
    });
  }

  static async getUserTransactions(userId: string): Promise<ITransaction[]> {
    return Transaction.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(50);
  }
}
