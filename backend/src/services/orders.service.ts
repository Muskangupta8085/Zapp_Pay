import mongoose from 'mongoose';
import { Transaction } from '../models/transaction.model.js';
import { PricingService } from './pricing.service.js';
import { ApiError } from '../utils/apiError.js';

export interface OrderFilterOptions {
  status?: string;
  type?: string;
  asset?: string;
  search?: string;
  limit?: number;
  page?: number;
}

export class OrdersService {
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
        cryptoAmount: `${isBuyOrDeposit ? '+' : '-'}${tx.amount} ${isXcoin ? 'xCoin' : 'USDT'}`,
        fiatAmount: `₹ ${fiatNumber.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        fiatNumber,
        rate: `₹ ${rateNumber.toFixed(2)} / coin`,
        status: mappedStatus,
        date: new Date(tx.createdAt || Date.now()).toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        timestamp: tx.createdAt,
        method: tx.notes || 'Instant UPI / Web3',
        txHash: tx.txHash || '0x' + tx._id.toString().slice(0, 16),
        fee: tx.fee ? `₹ ${(tx.fee * rateNumber).toFixed(2)}` : '₹ 0.00 (Zero Fee)',
        counterparty: 'Zapp Escrow Node',
      };
    });

    // Calculate aggregated metrics
    const buyVolume = orders
      .filter((o) => o.type === 'Buy' && o.status === 'Completed')
      .reduce((sum, curr) => sum + (curr.fiatNumber || 0), 0);

    const sellVolume = orders
      .filter((o) => o.type === 'Sell' && o.status === 'Completed')
      .reduce((sum, curr) => sum + (curr.fiatNumber || 0), 0);

    const completedTradesCount = orders.filter((o) => o.status === 'Completed').length;

    return {
      orders,
      total,
      summary: {
        totalBuyVolume: buyVolume,
        totalSellVolume: sellVolume,
        completedTradesCount,
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
