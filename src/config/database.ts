import mongoose from 'mongoose';
import { config } from '@/config';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(config.mongodb.uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    const subjects = conn.connection.collection('subjects');
    try {
      await subjects.dropIndex('name_1');
      console.log('Dropped legacy subjects.name unique index');
    } catch (error: any) {
      if (error?.codeName !== 'IndexNotFound' && error?.code !== 27) {
        console.warn('Could not drop legacy subjects.name index:', error?.message || error);
      }
    }
    await subjects.createIndex({ categoryId: 1, name: 1 }, { unique: true, name: 'categoryId_1_name_1' });
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
};
