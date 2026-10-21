import mongoose from 'mongoose';
import { ENV } from './env.js';

let cachedPromise: Promise<typeof mongoose> | null = null;

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    if (!cachedPromise) {
      cachedPromise = mongoose.connect(ENV.MONGODB_URI);
    }
    const conn = await cachedPromise;
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);

    // Ensure sparse unique index on users.email so phone-only registrations never conflict
    try {
      const col = mongoose.connection.db?.collection('users');
      if (col) {
        const indexes = await col.indexes();
        const emailIdx = indexes.find((i: any) => i.name === 'email_1');
        if (emailIdx && !emailIdx.sparse) {
          await col.dropIndex('email_1');
          await col.createIndex({ email: 1 }, { unique: true, sparse: true });
          console.log('[MongoDB] Synced email_1 index to sparse unique');
        }
      }
    } catch {
      // Index sync already satisfied
    }
  } catch (error) {
    cachedPromise = null;
    console.error('[MongoDB] Connection error:', error);
    throw error;
  }
};
