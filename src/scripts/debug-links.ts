import 'module-alias/register';
import mongoose from 'mongoose';
import { config } from '@/config';
import { Exam } from '@/models/Exam';
import { Subject } from '@/models/Subject';
import { ExamCategory } from '@/models/ExamCategory';

async function check() {
  await mongoose.connect(config.mongodb.uri);
  const exams = await Exam.find().populate('categoryId', 'name').lean();
  const subjects = await Subject.find().populate('categoryId', 'name').lean();
  const categories = await ExamCategory.find().lean();
  
  console.log('=== Categories ===');
  categories.forEach(c => console.log(`  ${c._id} -> ${c.name}`));
  
  console.log('\n=== Exams ===');
  exams.forEach(e => {
    const catName = typeof e.categoryId === 'object' && e.categoryId ? (e.categoryId as any).name : e.categoryId;
    const catId = typeof e.categoryId === 'object' ? (e.categoryId as any)._id : e.categoryId;
    console.log(`  ${e.name} | categoryId: ${catId} (${catName})`);
  });
  
  console.log('\n=== Subjects ===');
  subjects.forEach(s => {
    const catName = typeof s.categoryId === 'object' && s.categoryId ? (s.categoryId as any).name : s.categoryId;
    const catId = typeof s.categoryId === 'object' ? (s.categoryId as any)._id : s.categoryId;
    console.log(`  ${s.name} | categoryId: ${catId} (${catName})`);
  });
  
  await mongoose.connection.close();
}
check().catch(e => { console.error(e); process.exit(1); });
