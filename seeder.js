const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');
const connectDB = require('./config/db');

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    // Check if admin already exists
    const existing = await Admin.findOne({ email: 'admin@successpathclasses.com' });
    if (existing) {
      console.log('⚠️  Admin already exists');
      process.exit(0);
    }

    await Admin.create({
      username: 'admin',
      email: 'admin@successpathclasses.com',
      password: 'admin123456',
      fullName: 'Super Admin',
      role: 'admin',
    });

    console.log('✅ Admin seeded successfully');
    console.log('📧 Email: admin@successpathclasses.com');
    console.log('🔑 Password: admin123456');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder error:', error);
    process.exit(1);
  }
};

seedAdmin();
