import mongoose from 'mongoose';
import { config } from '@/config';

const seedData = async () => {
  await mongoose.connect(config.mongodb.uri);
  console.log('Connected to MongoDB');
  console.log('Study material seed data removed - no subjects or materials to seed');
  process.exit(0);
};

seedData().catch(err => { console.error(err); process.exit(1); });
