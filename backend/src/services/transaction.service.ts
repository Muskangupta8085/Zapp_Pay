import crypto from 'crypto';
import mongoose from 'mongoose';
import { Transaction, ITransaction } from '../models/transaction.model.js';
import { Wallet } from '../models/wallet.model.js';
import { ApiError } from '../utils/apiError.js';

export class TransactionService {
  static async transfer(data: {
    senderUserId: string;
    receiverAddress: string;
    symbol: string;
    amount: number;
    notes?: string;
  }): Promise<ITransaction> {
    const { senderUserId, receiverAddress, symbol, amount, notes } = data;

    if (amount <= 0) {
      throw ApiError.badRequest('Amount must be greater than zero');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const senderWallet = await Wallet.findOne({ userId: senderUserId }).session(session);
      if (!senderWallet) {
        throw ApiError.notFound('Sender wallet not found');
      }

      const balanceItem = senderWallet.balances.find(
        (b) => b.symbol.toUpperCase() === symbol.toUpperCase()
      );
      if (!balanceItem || balanceItem.amount < amount) {
        throw ApiError.badRequest(`Insufficient ${symbol} balance`);
      }

      const receiverWallet = await Wallet.findOne({ walletAddress: receiverAddress }).session(session);
      if (!receiverWallet) {
        throw ApiError.notFound('Recipient wallet address not found');
      }

      if (senderWallet.walletAddress === receiverAddress) {
        throw ApiError.badRequest('Cannot send funds to your own address');
      }

      // Deduct sender balance
      balanceItem.amount -= amount;

      // Credit receiver balance
      let recBalanceItem = receiverWallet.balances.find(
        (b) => b.symbol.toUpperCase() === symbol.toUpperCase()
      );
      if (!recBalanceItem) {
        receiverWallet.balances.push({
          symbol: symbol.toUpperCase(),
          amount: amount,
          lockedAmount: 0,
        });
      } else {
        recBalanceItem.amount += amount;
      }

      await senderWallet.save({ session });
      await receiverWallet.save({ session });

      const referenceId = 'TX_' + crypto.randomBytes(8).toString('hex').toUpperCase();

      const [tx] = await Transaction.create(
        [
          {
            referenceId,
            senderId: senderWallet.userId,
            receiverId: receiverWallet.userId,
            senderAddress: senderWallet.walletAddress,
            receiverAddress,
            symbol: symbol.toUpperCase(),
            amount,
            fee: 0,
            type: 'transfer',
            status: 'completed',
            notes,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return tx;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getUserTransactions(userId: string): Promise<ITransaction[]> {
    return Transaction.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(50);
  }
}
