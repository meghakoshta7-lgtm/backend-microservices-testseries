import { Response } from 'express';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { ActivityLog } from '@/models/ActivityLog';

export const getExamCategories = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { ExamCategory } = require('@/models/ExamCategory');
  const categories = await ExamCategory.find().sort({ order: 1, name: 1 });
  res.json({ success: true, data: categories });
});

export const createExamCategory = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { ExamCategory } = require('@/models/ExamCategory');
  const { name, slug, description, icon, color, image, order } = req.body;
  const existing = await ExamCategory.findOne({ slug });
  if (existing) throw new AppError('Category with this slug already exists', 400);
  const category = await ExamCategory.create({ name, slug, description, icon, color, image, order });
  await ActivityLog.create({ userId: req.user?._id, action: 'create_exam_category', resource: 'ExamCategory', details: { name, slug } });
  res.status(201).json({ success: true, message: 'Category created', data: category });
});

export const updateExamCategory = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { ExamCategory } = require('@/models/ExamCategory');
  const category = await ExamCategory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) throw new AppError('Category not found', 404);
  await ActivityLog.create({ userId: req.user?._id, action: 'update_exam_category', resource: 'ExamCategory', details: { id: req.params.id } });
  res.json({ success: true, message: 'Category updated', data: category });
});

export const deleteExamCategory = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { ExamCategory } = require('@/models/ExamCategory');
  const { Exam } = require('@/models/Exam');
  const examsCount = await Exam.countDocuments({ categoryId: req.params.id });
  if (examsCount > 0) throw new AppError(`Cannot delete category with ${examsCount} exams. Remove exams first.`, 400);
  const category = await ExamCategory.findByIdAndDelete(req.params.id);
  if (!category) throw new AppError('Category not found', 404);
  await ActivityLog.create({ userId: req.user?._id, action: 'delete_exam_category', resource: 'ExamCategory', details: { id: req.params.id } });
  res.json({ success: true, message: 'Category deleted' });
});

export const getExams = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { Exam } = require('@/models/Exam');
  const filter: Record<string, any> = {};
  if (req.query.categoryId) filter.categoryId = req.query.categoryId;
  if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };
  const exams = await Exam.find(filter).populate('categoryId', 'name slug').sort({ order: 1, name: 1 });
  res.json({ success: true, data: exams });
});

export const createExam = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { Exam } = require('@/models/Exam');
  const body = { ...req.body };
  if (body.sectionId === '' || body.sectionId === 'null') body.sectionId = null;
  if (body.categoryId === '' || body.categoryId === 'null') body.categoryId = null;
  const exam = await Exam.create(body);
  await ActivityLog.create({ userId: req.user?._id, action: 'create_exam', resource: 'Exam', details: { name: exam.name } });
  res.status(201).json({ success: true, message: 'Exam created', data: exam });
});

export const updateExam = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { Exam } = require('@/models/Exam');
  const body = { ...req.body };
  if (body.sectionId === '' || body.sectionId === 'null') body.sectionId = null;
  if (body.categoryId === '' || body.categoryId === 'null') body.categoryId = null;
  const exam = await Exam.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
  if (!exam) throw new AppError('Exam not found', 404);
  await ActivityLog.create({ userId: req.user?._id, action: 'update_exam', resource: 'Exam', details: { id: req.params.id } });
  res.json({ success: true, message: 'Exam updated', data: exam });
});

export const deleteExam = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { Exam } = require('@/models/Exam');
  const exam = await Exam.findByIdAndDelete(req.params.id);
  if (!exam) throw new AppError('Exam not found', 404);
  await ActivityLog.create({ userId: req.user?._id, action: 'delete_exam', resource: 'Exam', details: { id: req.params.id } });
  res.json({ success: true, message: 'Exam deleted' });
});

export const getAdminSubjects = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { Subject } = require('@/models/Subject');
  const subjects = await Subject.find().populate('categoryId', 'name slug').sort({ order: 1, name: 1 });
  res.json({ success: true, data: subjects });
});

export const createAdminSubject = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { Subject } = require('@/models/Subject');
  const existing = await Subject.findOne({
    name: req.body.name,
    categoryId: req.body.categoryId || undefined,
  });
  if (existing) {
    throw new AppError('Subject already exists in this exam category', 409);
  }
  const subject = await Subject.create(req.body);
  await ActivityLog.create({ userId: req.user?._id, action: 'create_subject', resource: 'Subject', details: { name: subject.name } });
  res.status(201).json({ success: true, message: 'Subject created', data: subject });
});

export const updateAdminSubject = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { Subject } = require('@/models/Subject');
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!subject) throw new AppError('Subject not found', 404);
  await ActivityLog.create({ userId: req.user?._id, action: 'update_subject', resource: 'Subject', details: { id: req.params.id } });
  res.json({ success: true, message: 'Subject updated', data: subject });
});

export const deleteAdminSubject = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { Subject } = require('@/models/Subject');
  const { Topic } = require('@/models/Topic');
  const topicsCount = await Topic.countDocuments({ subjectId: req.params.id });
  if (topicsCount > 0) throw new AppError(`Cannot delete subject with ${topicsCount} topics. Remove topics first.`, 400);
  const subject = await Subject.findByIdAndDelete(req.params.id);
  if (!subject) throw new AppError('Subject not found', 404);
  await ActivityLog.create({ userId: req.user?._id, action: 'delete_subject', resource: 'Subject', details: { id: req.params.id } });
  res.json({ success: true, message: 'Subject deleted' });
});

export const getTopics = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { Topic } = require('@/models/Topic');
  const filter: Record<string, any> = {};
  if (req.query.subjectId) filter.subjectId = req.query.subjectId;
  if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };
  const topics = await Topic.find(filter).populate('subjectId', 'name').sort({ order: 1, name: 1 });
  res.json({ success: true, data: topics });
});

export const createTopic = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { Topic } = require('@/models/Topic');
  const topic = await Topic.create(req.body);
  await ActivityLog.create({ userId: req.user?._id, action: 'create_topic', resource: 'Topic', details: { name: topic.name } });
  res.status(201).json({ success: true, message: 'Topic created', data: topic });
});

export const updateTopic = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { Topic } = require('@/models/Topic');
  const topic = await Topic.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!topic) throw new AppError('Topic not found', 404);
  await ActivityLog.create({ userId: req.user?._id, action: 'update_topic', resource: 'Topic', details: { id: req.params.id } });
  res.json({ success: true, message: 'Topic updated', data: topic });
});

export const deleteTopic = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { Topic } = require('@/models/Topic');
  const topic = await Topic.findByIdAndDelete(req.params.id);
  if (!topic) throw new AppError('Topic not found', 404);
  await ActivityLog.create({ userId: req.user?._id, action: 'delete_topic', resource: 'Topic', details: { id: req.params.id } });
  res.json({ success: true, message: 'Topic deleted' });
});

export const getPlans = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { SubscriptionPlan } = require('@/models/SubscriptionPlan');
  const plans = await SubscriptionPlan.find().sort({ order: 1, price: 1 });
  res.json({ success: true, data: plans });
});

export const createPlan = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { SubscriptionPlan } = require('@/models/SubscriptionPlan');
  const name = String(req.body.name || '').trim();
  const slug = String(req.body.slug || name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const price = Number(req.body.price || 0);
  const originalPrice = req.body.originalPrice === undefined ? price : Number(req.body.originalPrice);
  const discount = originalPrice > price && originalPrice > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : Number(req.body.discount || 0);
  const plan = await SubscriptionPlan.create({
    ...req.body,
    name,
    slug,
    price,
    originalPrice,
    discount,
    durationMonths: Number(req.body.durationMonths || 1),
  });
  await ActivityLog.create({ userId: req.user?._id, action: 'create_plan', resource: 'SubscriptionPlan', details: { name: plan.name } });
  res.status(201).json({ success: true, message: 'Plan created', data: plan });
});

export const updatePlan = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { SubscriptionPlan } = require('@/models/SubscriptionPlan');
  const updates = { ...req.body };
  if (updates.name && !updates.slug) {
    updates.slug = String(updates.name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  if (updates.price !== undefined) updates.price = Number(updates.price);
  if (updates.originalPrice !== undefined) updates.originalPrice = Number(updates.originalPrice);
  if (updates.durationMonths !== undefined) updates.durationMonths = Number(updates.durationMonths);
  if (updates.originalPrice > updates.price && updates.originalPrice > 0) {
    updates.discount = Math.round(((updates.originalPrice - updates.price) / updates.originalPrice) * 100);
  }
  const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!plan) throw new AppError('Plan not found', 404);
  await ActivityLog.create({ userId: req.user?._id, action: 'update_plan', resource: 'SubscriptionPlan', details: { id: req.params.id } });
  res.json({ success: true, message: 'Plan updated', data: plan });
});

export const deletePlan = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { SubscriptionPlan } = require('@/models/SubscriptionPlan');
  const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
  if (!plan) throw new AppError('Plan not found', 404);
  await ActivityLog.create({ userId: req.user?._id, action: 'delete_plan', resource: 'SubscriptionPlan', details: { id: req.params.id } });
  res.json({ success: true, message: 'Plan deleted' });
});

export const getAccessRules = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { ContentAccessRule } = require('@/models/ContentAccessRule');
  const filter: Record<string, any> = {};
  if (req.query.entityType) filter.entityType = req.query.entityType;
  if (req.query.role) filter.role = req.query.role;
  const rules = await ContentAccessRule.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: rules });
});

export const createAccessRule = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { ContentAccessRule } = require('@/models/ContentAccessRule');
  const rule = await ContentAccessRule.create(req.body);
  await ActivityLog.create({ userId: req.user?._id, action: 'create_access_rule', resource: 'ContentAccessRule', details: { entityType: rule.entityType, entityId: rule.entityId } });
  res.status(201).json({ success: true, message: 'Access rule created', data: rule });
});

export const updateAccessRule = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { ContentAccessRule } = require('@/models/ContentAccessRule');
  const rule = await ContentAccessRule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!rule) throw new AppError('Access rule not found', 404);
  await ActivityLog.create({ userId: req.user?._id, action: 'update_access_rule', resource: 'ContentAccessRule', details: { id: req.params.id } });
  res.json({ success: true, message: 'Access rule updated', data: rule });
});

export const deleteAccessRule = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { ContentAccessRule } = require('@/models/ContentAccessRule');
  const rule = await ContentAccessRule.findByIdAndDelete(req.params.id);
  if (!rule) throw new AppError('Access rule not found', 404);
  await ActivityLog.create({ userId: req.user?._id, action: 'delete_access_rule', resource: 'ContentAccessRule', details: { id: req.params.id } });
  res.json({ success: true, message: 'Access rule deleted' });
});
