const app = require('../dist/app.js').default || require('../dist/app.js');
const { connectDB } = require('../dist/config/db.js');
const { seedDatabaseIfEmpty } = require('../dist/utils/seeder.js');

let seeded = false;

module.exports = async (req, res) => {
  try {
    await connectDB();
    if (!seeded) {
      await seedDatabaseIfEmpty().catch((err) => console.error('[Seeder Error]:', err));
      seeded = true;
    }
  } catch (err) {
    console.error('[Vercel DB Connection Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? String(err) : undefined,
    });
  }

  return app(req, res);
};
