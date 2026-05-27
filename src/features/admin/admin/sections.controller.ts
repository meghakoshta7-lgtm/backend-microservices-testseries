import { Response } from 'express';
import mongoose from 'mongoose';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { Section } from '@/models/Section';
import { Question } from '@/models/Question';
import { Test } from '@/models/Test';

export const getSections = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { testId } = req.query;

  if (!testId || !mongoose.Types.ObjectId.isValid(testId as string)) {
    throw new AppError('Valid testId is required', 400);
  }

  const sections = await Section.find({ testId, isActive: true }).sort({ order: 1 });

  for (const section of sections) {
    const count = await Question.countDocuments({ sectionId: section._id, isActive: true });
    section.totalQuestions = count;
  }

  res.json({
    success: true,
    data: sections,
  });
});

export const createSection = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { testId, name, description, duration } = req.body;

  if (!testId || !mongoose.Types.ObjectId.isValid(testId)) {
    throw new AppError('Valid testId is required', 400);
  }

  if (!name || typeof name !== 'string') {
    throw new AppError('Section name is required', 400);
  }

  const test = await Test.findById(testId);
  if (!test) {
    throw new AppError('Test not found', 404);
  }

  const maxOrder = await Section.findOne({ testId }).sort({ order: -1 });
  const order = (maxOrder?.order ?? -1) + 1;

  const section = await Section.create({
    testId,
    name,
    description: description || '',
    order,
    duration: duration || 0,
    isActive: true,
  });

  res.status(201).json({
    success: true,
    data: section,
  });
});

export const updateSection = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description, order, duration } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid section ID', 400);
  }

  const section = await Section.findByIdAndUpdate(
    id,
    {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(order !== undefined && { order }),
      ...(duration !== undefined && { duration }),
    },
    { new: true }
  );

  if (!section) {
    throw new AppError('Section not found', 404);
  }

  res.json({
    success: true,
    data: section,
  });
});

export const deleteSection = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid section ID', 400);
  }

  const section = await Section.findById(id);
  if (!section) {
    throw new AppError('Section not found', 404);
  }

  // Soft delete - mark as inactive
  section.isActive = false;
  await section.save();

  // Reassign questions to default section
  await Question.updateMany(
    { sectionId: id },
    { sectionId: undefined, section: 'General', sectionName: 'General' }
  );

  res.json({
    success: true,
    message: 'Section deleted successfully',
  });
});

export const assignQuestionsToSection = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { sectionId } = req.params;
  const { questionIds } = req.body;

  if (!mongoose.Types.ObjectId.isValid(sectionId)) {
    throw new AppError('Invalid section ID', 400);
  }

  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    throw new AppError('Valid questionIds array is required', 400);
  }

  const section = await Section.findById(sectionId);
  if (!section) {
    throw new AppError('Section not found', 404);
  }

  const validIds = questionIds.filter(id => mongoose.Types.ObjectId.isValid(id));
  const result = await Question.updateMany(
    { _id: { $in: validIds } },
    {
      sectionId: new mongoose.Types.ObjectId(sectionId),
      section: section.name,
      sectionName: section.name,
    }
  );

  res.json({
    success: true,
    data: {
      updatedCount: result.modifiedCount,
      sectionId,
    },
  });
});

export const reorderSections = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { sections } = req.body;

  if (!Array.isArray(sections)) {
    throw new AppError('sections array is required', 400);
  }

  const updatePromises = sections.map((sec: any, idx: number) =>
    Section.findByIdAndUpdate(sec.id, { order: idx }, { new: true })
  );

  const updated = await Promise.all(updatePromises);

  res.json({
    success: true,
    data: updated,
  });
});
