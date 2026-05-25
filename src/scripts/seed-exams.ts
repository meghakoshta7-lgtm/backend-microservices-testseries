import mongoose from 'mongoose';
import { config } from '@/config';
import { ExamCategory } from '@/models/ExamCategory';
import { Exam } from '@/models/Exam';
import { SubscriptionPlan } from '@/models/SubscriptionPlan';

const seedData = async () => {
  await mongoose.connect(config.mongodb.uri);
  console.log('Connected to MongoDB');

  await ExamCategory.deleteMany({});
  await Exam.deleteMany({});
  await SubscriptionPlan.deleteMany({});

  const categories = await ExamCategory.insertMany([
    { name: 'Government', slug: 'government', description: 'SSC, UPSC, Railway, Police, State PSC exams', icon: 'Landmark', color: 'from-blue-500 to-blue-600', image: 'https://images.unsplash.com/photo-1548883350-5a2a8b4dc6a8?w=400&h=300&fit=crop', order: 1 },
    { name: 'Engineering', slug: 'engineering', description: 'JEE, GATE, ESE, engineering entrance exams', icon: 'Atom', color: 'from-cyan-500 to-cyan-600', image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop', order: 2 },
    { name: 'Medical', slug: 'medical', description: 'NEET, AIIMS, medical entrance exams', icon: 'Stethoscope', color: 'from-rose-500 to-rose-600', image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop', order: 3 },
    { name: 'School', slug: 'school', description: 'Class 6-12 board exams, Olympiads', icon: 'GraduationCap', color: 'from-pink-500 to-pink-600', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c7f1?w=400&h=300&fit=crop', order: 4 },
    { name: 'Banking', slug: 'banking', description: 'IBPS, SBI, RBI banking exams', icon: 'Building2', color: 'from-green-500 to-emerald-600', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop', order: 5 },
    { name: 'Placement', slug: 'placement', description: 'Campus placements, IT company recruitment', icon: 'BriefcaseBusiness', color: 'from-teal-500 to-teal-600', image: 'https://images.unsplash.com/photo-1521791136064-7986c2920096?w=400&h=300&fit=crop', order: 6 },
    { name: 'Language', slug: 'language', description: 'English proficiency, IELTS, TOEFL', icon: 'BookOpen', color: 'from-violet-500 to-violet-600', image: 'https://images.unsplash.com/photo-1516383740770-fbcc5ccbece0?w=400&h=300&fit=crop', order: 7 },
  ]);

  const examData: any[] = [];
  const categoryMap: Record<string, string> = {};
  categories.forEach(c => { categoryMap[c.name] = c._id.toString(); });

  const govExams = [
    { name: 'SSC', slug: 'ssc', icon: 'FileText', color: 'from-blue-500 to-blue-600', totalTests: 120, totalSubjects: 4, difficulty: 'medium', successStats: [{ label: 'Selections', value: '10,000+' }, { label: 'Avg Score', value: '72%' }] },
    { name: 'UPSC', slug: 'upsc', icon: 'Landmark', color: 'from-amber-500 to-amber-600', totalTests: 55, totalSubjects: 5, difficulty: 'hard', successStats: [{ label: 'Selections', value: '1,000+' }, { label: 'Avg Score', value: '58%' }] },
    { name: 'Railway', slug: 'railway', icon: 'TrainFront', color: 'from-orange-500 to-orange-600', totalTests: 80, totalSubjects: 3, difficulty: 'medium', successStats: [{ label: 'Selections', value: '15,000+' }, { label: 'Avg Score', value: '68%' }] },
    { name: 'Police', slug: 'police', icon: 'Shield', color: 'from-red-500 to-red-600', totalTests: 45, totalSubjects: 3, difficulty: 'easy', successStats: [{ label: 'Selections', value: '8,000+' }, { label: 'Avg Score', value: '65%' }] },
    { name: 'State PSC', slug: 'state-psc', icon: 'Calculator', color: 'from-violet-500 to-violet-600', totalTests: 70, totalSubjects: 4, difficulty: 'hard', successStats: [{ label: 'Selections', value: '5,000+' }, { label: 'Avg Score', value: '55%' }] },
  ];
  govExams.forEach(e => examData.push({ ...e, categoryId: categoryMap['Government'], description: `${e.name} exam preparation`, order: examData.length + 1 }));

  const engExams = [
    { name: 'JEE Main', slug: 'jee-main', icon: 'Atom', color: 'from-cyan-500 to-cyan-600', totalTests: 110, totalSubjects: 3, difficulty: 'hard', successStats: [{ label: 'Qualifiers', value: '2 Lakh+' }, { label: 'Avg Score', value: '62%' }] },
    { name: 'JEE Advanced', slug: 'jee-advanced', icon: 'Atom', color: 'from-sky-500 to-sky-600', totalTests: 40, totalSubjects: 3, difficulty: 'hard', successStats: [{ label: 'Qualifiers', value: '50,000+' }, { label: 'Avg Score', value: '48%' }] },
    { name: 'GATE', slug: 'gate', icon: 'Atom', color: 'from-indigo-500 to-indigo-600', totalTests: 60, totalSubjects: 8, difficulty: 'hard', successStats: [{ label: 'Qualifiers', value: '1 Lakh+' }, { label: 'Avg Score', value: '55%' }] },
    { name: 'ISRO', slug: 'isro', icon: 'Rocket', color: 'from-red-500 to-red-600', totalTests: 30, totalSubjects: 6, difficulty: 'hard', successStats: [{ label: 'Vacancies', value: '500+' }, { label: 'Avg Score', value: '60%' }] },
    { name: 'BARC', slug: 'barc', icon: 'Atom', color: 'from-orange-500 to-orange-600', totalTests: 25, totalSubjects: 5, difficulty: 'hard', successStats: [{ label: 'Vacancies', value: '400+' }, { label: 'Avg Score', value: '58%' }] },
  ];
  engExams.forEach(e => examData.push({ ...e, categoryId: categoryMap['Engineering'], description: `${e.name} exam preparation`, order: examData.length + 1 }));

  const medExams = [
    { name: 'NEET UG', slug: 'neet-ug', icon: 'Stethoscope', color: 'from-rose-500 to-rose-600', totalTests: 85, totalSubjects: 4, difficulty: 'hard', successStats: [{ label: 'Qualifiers', value: '1.5 Lakh+' }, { label: 'Avg Score', value: '58%' }] },
    { name: 'NEET PG', slug: 'neet-pg', icon: 'Stethoscope', color: 'from-red-500 to-red-600', totalTests: 50, totalSubjects: 19, difficulty: 'hard', successStats: [{ label: 'Qualifiers', value: '40,000+' }, { label: 'Avg Score', value: '52%' }] },
  ];
  medExams.forEach(e => examData.push({ ...e, categoryId: categoryMap['Medical'], description: `${e.name} exam preparation`, order: examData.length + 1 }));

  const schoolExams = [
    { name: 'Class 10', slug: 'class-10', icon: 'GraduationCap', color: 'from-pink-500 to-pink-600', totalTests: 200, totalSubjects: 6, difficulty: 'easy', successStats: [{ label: 'Students', value: '5 Lakh+' }, { label: 'Avg Score', value: '78%' }] },
    { name: 'Class 12', slug: 'class-12', icon: 'GraduationCap', color: 'from-rose-400 to-rose-500', totalTests: 180, totalSubjects: 8, difficulty: 'medium', successStats: [{ label: 'Students', value: '4 Lakh+' }, { label: 'Avg Score', value: '72%' }] },
    { name: 'Olympiad', slug: 'olympiad', icon: 'Trophy', color: 'from-amber-500 to-amber-600', totalTests: 60, totalSubjects: 3, difficulty: 'hard', successStats: [{ label: 'Participants', value: '2 Lakh+' }, { label: 'Avg Score', value: '45%' }] },
  ];
  schoolExams.forEach(e => examData.push({ ...e, categoryId: categoryMap['School'], description: `${e.name} exam preparation`, order: examData.length + 1 }));

  const bankExams = [
    { name: 'IBPS PO', slug: 'ibps-po', icon: 'Building2', color: 'from-green-500 to-green-600', totalTests: 95, totalSubjects: 4, difficulty: 'medium', successStats: [{ label: 'Selections', value: '5,000+' }, { label: 'Avg Score', value: '68%' }] },
    { name: 'SBI Clerk', slug: 'sbi-clerk', icon: 'Building2', color: 'from-emerald-500 to-emerald-600', totalTests: 80, totalSubjects: 4, difficulty: 'medium', successStats: [{ label: 'Selections', value: '8,000+' }, { label: 'Avg Score', value: '65%' }] },
    { name: 'RBI Grade B', slug: 'rbi-grade-b', icon: 'Building2', color: 'from-teal-500 to-teal-600', totalTests: 40, totalSubjects: 5, difficulty: 'hard', successStats: [{ label: 'Selections', value: '500+' }, { label: 'Avg Score', value: '55%' }] },
  ];
  bankExams.forEach(e => examData.push({ ...e, categoryId: categoryMap['Banking'], description: `${e.name} exam preparation`, order: examData.length + 1 }));

  const placementExams = [
    { name: 'Campus Placement', slug: 'campus-placement', icon: 'BriefcaseBusiness', color: 'from-teal-500 to-teal-600', totalTests: 50, totalSubjects: 4, difficulty: 'medium', successStats: [{ label: 'Placed', value: '25,000+' }, { label: 'Avg Package', value: '8 LPA' }] },
    { name: 'Tech Recruitment', slug: 'tech-recruitment', icon: 'BriefcaseBusiness', color: 'from-cyan-500 to-cyan-600', totalTests: 40, totalSubjects: 3, difficulty: 'hard', successStats: [{ label: 'Hired', value: '15,000+' }, { label: 'Avg Package', value: '12 LPA' }] },
  ];
  placementExams.forEach(e => examData.push({ ...e, categoryId: categoryMap['Placement'], description: `${e.name} exam preparation`, order: examData.length + 1 }));

  const langExams = [
    { name: 'IELTS', slug: 'ielts', icon: 'BookOpen', color: 'from-violet-500 to-violet-600', totalTests: 30, totalSubjects: 4, difficulty: 'medium', successStats: [{ label: 'Test Takers', value: '50,000+' }, { label: 'Avg Band', value: '6.5' }] },
    { name: 'TOEFL', slug: 'toefl', icon: 'BookOpen', color: 'from-purple-500 to-purple-600', totalTests: 25, totalSubjects: 4, difficulty: 'medium', successStats: [{ label: 'Test Takers', value: '30,000+' }, { label: 'Avg Score', value: '95' }] },
  ];
  langExams.forEach(e => examData.push({ ...e, categoryId: categoryMap['Language'], description: `${e.name} exam preparation`, order: examData.length + 1 }));

  await Exam.insertMany(examData);
  console.log(`Seeded ${examData.length} exams`);

  const plans = await SubscriptionPlan.insertMany([
    { name: 'Free', slug: 'free', durationMonths: 0, price: 0, originalPrice: 0, discount: 0, features: ['Free mock tests', 'Basic performance report', 'Limited study access'], isPopular: false, order: 0 },
    { name: 'Starter', slug: 'starter', durationMonths: 1, price: 99, originalPrice: 199, discount: 50, features: ['Premium test series access', 'Detailed result analysis', 'Bookmark and revision tools'], isPopular: true, order: 1 },
    { name: '1 Month', slug: '1-month', durationMonths: 1, price: 499, originalPrice: 999, discount: 50, features: ['Full access to all tests', 'Detailed analysis', 'All India Rank', 'Performance reports', 'Topic-wise practice'], isPopular: false, order: 2 },
    { name: '3 Months', slug: '3-months', durationMonths: 3, price: 999, originalPrice: 2499, discount: 60, features: ['Everything in 1 Month', 'AI-powered analysis', 'Personalized recommendations', 'Priority support', 'Study planner'], isPopular: false, order: 3 },
    { name: '6 Months', slug: '6-months', durationMonths: 6, price: 1499, originalPrice: 4999, discount: 70, features: ['Everything in 3 Months', 'Mock interview prep', 'Live doubt sessions', 'Career counselling', 'Certificate of completion'], isPopular: false, order: 4 },
    { name: '1 Year', slug: '1-year', durationMonths: 12, price: 2499, originalPrice: 9999, discount: 75, features: ['Everything in 6 Months', 'Unlimited test access', '1-on-1 mentorship', 'Resume building', 'Guaranteed selection kit'], isPopular: false, order: 5 },
  ]);
  console.log(`Seeded ${plans.length} subscription plans`);

  console.log('Seed complete!');
  process.exit(0);
};

seedData().catch(err => { console.error(err); process.exit(1); });
