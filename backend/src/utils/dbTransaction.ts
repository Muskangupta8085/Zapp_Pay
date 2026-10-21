import mongoose, { ClientSession } from 'mongoose';

/**
 * Universal database transaction runner that supports:
 * 1. Production MongoDB Replica Sets (full multi-document ACID transactions with session)
 * 2. Standalone development MongoDB instances (graceful fallback using atomic document-level operations)
 */
export async function runInTransaction<T>(
  fn: (session?: ClientSession) => Promise<T>
): Promise<T> {
  let session: ClientSession | null = null;
  let useTransaction = false;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
    useTransaction = true;
  } catch (err: any) {
    if (session) {
      await session.endSession().catch(() => {});
      session = null;
    }
    useTransaction = false;
  }

  if (useTransaction && session) {
    try {
      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (error: any) {
      try {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
      } catch (_) {}

      // If standalone MongoDB instance rejected the transaction at write time
      if (
        error?.message?.includes('replica set') ||
        error?.message?.includes('Transaction numbers') ||
        error?.codeName === 'IllegalOperation'
      ) {
        return await fn(undefined);
      }
      throw error;
    } finally {
      await session.endSession().catch(() => {});
    }
  } else {
    return await fn(undefined);
  }
}
