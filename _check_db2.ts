import mongoose from 'mongoose';
import dns from 'dns';
dns.setServers(['8.8.8.8']);
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;

  // Check examcategories collection directly
  const cats = await db.collection('examcategories').find().toArray();
  console.log('examcategories:', cats.length);
  for (const c of cats) {
    console.log(`  ${c.name} (${c._id})`);
  }

  // Check exams
  const exams = await db.collection('exams').find().toArray();
  console.log('\nexams:', exams.length);
  for (const e of exams) {
    console.log(`  ${e.name} — categoryId: ${e.categoryId}`);
  }

  // Check questions count
  const qCount = await db.collection('questions').countDocuments();
  console.log('\nquestions:', qCount);

  // Check tests count
  const tCount = await db.collection('tests').countDocuments();
  console.log('tests:', tCount);

  // Check subjects
  const subjects = await db.collection('subjects').find().toArray();
  console.log('\nsubjects:', subjects.length);
  for (const s of subjects) {
    console.log(`  ${s.name} — categoryId: ${s.categoryId}`);
  }

  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
