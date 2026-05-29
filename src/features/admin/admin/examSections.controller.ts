import { Response } from 'express';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { ActivityLog } from '@/models/ActivityLog';

export const getExamSections = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { ExamSection } = require('@/models/ExamSection');
  const filter: Record<string, any> = {};
  if (req.query.categoryId) filter.categoryId = req.query.categoryId;
  const sections = await ExamSection.find(filter).populate('categoryId', 'name slug').sort({ order: 1 });
  res.json({ success: true, data: sections });
});

export const createExamSection = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { ExamSection } = require('@/models/ExamSection');
  const section = await ExamSection.create(req.body);
  await ActivityLog.create({ userId: req.user?._id, action: 'create_exam_section', resource: 'ExamSection', details: { title: section.title } });
  res.status(201).json({ success: true, message: 'Section created', data: section });
});

export const updateExamSection = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { ExamSection } = require('@/models/ExamSection');
  const section = await ExamSection.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!section) throw new AppError('Section not found', 404);
  await ActivityLog.create({ userId: req.user?._id, action: 'update_exam_section', resource: 'ExamSection', details: { id: req.params.id } });
  res.json({ success: true, message: 'Section updated', data: section });
});

export const deleteExamSection = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { ExamSection } = require('@/models/ExamSection');
  const section = await ExamSection.findByIdAndDelete(req.params.id);
  if (!section) throw new AppError('Section not found', 404);
  await ActivityLog.create({ userId: req.user?._id, action: 'delete_exam_section', resource: 'ExamSection', details: { id: req.params.id } });
  res.json({ success: true, message: 'Section deleted' });
});
