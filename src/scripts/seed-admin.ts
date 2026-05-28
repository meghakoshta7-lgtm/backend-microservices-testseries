import 'module-alias/register';
import mongoose from 'mongoose';
import { config } from '@/config';
import { User } from '@/models/User';

const adminEmail = process.env.ADMIN_EMAIL || 'admin@p2.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
const adminName = process.env.ADMIN_NAME || 'P2 Admin';

export const seedAdmin = async () => {
  const existingUser = await User.findOne({ email: adminEmail }).select('+password');

  if (existingUser) {
    existingUser.name = existingUser.name || adminName;
    existingUser.role = 'super_admin';
    existingUser.isLoginDisabled = false;

    if (process.env.ADMIN_PASSWORD) {
      existingUser.password = adminPassword;
    }

    await existingUser.save();
    console.log(`Admin user ready: ${adminEmail}`);
    return;
  }

  await User.create({
    name: adminName,
    email: adminEmail,
    password: adminPassword,
    role: 'super_admin',
    isEmailVerified: true,
    isLoginDisabled: false,
  });

  console.log(`Admin user created: ${adminEmail}`);
};

const run = async () => {
  await mongoose.connect(config.mongodb.uri);
  await seedAdmin();
};

run()
  .catch((error) => {
    console.error('Failed to seed admin user:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
