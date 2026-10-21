import crypto from 'crypto';
import mongoose from 'mongoose';
import { Transaction } from '../models/transaction.model.js';
import { Wallet } from '../models/wallet.model.js';
import { LedgerEntry } from '../models/ledger.model.js';
import { User } from '../models/user.model.js';
import { PricingService } from './pricing.service.js';
import { ApiError } from '../utils/apiError.js';
import { runInTransaction } from '../utils/dbTransaction.js';

export interface OrderFilterOptions {
  status?: string;
  type?: string;
  asset?: string;
  search?: string;
  limit?: number;
  page?: number;
}

export class OrdersService {
  /**
   * Executes a real Buy order with atomic balance updates, double-entry ledger, and idempotency
   */
  static async executeBuy(
    userId: string,
    data: {
      assetSymbol: string;
      payAmount: number;
      currencyMode: 'INR' | 'USDT';
      paymentMethod: string;
      idempotencyKey?: string;
    }
  ) {
    const { assetSymbol, payAmount, currencyMode, paymentMethod, idempotencyKey } = data;
    const cleanAmount = Number(payAmount);
    if (!cleanAmount || cleanAmount <= 0) {
      throw ApiError.badRequest('Purchase amount must be greater than zero');
    }

    if (idempotencyKey) {
      const existing = await Transaction.findOne({ idempotencyKey });
      if (existing) return { success: true, order: existing, alreadyProcessed: true };
    }

    const rates: any = await PricingService.getInrRates().catch(() => ({}));
    const zapPriceInr = rates.ZAP || 108.37;
    const usdtPriceInr = rates.USDT || 87.42;

    const targetSymbol = assetSymbol === 'xCoin' ? 'ZAP' : assetSymbol.toUpperCase();
    let tokensToCredit = 0;

    if (currencyMode === 'INR') {
      const price = targetSymbol === 'ZAP' ? zapPriceInr : usdtPriceInr;
      tokensToCredit = cleanAmount / price;
    } else {
      const zapPriceUsdt = zapPriceInr / usdtPriceInr;
      tokensToCredit = cleanAmount / zapPriceUsdt;
    }
    tokensToCredit = Math.round((tokensToCredit + Number.EPSILON) * 100000000) / 100000000;

    const userObjId = new mongoose.Types.ObjectId(userId);

    return await runInTransaction(async (session) => {
      const referenceId = `ORD-BUY-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      // If paying via Zapp wallet or spot vault balance, deduct payment asset atomically
      if (paymentMethod === 'wallet' || paymentMethod === 'vault') {
        const sourceDebitSymbol = currencyMode === 'INR' ? 'INR' : 'USDT';
        const debited = await Wallet.findOneAndUpdate(
          {
            userId: userObjId,
            balances: {
              $elemMatch: {
                symbol: sourceDebitSymbol,
                amount: { $gte: cleanAmount },
              },
            },
          },
          {
            $inc: { 'balances.$.amount': -cleanAmount },
          },
          session ? { session, new: true } : { new: true }
        );

        if (!debited) {
          throw ApiError.badRequest(`Insufficient ${sourceDebitSymbol} balance to execute purchase.`);
        }
      }

      // Credit purchased tokens to user wallet
      let credited = await Wallet.findOneAndUpdate(
        {
          userId: userObjId,
          'balances.symbol': targetSymbol,
        },
        {
          $inc: { 'balances.$.amount': tokensToCredit },
        },
        session ? { session, new: true } : { new: true }
      );

      if (!credited) {
        credited = await Wallet.findOneAndUpdate(
          { userId: userObjId },
          {
            $push: {
              balances: {
                symbol: targetSymbol,
                amount: tokensToCredit,
                lockedAmount: 0,
              },
            },
          },
          session ? { session, new: true } : { new: true }
        );
      }

      const txStatus =
        paymentMethod === 'wallet' || paymentMethod === 'vault' || paymentMethod === 'upi'
          ? 'completed'
          : 'processing';

      const txData = {
        referenceId,
        idempotencyKey,
        receiverId: userObjId,
        receiverAddress: `vault:${userId}`,
        symbol: targetSymbol,
        amount: tokensToCredit,
        fee: 0,
        type: 'trade' as const,
        status: txStatus as 'completed' | 'processing',
        notes: `Purchased ${tokensToCredit} ${targetSymbol} for ${currencyMode === 'INR' ? '₹' : ''}${cleanAmount} ${currencyMode} via ${paymentMethod}`,
        txHash: '0x' + crypto.randomBytes(16).toString('hex'),
      };

      const [orderTx] = session
        ? await Transaction.create([txData], { session })
        : [await Transaction.create(txData)];

      // Balanced double-entry ledger record
      const ledgerData = {
        referenceId,
        transactionId: orderTx._id,
        debitAccount: paymentMethod === 'wallet' ? `user:${userId}:${currencyMode}` : `gateway:${paymentMethod}`,
        creditAccount: `user:${userId}:${targetSymbol}`,
        symbol: targetSymbol,
        amount: tokensToCredit,
        entryType: 'trade' as const,
        description: `Buy order execution: +${tokensToCredit} ${targetSymbol}`,
      };

      if (session) {
        await LedgerEntry.create([ledgerData], { session });
      } else {
        await LedgerEntry.create(ledgerData);
      }

      return {
        success: true,
        orderId: referenceId,
        tokensReceived: tokensToCredit,
        asset: targetSymbol,
        status: txStatus,
        transaction: orderTx,
      };
    });
  }

  /**
   * Executes a real Sell order with atomic balance deductions, cooling-off check, TDS calculation, and ledger record
   */
  static async executeSell(
    userId: string,
    data: {
      assetSymbol: string;
      sellAmount: number;
      payoutMode: 'INR' | 'USDT';
      bankAccountId?: string;
      upiId?: string;
      idempotencyKey?: string;
    }
  ) {
    const { assetSymbol, sellAmount, payoutMode, idempotencyKey } = data;
    const cleanAmount = Number(sellAmount);
    if (!cleanAmount || cleanAmount <= 0) {
      throw ApiError.badRequest('Sell amount must be greater than zero');
    }

    if (idempotencyKey) {
      const existing = await Transaction.findOne({ idempotencyKey });
      if (existing) return { success: true, order: existing, alreadyProcessed: true };
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const user = await User.findById(userObjId);
    if (!user) throw ApiError.unauthorized('User not found');

    // Cooling-off check: block payout if bank/UPI was recently modified
    if (user.payoutCoolingOffUntil && user.payoutCoolingOffUntil > new Date()) {
      const remainingHours = Math.ceil((user.payoutCoolingOffUntil.getTime() - Date.now()) / (1000 * 60 * 60));
      throw ApiError.forbidden(
        `Withdrawals and sell payouts are temporarily locked for ${remainingHours} hour(s) following recent bank/UPI modifications for account security.`
      );
    }

    const rates: any = await PricingService.getInrRates().catch(() => ({}));
    const zapPriceInr = rates.ZAP || 108.37;
    const usdtPriceInr = rates.USDT || 87.42;

    const targetSymbol = assetSymbol === 'xCoin' ? 'ZAP' : assetSymbol.toUpperCase();
    const rateNumber = targetSymbol === 'ZAP' ? zapPriceInr : usdtPriceInr;

    const grossFiat = cleanAmount * rateNumber;
    const tds = grossFiat * 0.01; // 1% Indian TDS
    const fee = grossFiat * 0.002; // 0.2% fee
    const netPayout = payoutMode === 'INR' ? Math.max(0, grossFiat - tds - fee) : cleanAmount * (zapPriceInr / usdtPriceInr);

    return await runInTransaction(async (session) => {
      // 1. Atomic deduction of selling asset
      const debited = await Wallet.findOneAndUpdate(
        {
          userId: userObjId,
          balances: {
            $elemMatch: {
              symbol: targetSymbol,
              amount: { $gte: cleanAmount },
            },
          },
        },
        {
          $inc: { 'balances.$.amount': -cleanAmount },
        },
        session ? { session, new: true } : { new: true }
      );

      if (!debited) {
        throw ApiError.badRequest(`Insufficient ${targetSymbol} balance to execute sell order.`);
      }

      // If payout is in USDT, credit to spot USDT vault directly
      if (payoutMode === 'USDT') {
        const credited = await Wallet.findOneAndUpdate(
          {
            userId: userObjId,
            'balances.symbol': 'USDT',
          },
          {
            $inc: { 'balances.$.amount': netPayout },
          },
          session ? { session, new: true } : { new: true }
        );

        if (!credited) {
          await Wallet.findOneAndUpdate(
            { userId: userObjId },
            {
              $push: {
                balances: {
                  symbol: 'USDT',
                  amount: netPayout,
                  lockedAmount: 0,
                },
              },
            },
            session ? { session, new: true } : { new: true }
          );
        }
      }

      const referenceId = `ORD-SELL-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      const txData = {
        referenceId,
        idempotencyKey,
        senderId: userObjId,
        receiverAddress: user.bankAccount?.accountNumber
          ? `bank:${user.bankAccount.accountNumber.slice(-4)}`
          : (user.upiId || 'payout:inr'),
        symbol: targetSymbol,
        amount: cleanAmount,
        fee: Math.round((tds + fee) * 100) / 100,
        type: 'trade' as const,
        status: payoutMode === 'USDT' ? ('completed' as const) : ('processing' as const),
        notes: `Sold ${cleanAmount} ${targetSymbol} for ${payoutMode === 'INR' ? '₹' : ''}${netPayout.toFixed(2)} ${payoutMode} (TDS 1%: ₹${tds.toFixed(2)})`,
        txHash: '0x' + crypto.randomBytes(16).toString('hex'),
      };

      const [orderTx] = session
        ? await Transaction.create([txData], { session })
        : [await Transaction.create(txData)];

      // Ledger entry
      const ledgerData = {
        referenceId,
        transactionId: orderTx._id,
        debitAccount: `user:${userId}:${targetSymbol}`,
        creditAccount: payoutMode === 'USDT' ? `user:${userId}:USDT` : `payout:imps:bank`,
        symbol: targetSymbol,
        amount: cleanAmount,
        entryType: 'trade' as const,
        description: `Sell order execution: -${cleanAmount} ${targetSymbol}, net payout ${netPayout.toFixed(2)} ${payoutMode}`,
      };

      if (session) {
        await LedgerEntry.create([ledgerData], { session });
      } else {
        await LedgerEntry.create(ledgerData);
      }

      return {
        success: true,
        orderId: referenceId,
        soldTokens: cleanAmount,
        netPayout: Math.round(netPayout * 100) / 100,
        payoutMode,
        tdsDeducted: Math.round(tds * 100) / 100,
        status: payoutMode === 'USDT' ? 'completed' : 'processing',
        transaction: orderTx,
      };
    });
  }

  static async getOrders(userId: string, options: OrderFilterOptions = {}) {
    const userObjId = new mongoose.Types.ObjectId(userId);
    const query: any = {
      $or: [{ senderId: userObjId }, { receiverId: userObjId }],
    };

    if (options.status && options.status !== 'All') {
      const statusLower = options.status.toLowerCase();
      if (statusLower === 'processing') {
        query.status = { $in: ['pending', 'processing'] };
      } else {
        query.status = statusLower;
      }
    }

    if (options.type && options.type !== 'All') {
      query.type = options.type.toLowerCase();
    }

    if (options.asset && options.asset !== 'ALL') {
      const assetUpper = options.asset === 'xCoin' ? 'ZAP' : options.asset.toUpperCase();
      query.symbol = { $in: [assetUpper, options.asset] };
    }

    const limit = options.limit || 50;
    const skip = ((options.page || 1) - 1) * limit;

    const [txs, total] = await Promise.all([
      Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Transaction.countDocuments(query),
    ]);

    const rates: Record<string, number> = (await PricingService.getInrRates().catch(() => ({}))) as any;
    const xCoinRate = rates.ZAP || 108.37;
    const usdtRate = rates.USDT || 87.42;

    const orders = txs.map((tx: any) => {
      const isBuyOrDeposit =
        tx.type === 'buy' ||
        tx.type === 'deposit' ||
        (tx.receiverId && tx.receiverId.toString() === userId);
      const isXcoin = tx.symbol === 'ZAP' || tx.symbol === 'xCoin';
      const rateNumber = isXcoin ? xCoinRate : usdtRate;
      const fiatNumber = (tx.amount || 0) * rateNumber;

      let mappedStatus: 'Completed' | 'Processing' | 'Cancelled' = 'Completed';
      if (tx.status === 'pending' || tx.status === 'processing') {
        mappedStatus = 'Processing';
      } else if (tx.status === 'cancelled' || tx.status === 'failed') {
        mappedStatus = 'Cancelled';
      }

      return {
        id: tx.referenceId || `ORD-${tx._id.toString().slice(-6).toUpperCase()}`,
        rawId: tx._id.toString(),
        type: isBuyOrDeposit ? 'Buy' : 'Sell',
        token: isXcoin ? 'xCoin' : 'USDT',
        amount: tx.amount,
        rate: rateNumber,
        fiatAmount: fiatNumber.toFixed(2),
        status: mappedStatus,
        method: tx.notes || 'Instant UPI / Web3',
        txHash: tx.txHash,
        senderAddress: tx.senderAddress,
        receiverAddress: tx.receiverAddress,
        createdAt: tx.createdAt,
      };
    });

    const buyCount = orders.filter((o: any) => o.type === 'Buy').length;
    const sellCount = orders.filter((o: any) => o.type === 'Sell').length;
    const totalVolume = orders.reduce((sum: number, o: any) => sum + parseFloat(o.fiatAmount || '0'), 0);

    return {
      orders,
      total,
      summary: {
        totalOrders: total,
        buyOrders: buyCount,
        sellOrders: sellCount,
        totalVolume: `₹ ${totalVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      },
    };
  }

  static async getOrderById(userId: string, orderId: string) {
    const userObjId = new mongoose.Types.ObjectId(userId);
    const query: any = {
      $or: [{ _id: mongoose.isValidObjectId(orderId) ? orderId : undefined }, { referenceId: orderId }],
      $and: [{ $or: [{ senderId: userObjId }, { receiverId: userObjId }] }],
    };

    const tx = await Transaction.findOne(query).lean();
    if (!tx) {
      throw ApiError.notFound('Order not found or access denied');
    }

    const rates: Record<string, number> = (await PricingService.getInrRates().catch(() => ({}))) as any;
    const isXcoin = tx.symbol === 'ZAP' || tx.symbol === 'xCoin';
    const rateNumber = isXcoin ? (rates.ZAP || 108.37) : (rates.USDT || 87.42);

    return {
      id: tx.referenceId || `ORD-${tx._id.toString().slice(-6).toUpperCase()}`,
      rawId: tx._id.toString(),
      type: (tx.type as string) === 'buy' || tx.type === 'deposit' ? 'Buy' : 'Sell',
      token: isXcoin ? 'xCoin' : 'USDT',
      amount: tx.amount,
      rate: rateNumber,
      fiatAmount: (tx.amount * rateNumber).toFixed(2),
      status: tx.status,
      method: tx.notes || 'Instant UPI / Web3',
      txHash: tx.txHash,
      senderAddress: tx.senderAddress,
      receiverAddress: tx.receiverAddress,
      createdAt: tx.createdAt,
    };
  }

  static async cancelOrder(userId: string, orderId: string) {
    const userObjId = new mongoose.Types.ObjectId(userId);
    const query: any = {
      $or: [{ _id: mongoose.isValidObjectId(orderId) ? orderId : undefined }, { referenceId: orderId }],
      $and: [{ $or: [{ senderId: userObjId }, { receiverId: userObjId }] }],
      status: { $in: ['pending', 'processing'] },
    };

    const updated = await Transaction.findOneAndUpdate(
      query,
      { status: 'cancelled' },
      { new: true }
    );

    if (!updated) {
      throw ApiError.badRequest('Order cannot be cancelled or has already been finalized.');
    }

    return {
      success: true,
      message: 'Escrow order successfully cancelled.',
      order: updated,
    };
  }

  static async exportOrders(userId: string, format: 'PDF' | 'CSV', range: string) {
    const { orders } = await this.getOrders(userId, { limit: 200 });
    return {
      format,
      range,
      generatedAt: new Date().toISOString(),
      recordCount: orders.length,
      orders,
    };
  }
}
