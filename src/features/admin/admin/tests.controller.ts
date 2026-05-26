import { Response } from 'express';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { Test } from '@/models/Test';
import { Question } from '@/models/Question';
import { TestResult } from '@/models/TestResult';
import { ActivityLog } from '@/models/ActivityLog';
import { deactivateExpiredTests } from '@/utils/testAvailability';

const parseDate = (value: unknown) => value ? new Date(String(value)) : null;
const testTypes = ['subject', 'chapter', 'full'] as const;
const normalizeTestType = (value: unknown) => testTypes.includes(value as any) ? value : 'subject';
const mapTest = async (t: any) => {
  const questionCount = await Question.countDocuments({ testId: t._id, isActive: true });
  return {
    id: t._id, title: t.name, description: t.description, category: t.category, subject: t.subject,
    testType: t.testType || 'subject', chapter: t.chapter || '', difficulty: t.difficulty,
    questionsCount: questionCount || t.totalQuestions || t.questionCount || 0, duration: t.duration,
    passingScore: t.passingMarks || 0, totalPoints: t.totalMarks || 0, negativeMarks: t.negativeMarks || 0,
    status: t.isActive ? 'published' as const : 'draft' as const, isPremium: t.isPremium,
    price: t.price || 0, originalPrice: t.originalPrice || 0,
    createdBy: '', scheduledAt: t.scheduledAt || null, activeFrom: t.activeFrom || null, activeUntil: t.activeUntil || null,
    createdAt: t.createdAt, updatedAt: t.updatedAt,
  };
};

export const getTests = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await deactivateExpiredTests(Test);

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = (req.query.search as string) || '';
  const category = (req.query.category as string) || '';
  const testType = (req.query.testType as string) || '';
  const statusFilter = (req.query.status as string) || '';

  const query: Record<string, any> = {};
  if (search) query.name = { $regex: search, $options: 'i' };
  if (category) query.category = category;
  if (testType) query.testType = testType;
  if (statusFilter === 'published') query.isActive = true;
  if (statusFilter === 'draft') query.isActive = false;

  const [tests, total, testAttempts] = await Promise.all([
    Test.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Test.countDocuments(query),
    TestResult.aggregate([{ $group: { _id: '$testId', count: { $sum: 1 }, avgScore: { $avg: '$score' } } }]),
  ]);

  const attemptMap = new Map(testAttempts.map((t: any) => [t._id.toString(), { count: t.count, avgScore: Math.round(t.avgScore) }]));

  const mapped = await Promise.all(tests.map(async t => ({
    ...(await mapTest(t)),
    attemptedCount: attemptMap.get(t._id.toString())?.count || 0,
    avgScore: attemptMap.get(t._id.toString())?.avgScore || 0,
  })));

  res.json({ success: true, data: { tests: mapped, totalTests: total, totalPages: Math.ceil(total / limit), currentPage: page } });
});

export const createTest = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const test = await Test.create({
    name: req.body.title, description: req.body.description || '', category: req.body.category, subject: req.body.subject || req.body.category || '',
    testType: normalizeTestType(req.body.testType), chapter: req.body.chapter || '',
    difficulty: req.body.difficulty || 'medium', duration: req.body.duration || 60, totalQuestions: req.body.questionsCount || 0,
    totalMarks: req.body.totalPoints || 100, passingMarks: req.body.passingScore || 40, negativeMarks: req.body.negativeMarks || 0,
    isActive: req.body.status === 'published', isPremium: req.body.isPremium || false,
    price: req.body.price || 0, originalPrice: req.body.originalPrice || 0,
    questionCount: req.body.questionsCount || 0,
    scheduledAt: parseDate(req.body.scheduledAt),
    activeFrom: parseDate(req.body.activeFrom || req.body.scheduledAt),
    activeUntil: parseDate(req.body.activeUntil),
  });
  await ActivityLog.create({ userId: req.user!._id, action: 'create_test', resource: 'tests', resourceId: test._id.toString() });
  res.status(201).json({ success: true, data: { ...(await mapTest(test)), attemptedCount: 0, avgScore: 0 } });
});

export const updateTest = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const map: Record<string, string> = { title: 'name', questionsCount: 'totalQuestions', passingScore: 'passingMarks', totalPoints: 'totalMarks', negativeMarks: 'negativeMarks', status: 'isActive' };
  const updates: Record<string, any> = {};
  Object.entries(req.body).forEach(([k, v]) => {
    if (map[k] === 'isActive') updates[map[k]] = v === 'published';
    else if (map[k]) updates[map[k]] = v;
    else if (!['id', '_id'].includes(k)) updates[k] = v;
  });
  if ('testType' in req.body) updates.testType = normalizeTestType(req.body.testType);
  if (req.body.questionsCount) updates.questionCount = req.body.questionsCount;
  if ('scheduledAt' in req.body) updates.scheduledAt = parseDate(req.body.scheduledAt);
  if ('activeFrom' in req.body) updates.activeFrom = parseDate(req.body.activeFrom);
  if ('activeUntil' in req.body) updates.activeUntil = parseDate(req.body.activeUntil);
  const test = await Test.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!test) throw new AppError('Test not found', 404);
  const [ad] = await TestResult.aggregate([{ $match: { testId: test._id } }, { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$score' } } }]);
  await ActivityLog.create({ userId: req.user!._id, action: 'update_test', resource: 'tests', resourceId: test._id.toString() });
  res.json({ success: true, data: { ...(await mapTest(test)), attemptedCount: ad?.count || 0, avgScore: ad ? Math.round(ad.avg) : 0 } });
});

export const duplicateTest = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const original = await Test.findById(req.params.id);
  if (!original) throw new AppError('Test not found', 404);
  const dup = await Test.create({
    name: `${original.name} (Copy)`, description: original.description, category: original.category, subject: original.subject,
    testType: original.testType, chapter: original.chapter,
    difficulty: original.difficulty, duration: original.duration, totalQuestions: original.totalQuestions, totalMarks: original.totalMarks,
    passingMarks: original.passingMarks, negativeMarks: original.negativeMarks, isActive: false, isPremium: original.isPremium,
    price: original.price || 0, originalPrice: original.originalPrice || 0,
    questionCount: original.questionCount, tags: original.tags, scheduledAt: original.scheduledAt, activeFrom: original.activeFrom, activeUntil: original.activeUntil,
  });
  const questions = await Question.find({ testId: original._id });
  if (questions.length) {
    const qs = questions.map(q => ({ ...q.toObject(), _id: undefined, testId: dup._id }));
    await Question.insertMany(qs);
  }
  res.status(201).json({ success: true, data: { ...(await mapTest(dup)), attemptedCount: 0, avgScore: 0 } });
});

export const bulkCreateTests = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { tests } = req.body;
  if (!Array.isArray(tests) || !tests.length) throw new AppError('Send an array of tests', 400);

  const docs = tests.map((item: any) => ({
    name: item.title || item.name,
    description: item.description || '',
    category: item.category,
    subject: item.subject || item.category,
    testType: normalizeTestType(item.testType),
    chapter: item.chapter || '',
    difficulty: item.difficulty || 'medium',
    duration: Number(item.duration || 60),
    totalQuestions: Number(item.questionsCount || item.totalQuestions || 0),
    totalMarks: Number(item.totalPoints || item.totalMarks || 100),
    passingMarks: Number(item.passingScore || item.passingMarks || 40),
    negativeMarks: Number(item.negativeMarks || 0),
    isActive: item.status === 'published' || item.isActive === true,
    isPremium: Boolean(item.isPremium),
    price: Number(item.price || 0),
    originalPrice: Number(item.originalPrice || 0),
    questionCount: Number(item.questionsCount || item.totalQuestions || 0),
    scheduledAt: parseDate(item.scheduledAt),
    activeFrom: parseDate(item.activeFrom || item.scheduledAt),
    activeUntil: parseDate(item.activeUntil),
  }));

  const invalidIndex = docs.findIndex((item) => !item.name || !item.category || !item.subject);
  if (invalidIndex !== -1) throw new AppError(`Row ${invalidIndex + 1}: title, category and subject are required`, 400);

  const created = await Test.insertMany(docs, { ordered: true });
  await ActivityLog.create({ userId: req.user!._id, action: 'bulk_create_tests', resource: 'tests', details: { count: created.length } });
  const mapped = await Promise.all(created.map(async (test) => ({ ...(await mapTest(test)), attemptedCount: 0, avgScore: 0 })));
  res.status(201).json({ success: true, data: { tests: mapped, count: created.length } });
});

export const deleteTest = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const test = await Test.findByIdAndDelete(req.params.id);
  if (!test) throw new AppError('Test not found', 404);
  await Promise.all([TestResult.deleteMany({ testId: test._id }), Question.deleteMany({ testId: test._id })]);
  res.json({ success: true, data: { id: req.params.id } });
});

export const getQuestions = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = (req.query.search as string) || '';
  const category = (req.query.category as string) || '';
  const subject = (req.query.subject as string) || '';
  const topic = (req.query.topic as string) || '';
  const type = (req.query.type as string) || '';
  const testId = (req.query.testId as string) || '';

  const query: Record<string, any> = {};
  if (search) query.text = { $regex: search, $options: 'i' };
  if (category) query.category = category;
  if (subject) query.subject = subject;
  if (topic) query.topic = topic;
  if (type) query.type = type;
  if (testId) query.testId = testId;

  const [questions, total] = await Promise.all([
    Question.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Question.countDocuments(query),
  ]);

  res.json({ success: true, data: { questions, totalQuestions: total, totalPages: Math.ceil(total / limit), currentPage: page } });
});

export const createQuestion = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const q = await Question.create(req.body);
  res.status(201).json({ success: true, data: q });
});

export const updateQuestion = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const q = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!q) throw new AppError('Question not found', 404);
  res.json({ success: true, data: q });
});

export const deleteQuestion = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await Question.findByIdAndDelete(req.params.id);
  res.json({ success: true, data: { id: req.params.id } });
});

export const deleteQuestionsByTest = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { testId } = req.params;
  const test = await Test.findById(testId);
  if (!test) throw new AppError('Test not found', 404);
  const result = await Question.deleteMany({ testId });
  await Test.findByIdAndUpdate(testId, { totalQuestions: 0, questionCount: 0 });
  await ActivityLog.create({ userId: req.user!._id, action: 'delete_test_questions', resource: 'questions', resourceId: testId, details: { count: result.deletedCount || 0 } });
  res.json({ success: true, data: { testId, count: result.deletedCount || 0 } });
});

export const bulkUploadQuestions = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { questions } = req.body;
  if (!Array.isArray(questions) || !questions.length) throw new AppError('Send an array of questions', 400);
  const created = await Question.insertMany(questions.map((q: any) => ({
    ...q, correctAnswer: typeof q.correctAnswer === 'string' ? q.correctAnswer : JSON.stringify(q.correctAnswer),
  })));
  res.status(201).json({ success: true, data: { count: created.length } });
});
