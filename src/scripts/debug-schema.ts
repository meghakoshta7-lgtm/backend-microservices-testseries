import 'module-alias/register';
import mongoose from 'mongoose';
import { config } from '@/config';
import { Test } from '@/models/Test';

async function check() {
  await mongoose.connect(config.mongodb.uri);
  const paths = Object.keys(Test.schema.paths);
  console.log('Schema paths:', JSON.stringify(paths.filter(p => p.includes('ection'))));

  const t = await Test.create({
    name: 'Debug',
    description: 'd',
    category: 'JEE',
    subject: 'P',
    testType: 'subject',
    difficulty: 'easy',
    duration: 60,
    totalQuestions: 10,
    totalMarks: 40,
    passingMarks: 0,
    negativeMarks: 0,
    isActive: true,
    isPremium: false,
    price: 0,
    sections: [{ name: 'A', questionCount: 5 }],
  });
  console.log('Created sections:', JSON.stringify(t.sections));
  const f = await Test.findById(t._id).lean();
  console.log('Fetched sections:', JSON.stringify(f?.sections));
  await Test.deleteOne({ _id: t._id });
  await mongoose.connection.close();
}
check().catch(e => { console.error(e); process.exit(1); });
