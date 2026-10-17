import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js';
import { logger } from './logger.js';

export async function seedDatabaseIfEmpty(): Promise<void> {
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    // Ensure Super Admin exists for administrative login
    await User.findOneAndUpdate(
      { email: 'admin@zappay.com' },
      {
        fullName: 'Super Admin',
        phone: '',
        role: 'superadmin',
        passwordHash,
        isEmailVerified: true,
        kycStatus: 'verified',
        isActive: true,
      },
      { upsert: true, new: true }
    );

    logger.info('✅ Super Admin account verified.');
  } catch (err) {
    logger.error('Error in seeder:', err);
  }
}

