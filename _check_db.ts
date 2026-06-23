import mongoose from 'mongoose';
import dns from 'dns';
dns.setServers(['8.8.8.8']);
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 15000 });
  const { ExamCategory } = await import('./src/models/ExamCategory');
  const { Exam } = await import('./src/models/Exam');
  const { Subject } = await import('./src/models/Subject');
  const { Topic } = await import('./src/models/Topic');
  const { Test } = await import('./src/models/Test');
  const { Question } = await import('./src/models/Question');

  console.log('=== Categories ===');
  const cats = await ExamCategory.find();
  for (const c of cats) {
    const examCount = await Exam.countDocuments({ categoryId: c._id });
    console.log(`  ${c.name} (${c._id}) — ${examCount} exams`);
  }

  console.log('\n=== Sample Question Schema ===');
  const sampleQ = await Question.findOne();
  if (sampleQ) {
    console.log(JSON.stringify(sampleQ, null, 2).substring(0, 1500));
  } else {
    console.log('  No questions found');
  }

  console.log('\n=== Sample Test Schema ===');
  const sampleT = await Test.findOne();
  if (sampleT) {
    console.log(JSON.stringify(sampleT, null, 2).substring(0, 1000));
  } else {
    console.log('  No tests found');
  }

  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
