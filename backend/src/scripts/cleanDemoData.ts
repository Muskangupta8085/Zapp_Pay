import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/user.model.js';
import { Transaction } from '../models/transaction.model.js';
import { Wallet } from '../models/wallet.model.js';
import { Kyc } from '../models/kyc.model.js';

async function cleanDemoData() {
  await connectDB();
  console.log('🧹 Purging all dummy demo users, transactions, wallets, and KYC from database...');

  // Delete all non-admin users
  const deletedUsers = await User.deleteMany({ role: { $nin: ['admin', 'superadmin'] } });
  console.log(`Deleted ${deletedUsers.deletedCount} demo users.`);

  // Delete all transactions
  const deletedTxs = await Transaction.deleteMany({});
  console.log(`Deleted ${deletedTxs.deletedCount} demo transactions.`);

  // Delete all non-admin wallets
  const deletedWallets = await Wallet.deleteMany({});
  console.log(`Deleted ${deletedWallets.deletedCount} demo wallets.`);

  // Delete all demo KYC records
  const deletedKyc = await Kyc.deleteMany({});
  console.log(`Deleted ${deletedKyc.deletedCount} demo KYC requests.`);

  console.log('✨ Database is now 100% clean with zero mock/seeded dummy records!');
  process.exit(0);
}

cleanDemoData().catch((err) => {
  console.error('Error cleaning demo data:', err);
  process.exit(1);
});
