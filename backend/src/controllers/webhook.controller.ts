import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { ProcessedWebhook } from '../models/processedWebhook.model.js';
import { Transaction } from '../models/transaction.model.js';
import { Wallet } from '../models/wallet.model.js';
import { LedgerEntry } from '../models/ledger.model.js';
import { ENV } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { runInTransaction } from '../utils/dbTransaction.js';

export class WebhookController {
  /**
   * Secure payment provider webhook handler with HMAC-SHA256 signature verification & replay attack idempotency
   */
  static async handlePaymentWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = (req.headers['x-webhook-signature'] ||
        req.headers['x-razorpay-signature'] ||
        req.headers['x-signature']) as string | undefined;

      const secret = ENV.WEBHOOK_SECRET || 'dev_webhook_signing_secret_key_32bytes';

      // 1. Signature Verification
      if (!signature) {
        throw ApiError.unauthorized('Missing webhook signature header');
      }

      const rawPayload = JSON.stringify(req.body);
      const computedHash = crypto.createHmac('sha256', secret).update(rawPayload).digest('hex');

      // Timing safe comparison to prevent timing attacks
      const signatureValid =
        signature.length === computedHash.length &&
        crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedHash));

      if (!signatureValid) {
        throw ApiError.forbidden('Invalid webhook cryptographic signature');
      }

      const { eventId, eventType, provider = 'payment_gateway', data } = req.body;
      const cleanEventId = (eventId || data?.referenceId || data?.id || '').trim();

      if (!cleanEventId) {
        throw ApiError.badRequest('Webhook payload missing unique eventId / reference identifier');
      }

      // 2. Replay Protection: Check if this event was already processed
      const payloadHash = crypto.createHash('sha256').update(rawPayload).digest('hex');
      const alreadyProcessed = await ProcessedWebhook.findOne({ eventId: cleanEventId });

      if (alreadyProcessed) {
        // Return 200 OK as required by webhook specifications so provider doesn't retry
        res.status(200).json({
          success: true,
          message: 'Webhook duplicate event ignored (Already processed)',
          eventId: cleanEventId,
        });
        return;
      }

      // 3. Process Deposit Confirmation
      if (eventType === 'deposit.success' || eventType === 'payment.captured') {
        const { userId, amount, currency = 'INR', referenceId, utr } = data;
        const cleanAmount = Number(amount);

        if (!userId || !cleanAmount || cleanAmount <= 0) {
          throw ApiError.badRequest('Invalid deposit details in webhook payload');
        }

        const userObjId = new mongoose.Types.ObjectId(userId);
        const cleanSymbol = (currency || 'INR').toUpperCase();

        await runInTransaction(async (session) => {
          // Atomic credit to user's wallet
          let credited = await Wallet.findOneAndUpdate(
            { userId: userObjId, 'balances.symbol': cleanSymbol },
            { $inc: { 'balances.$.amount': cleanAmount } },
            session ? { session, new: true } : { new: true }
          );

          if (!credited) {
            credited = await Wallet.findOneAndUpdate(
              { userId: userObjId },
              {
                $push: {
                  balances: { symbol: cleanSymbol, amount: cleanAmount, lockedAmount: 0 },
                },
              },
              session ? { session, new: true } : { new: true }
            );
          }

          const txRef = referenceId || `DEP-${Date.now().toString(36).toUpperCase()}`;

          // Update existing pending transaction or create a new completed record
          let tx = session
            ? await Transaction.findOne({ referenceId: txRef }).session(session)
            : await Transaction.findOne({ referenceId: txRef });

          if (tx) {
            if (tx.status !== 'completed') {
              tx.status = 'completed';
              tx.txHash = utr || `GATEWAY-${cleanEventId}`;
              if (session) {
                await tx.save({ session });
              } else {
                await tx.save();
              }
            }
          } else {
            const txData = {
              referenceId: txRef,
              receiverId: userObjId,
              receiverAddress: `wallet:${userId}`,
              symbol: cleanSymbol,
              amount: cleanAmount,
              fee: 0,
              type: 'deposit' as const,
              status: 'completed' as const,
              notes: `Verified Deposit via ${provider}. Ref: ${cleanEventId}`,
              txHash: utr || `GATEWAY-${cleanEventId}`,
            };

            const [newTx] = session
              ? await Transaction.create([txData], { session })
              : [await Transaction.create(txData)];
            tx = newTx;
          }

          // Balanced Double-Entry Ledger Record
          const ledgerData = {
            referenceId: txRef,
            transactionId: tx._id,
            debitAccount: `gateway:${provider}:nodal`,
            creditAccount: `user:${userId}:${cleanSymbol}`,
            symbol: cleanSymbol,
            amount: cleanAmount,
            entryType: 'deposit' as const,
            description: `Verified gateway deposit settlement (${provider})`,
          };

          if (session) {
            await LedgerEntry.create([ledgerData], { session });
          } else {
            await LedgerEntry.create(ledgerData);
          }

          // Mark event as processed in the database
          const webhookRecord = {
            eventId: cleanEventId,
            provider,
            eventType,
            payloadHash,
          };

          if (session) {
            await ProcessedWebhook.create([webhookRecord], { session });
          } else {
            await ProcessedWebhook.create(webhookRecord);
          }
        });
      } else {
        // Record non-financial event as processed
        await ProcessedWebhook.create({
          eventId: cleanEventId,
          provider,
          eventType,
          payloadHash,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        eventId: cleanEventId,
      });
    } catch (error) {
      next(error);
    }
  }
}
