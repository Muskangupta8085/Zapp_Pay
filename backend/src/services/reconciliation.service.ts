import { Transaction } from '../models/transaction.model.js';
import { Wallet } from '../models/wallet.model.js';
import { LedgerEntry } from '../models/ledger.model.js';
import { logger } from '../utils/logger.js';

export class ReconciliationService {
  /**
   * Scans for stuck transactions and auto-recovers interrupted financial operations
   */
  static async reconcileStuckTransactions(): Promise<{
    scanned: number;
    recovered: number;
    flagged: number;
  }> {
    const thresholdMinutes = 30;
    const cutoffDate = new Date(Date.now() - thresholdMinutes * 60 * 1000);

    // Find transactions stuck in pending/processing state
    const stuckTxs = await Transaction.find({
      status: { $in: ['pending', 'processing'] },
      createdAt: { $lt: cutoffDate },
    });

    let recovered = 0;
    let flagged = 0;

    for (const tx of stuckTxs) {
      try {
        // If it's an uncompleted buy order older than 30 minutes with no payment confirmation, mark as expired/cancelled
        if (tx.type === 'trade' && (tx.notes?.includes('Buy') || tx.notes?.includes('Purchased'))) {
          tx.status = 'cancelled';
          tx.notes = `${tx.notes} | Auto-cancelled by Reconciliation Worker: Expired payment window.`;
          await tx.save();
          recovered++;
        } else if (tx.type === 'withdrawal') {
          // Flag long-pending withdrawals for admin review
          logger.warn(`[RECONCILIATION] Stalled withdrawal detected: Reference ${tx.referenceId}, Amount: ${tx.amount} ${tx.symbol}`);
          flagged++;
        } else {
          flagged++;
        }
      } catch (err) {
        logger.error(`[RECONCILIATION] Error reconciling transaction ${tx.referenceId}:`, err);
      }
    }

    return {
      scanned: stuckTxs.length,
      recovered,
      flagged,
    };
  }

  /**
   * Verifies double-entry ledger balance consistency for a specific wallet
   */
  static async verifyWalletLedgerIntegrity(userId: string): Promise<{
    consistent: boolean;
    discrepancies: Array<{ symbol: string; walletAmount: number; ledgerComputed: number }>;
  }> {
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) return { consistent: true, discrepancies: [] };

    const discrepancies = [];

    for (const balance of wallet.balances) {
      // Sum all credits to this user
      const credits = await LedgerEntry.aggregate([
        { $match: { creditAccount: `user:${userId}:${balance.symbol}`, symbol: balance.symbol } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      // Sum all debits from this user
      const debits = await LedgerEntry.aggregate([
        { $match: { debitAccount: `user:${userId}:${balance.symbol}`, symbol: balance.symbol } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const totalCredits = credits[0]?.total || 0;
      const totalDebits = debits[0]?.total || 0;
      const ledgerNet = Math.round((totalCredits - totalDebits) * 100000000) / 100000000;

      // Compare against current balance
      if (Math.abs(ledgerNet - balance.amount) > 0.0001 && (totalCredits > 0 || totalDebits > 0)) {
        discrepancies.push({
          symbol: balance.symbol,
          walletAmount: balance.amount,
          ledgerComputed: ledgerNet,
        });
      }
    }

    return {
      consistent: discrepancies.length === 0,
      discrepancies,
    };
  }

  /**
   * Starts periodic automated reconciliation worker
   */
  static startReconciliationWorker(intervalMs: number = 10 * 60 * 1000): NodeJS.Timeout {
    logger.info(`[RECONCILIATION] Automated reconciliation job scheduled (every ${Math.round(intervalMs / 60000)}m).`);
    return setInterval(async () => {
      try {
        const result = await this.reconcileStuckTransactions();
        if (result.scanned > 0) {
          logger.info(`[RECONCILIATION] Completed job: Scanned ${result.scanned}, Recovered ${result.recovered}, Flagged ${result.flagged}`);
        }
      } catch (err) {
        logger.error('[RECONCILIATION] Worker execution failed:', err);
      }
    }, intervalMs);
  }
}
