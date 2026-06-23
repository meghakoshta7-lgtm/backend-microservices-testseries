import dns from 'dns';
dns.setServers(['8.8.8.8']);
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db!;

  const cat = await db.collection('examcategories').findOne({ slug: 'placement' });
  console.log('Placement category:', cat?._id, '\n');

  const exams = await db.collection('exams').find({ categoryId: cat!._id }).toArray();
  console.log(`Total exams: ${exams.length}`);
  for (const e of exams) {
    const t = await db.collection('tests').countDocuments({ category: e.name });
    const q = await db.collection('questions').countDocuments({ category: e.name });
    console.log(`  ${e.name}: ${t} tests, ${q} questions`);
  }

  process.exit(0);
}
main();
