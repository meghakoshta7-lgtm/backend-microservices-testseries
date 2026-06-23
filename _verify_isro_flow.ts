import dns from 'dns';
dns.setServers(['8.8.8.8']);
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db!;

  // Simulate API: GET /exam/categories/isro/exams
  const category = await db.collection('examcategories').findOne({ slug: 'isro', isActive: true });
  console.log('Category found:', category?.name, '| id:', category?._id);

  if (category) {
    const exams = await db.collection('exams').find({ categoryId: category._id, isActive: true }).toArray();
    console.log(`Exams found: ${exams.length}`);
    for (const e of exams) {
      const testCount = await db.collection('tests').countDocuments({ category: e.name, isActive: true });
      console.log(`  ${e.name} | slug=${e.slug} | tests=${testCount}`);
    }
  }

  // Check tests for first exam
  if (category) {
    const firstExam = await db.collection('exams').findOne({ categoryId: category._id, isActive: true });
    if (firstExam) {
      const tests = await db.collection('tests').find({ category: firstExam.name, isActive: true }).toArray();
      console.log(`\nTests for "${firstExam.name}": ${tests.length}`);
      for (const t of tests) {
        const qCount = await db.collection('questions').countDocuments({ testId: t._id, isActive: true });
        console.log(`  ${t.name} | type=${t.testType} | questions=${qCount}`);
      }
    }
  }

  process.exit(0);
}
main();
