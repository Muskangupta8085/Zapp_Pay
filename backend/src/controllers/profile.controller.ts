import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { BankAccount } from '../models/bankAccount.model.js';
import { SupportTicket } from '../models/supportTicket.model.js';
import { OtpService } from '../services/otp.service.js';
import { ApiError } from '../utils/apiError.js';

export class ProfileController {
  static async getBankAccounts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      let accounts = await BankAccount.find({ userId }).sort({ isDefault: -1, createdAt: -1 });

      // If no accounts yet, seed from User model if available
      if (accounts.length === 0) {
        const user = await User.findById(userId);
        if (user?.bankAccount?.accountNumber) {
          const seeded = await BankAccount.create({
            userId,
            type: 'BANK',
            accountHolderName: user.bankAccount.accountHolderName || user.fullName,
            accountNumber: user.bankAccount.accountNumber,
            ifsc: user.bankAccount.ifsc || 'HDFC0000001',
            bankName: user.bankAccount.bankName || 'Primary Bank',
            isDefault: true,
            isVerified: true,
          });
          accounts.push(seeded);
        }
        if (user?.upiId) {
          const seededUpi = await BankAccount.create({
            userId,
            type: 'UPI',
            upiId: user.upiId,
            isDefault: accounts.length === 0,
            isVerified: true,
          });
          accounts.push(seededUpi);
        }
      }

      res.status(200).json({ success: true, data: accounts });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to fetch bank accounts' });
    }
  }

  static async addBankAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { type, accountHolderName, accountNumber, ifsc, bankName, upiId, isDefault } = req.body;

      if (type === 'BANK') {
        if (!accountNumber || !ifsc || !bankName) {
          res.status(400).json({ success: false, message: 'Account number, IFSC and Bank name are required.' });
          return;
        }
      } else if (type === 'UPI') {
        if (!upiId) {
          res.status(400).json({ success: false, message: 'UPI ID is required.' });
          return;
        }
      } else {
        res.status(400).json({ success: false, message: 'Invalid payment method type. Must be BANK or UPI.' });
        return;
      }

      const existingCount = await BankAccount.countDocuments({ userId });
      const makeDefault = isDefault || existingCount === 0;

      if (makeDefault) {
        await BankAccount.updateMany({ userId }, { isDefault: false });
      }

      const newAccount = await BankAccount.create({
        userId,
        type: type || 'BANK',
        accountHolderName: accountHolderName?.trim(),
        accountNumber: accountNumber?.trim(),
        ifsc: ifsc?.trim().toUpperCase(),
        bankName: bankName?.trim(),
        upiId: upiId?.trim().toLowerCase(),
        isDefault: makeDefault,
        isVerified: true,
      });

      // Also sync to User profile for fast reference
      if (type === 'BANK') {
        await User.findByIdAndUpdate(userId, {
          bankAccount: {
            accountNumber: accountNumber.trim(),
            ifsc: ifsc.trim().toUpperCase(),
            bankName: bankName.trim(),
            accountHolderName: accountHolderName?.trim(),
            isVerified: true,
          },
        });
      } else if (type === 'UPI') {
        await User.findByIdAndUpdate(userId, {
          upiId: upiId.trim().toLowerCase(),
        });
      }

      res.status(201).json({
        success: true,
        message: 'Account linked successfully.',
        data: newAccount,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to link account' });
    }
  }

  static async setDefaultBankAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      await BankAccount.updateMany({ userId }, { isDefault: false });
      const updated = await BankAccount.findOneAndUpdate(
        { _id: id, userId },
        { isDefault: true },
        { new: true }
      );

      if (!updated) {
        res.status(404).json({ success: false, message: 'Bank account not found' });
        return;
      }

      res.status(200).json({ success: true, message: 'Primary settlement account updated', data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to update default account' });
    }
  }

  static async deleteBankAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      const deleted = await BankAccount.findOneAndDelete({ _id: id, userId });
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Bank account not found' });
        return;
      }

      // If the deleted account was default, set another one as default
      if (deleted.isDefault) {
        const remaining = await BankAccount.findOne({ userId });
        if (remaining) {
          remaining.isDefault = true;
          await remaining.save();
        }
      }

      res.status(200).json({ success: true, message: 'Account removed successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to remove account' });
    }
  }

  static async requestPinResetOtp(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const identifier = user.phone || user.email;
      if (!identifier) {
        res.status(400).json({ success: false, message: 'No phone or email associated with this account' });
        return;
      }

      const otpResult = await OtpService.requestOtp(identifier, 'pin_change');
      res.status(200).json({
        success: true,
        message: 'Security PIN reset code sent to your registered contact.',
        data: otpResult,
      });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to send PIN reset code',
      });
    }
  }

  static async setTransactionPin(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { pin, otpCode, currentPin } = req.body;

      if (!pin || !/^\d{6}$/.test(pin)) {
        res.status(400).json({ success: false, message: 'PIN must be exactly 6 numeric digits' });
        return;
      }

      const user = await User.findById(userId).select('+transactionPinHash');
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // If user already has PIN and didn't provide OTP, verify currentPin
      if (user.transactionPinHash && !otpCode) {
        if (!currentPin) {
          res.status(400).json({ success: false, message: 'Current PIN or authorization OTP is required to change PIN' });
          return;
        }
        const matches = await bcrypt.compare(currentPin, user.transactionPinHash);
        if (!matches) {
          res.status(400).json({ success: false, message: 'Incorrect current PIN' });
          return;
        }
      } else if (otpCode) {
        const identifier = user.phone || user.email;
        if (!identifier) {
          res.status(400).json({ success: false, message: 'No contact identifier linked for OTP verification' });
          return;
        }
        await OtpService.verifyOtp(identifier, otpCode, 'pin_change');
      }

      const hashedPin = await bcrypt.hash(pin, 10);
      user.transactionPinHash = hashedPin;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Transaction security PIN configured successfully.',
      });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Failed to update transaction PIN',
      });
    }
  }

  static async verifyTransactionPin(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { pin } = req.body;

      const user = await User.findById(userId).select('+transactionPinHash');
      if (!user || !user.transactionPinHash) {
        // If PIN is not yet set, accept or prompt
        res.status(200).json({ success: true, verified: true, hasPin: false });
        return;
      }

      const matches = await bcrypt.compare(pin, user.transactionPinHash);
      if (!matches) {
        res.status(400).json({ success: false, verified: false, message: 'Incorrect transaction PIN' });
        return;
      }

      res.status(200).json({ success: true, verified: true, hasPin: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Verification failed' });
    }
  }

  static async updateSecurityPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { biometricEnabled, notificationPreferences } = req.body;

      const updateData: any = {};
      if (typeof biometricEnabled === 'boolean') updateData.biometricEnabled = biometricEnabled;
      if (notificationPreferences) updateData.notificationPreferences = notificationPreferences;

      const updated = await User.findByIdAndUpdate(userId, updateData, { new: true });
      res.status(200).json({
        success: true,
        message: 'Security preferences updated.',
        data: {
          biometricEnabled: updated?.biometricEnabled,
          notificationPreferences: updated?.notificationPreferences,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to update preferences' });
    }
  }

  static async submitSupportTicket(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { subject, category, message, priority } = req.body;

      if (!subject || !message) {
        res.status(400).json({ success: false, message: 'Subject and message are required' });
        return;
      }

      const ticketId = `TKT-${Date.now().toString().slice(-6)}`;
      const ticket = await SupportTicket.create({
        ticketId,
        userId,
        subject: subject.trim(),
        category: category || 'General Query',
        message: message.trim(),
        priority: priority || 'Medium',
        status: 'Open',
      });

      res.status(201).json({
        success: true,
        message: `Support ticket #${ticketId} created. An agent will respond shortly.`,
        data: ticket,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to submit ticket' });
    }
  }

  static async getSupportTickets(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const tickets = await SupportTicket.find({ userId }).sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: tickets });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to fetch tickets' });
    }
  }
}
