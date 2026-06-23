import mongoose from 'mongoose';
import dns from 'dns';
dns.setServers(['8.8.8.8']);
import dotenv from 'dotenv';
dotenv.config();

const DIFFS = ['easy', 'medium', 'hard'] as const;

const EXAM_SECTIONS = [
  { title: 'ISRO Scientist/Engineer Exams', subtitle: 'For scientist and engineer positions in ISRO', icon: 'Rocket', order: 1 },
  { title: 'ISRO Technical Exams', subtitle: 'For technical assistant and technician roles', icon: 'Trophy', order: 2 },
  { title: 'ISRO Support Staff Exams', subtitle: 'For administrative and support positions', icon: 'Users', order: 3 },
];

const EXAM_DEFS = [
  { name: 'ISRO Scientist/Engineer (SC)', slug: 'isro-scientist', sectionIdx: 0, diff: 'hard', tags: ['ISRO', 'Scientist', 'Engineering'] },
  { name: 'ISRO Technical Assistant', slug: 'isro-ta', sectionIdx: 1, diff: 'medium', tags: ['ISRO', 'Technical'] },
  { name: 'ISRO Junior Personal Assistant', slug: 'isro-jpa', sectionIdx: 2, diff: 'easy', tags: ['ISRO', 'Staff'] },
];

interface TopicDef { name: string; slug: string; }
interface SubjectDef { name: string; slug: string; color: string; icon: string; topics: TopicDef[]; }

const SUBJECT_DEFS: SubjectDef[] = [
  {
    name: 'Physics', slug: 'isro-physics', color: '#3273e6', icon: 'Atom',
    topics: [
      { name: 'Mechanics', slug: 'mechanics' },
      { name: 'Thermodynamics', slug: 'thermodynamics-isro' },
      { name: 'Optics', slug: 'optics-isro' },
      { name: 'Electromagnetism', slug: 'electromagnetism' },
      { name: 'Modern Physics', slug: 'modern-physics-isro' },
      { name: 'Quantum Mechanics', slug: 'quantum-mechanics' },
      { name: 'Solid State Physics', slug: 'solid-state-physics' },
      { name: 'Nuclear Physics', slug: 'nuclear-physics' },
    ]
  },
  {
    name: 'Mathematics', slug: 'isro-mathematics', color: '#e63273', icon: 'Calculator',
    topics: [
      { name: 'Linear Algebra', slug: 'linear-algebra-isro' },
      { name: 'Calculus', slug: 'calculus-isro' },
      { name: 'Differential Equations', slug: 'diff-equations-isro' },
      { name: 'Complex Analysis', slug: 'complex-analysis' },
      { name: 'Probability & Statistics', slug: 'probability-statistics-isro' },
      { name: 'Numerical Methods', slug: 'numerical-methods' },
    ]
  },
  {
    name: 'Electronics', slug: 'isro-electronics', color: '#32e673', icon: 'Zap',
    topics: [
      { name: 'Analog Circuits', slug: 'analog-circuits' },
      { name: 'Digital Electronics', slug: 'digital-electronics' },
      { name: 'Control Systems', slug: 'control-systems' },
      { name: 'Communication Systems', slug: 'communication-systems' },
      { name: 'Signals & Systems', slug: 'signals-systems' },
      { name: 'Microprocessors', slug: 'microprocessors' },
      { name: 'VLSI Design', slug: 'vlsi-design' },
      { name: 'Embedded Systems', slug: 'embedded-systems' },
    ]
  },
  {
    name: 'Computer Science', slug: 'isro-cs', color: '#e6b832', icon: 'Monitor',
    topics: [
      { name: 'Data Structures', slug: 'data-structures-isro' },
      { name: 'Algorithms', slug: 'algorithms-isro' },
      { name: 'Operating Systems', slug: 'os-isro' },
      { name: 'DBMS', slug: 'dbms-isro' },
      { name: 'Computer Networks', slug: 'cn-isro' },
      { name: 'Software Engineering', slug: 'se-isro' },
      { name: 'Compiler Design', slug: 'compiler-design' },
      { name: 'Computer Architecture', slug: 'coa-isro' },
    ]
  },
];

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  const { ExamCategory } = await import('./src/models/ExamCategory');
  const { ExamSection } = await import('./src/models/ExamSection');
  const { Exam } = await import('./src/models/Exam');
  const { Subject } = await import('./src/models/Subject');
  const { Topic } = await import('./src/models/Topic');
  const { Test } = await import('./src/models/Test');

  // 1. Create Category
  let catId;
  let cat = await ExamCategory.findOne({ slug: 'isro' });
  if (!cat) {
    cat = await ExamCategory.create({
      name: 'ISRO', slug: 'isro', description: 'Prepare for ISRO Scientist/Engineer, Technical Assistant and other space sector exams',
      icon: 'Rocket', color: 'from-blue-700 to-indigo-800', order: 5, isActive: true,
    });
    console.log('Created category:', cat.name, cat._id);
  } else {
    console.log('Category exists:', cat.name, cat._id);
  }
  catId = cat._id;

  // 2. Create Exam Sections
  const sectionIds: any[] = [];
  for (let i = 0; i < EXAM_SECTIONS.length; i++) {
    const s = EXAM_SECTIONS[i];
    let sec = await ExamSection.findOne({ title: s.title, categoryId: catId });
    if (!sec) {
      sec = await ExamSection.create({ ...s, categoryId: catId });
      console.log('  Created section:', sec.title);
    }
    sectionIds[i] = sec._id;
  }

  // 3. Create Exams
  for (const ed of EXAM_DEFS) {
    let exam = await Exam.findOne({ slug: ed.slug });
    if (!exam) {
      exam = await Exam.create({
        name: ed.name, slug: ed.slug, categoryId: catId, sectionId: sectionIds[ed.sectionIdx],
        description: `Prepare for ${ed.name} exam conducted by ISRO`,
        icon: 'Rocket', color: 'from-blue-700 to-indigo-800', isActive: true,
        difficulty: ed.diff, order: 1, totalTests: 0, totalSubjects: 0,
      });
      console.log('  Created exam:', exam.name);
    } else {
      console.log('  Exam exists:', exam.name);
    }
  }

  // 4. Create Subjects + Topics
  for (const sd of SUBJECT_DEFS) {
    let sub = await Subject.findOne({ name: sd.name, categoryId: catId });
    if (!sub) {
      sub = await Subject.create({ name: sd.name, slug: sd.slug, color: sd.color, icon: sd.icon, categoryId: catId, isActive: true });
      console.log('  Created subject:', sd.name);
    }
    for (const td of sd.topics) {
      let topic = await Topic.findOne({ subjectId: sub!._id, slug: td.slug });
      if (!topic) {
        await Topic.create({ name: td.name, slug: td.slug, subjectId: sub!._id, isActive: true, order: sd.topics.indexOf(td) });
      }
    }
    console.log(`    ${sd.topics.length} topics for ${sd.name}`);
  }

  // 5. Create Tests
  const exams = await Exam.find({ categoryId: catId });
  const subjects = await Subject.find({ categoryId: catId });
  let testCount = 0;

  for (const exam of exams) {
    // Chapter-wise tests
    for (const sub of subjects) {
      const topics = await Topic.find({ subjectId: sub._id });
      for (const topic of topics) {
        for (const diff of DIFFS) {
          const slug = `isro-${exam.slug}-${sub.slug}-${topic.slug}-${diff}`;
          const exists = await Test.findOne({ slug });
          if (!exists) {
            await Test.create({
              name: `${exam.name} - ${sub.name} - ${topic.name} (${diff})`, slug,
              category: exam.name, subject: sub.name, chapter: topic.name,
              testType: 'chapter', difficulty: diff,
              duration: 30, totalQuestions: 25, totalMarks: 25,
              passingMarks: 0, negativeMarks: 0, isActive: true, isPremium: false,
              questionCount: 0, tags: ['ISRO', exam.name, sub.name, topic.name, diff],
            });
            testCount++;
          }
        }
      }

      // Subject-wise tests
      for (const diff of DIFFS) {
        const slug = `isro-${exam.slug}-${sub.slug}-subject-${diff}`;
        const exists = await Test.findOne({ slug });
        if (!exists) {
          await Test.create({
            name: `${exam.name} - ${sub.name} (${diff})`, slug,
            category: exam.name, subject: sub.name, chapter: 'Full Subject',
            testType: 'subject', difficulty: diff,
            duration: 60, totalQuestions: 50, totalMarks: 50,
            passingMarks: 0, negativeMarks: 0, isActive: true, isPremium: false,
            questionCount: 0, tags: ['ISRO', exam.name, sub.name, 'Subject Wise', diff],
          });
          testCount++;
        }
      }
    }

    // Full Length mocks
    for (let i = 1; i <= 3; i++) {
      const slug = `isro-${exam.slug}-full-mock-${i}`;
      const exists = await Test.findOne({ slug });
      if (!exists) {
        await Test.create({
          name: `${exam.name} Full Mock ${i}`, slug,
          category: exam.name, subject: 'Full Length', chapter: '',
          testType: 'full', difficulty: 'medium',
          duration: 120, totalQuestions: 100, totalMarks: 100,
          passingMarks: 0, negativeMarks: 0, isActive: true, isPremium: false,
          questionCount: 0, tags: ['ISRO', exam.name, 'Full Length', `Mock ${i}`],
          badge: i === 1 ? { text: 'NEW', color: '#ff6b6b' } : undefined,
        });
        testCount++;
      }
    }
  }

  console.log(`\nTotal tests created: ${testCount}`);
  for (const exam of exams) {
    const count = await Test.countDocuments({ category: exam.name });
    console.log(`  ${exam.name}: ${count} tests`);
  }
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
