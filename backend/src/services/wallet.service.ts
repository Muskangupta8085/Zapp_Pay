import { Wallet, IWallet } from '../models/wallet.model.js';
import { ApiError } from '../utils/apiError.js';

export class WalletService {
  static async getWalletByUserId(userId: string): Promise<IWallet> {
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      throw ApiError.notFound('Wallet not found for this user');
    }
    return wallet;
  }

  static async getBalance(userId: string, symbol: string): Promise<number> {
    const wallet = await this.getWalletByUserId(userId);
    const item = wallet.balances.find((b) => b.symbol.toUpperCase() === symbol.toUpperCase());
    return item ? item.amount : 0;
  }
}
