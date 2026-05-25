import { Response } from 'express';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { User } from '@/models/User';
import { Batch } from '@/models/Batch';
import { Group } from '@/models/Group';

export const getBatches = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const batches = await Batch.find().sort({ createdAt: -1 });
  const mapped = await Promise.all(batches.map(async b => {
    const studentCount = await User.countDocuments({ batchId: b._id, role: 'user' });
    return { id: b._id, name: b.name, description: b.description, code: b.code, subjects: b.subjects || [], startDate: b.startDate, endDate: b.endDate, isActive: b.isActive, studentCount, createdAt: b.createdAt };
  }));
  res.json({ success: true, data: { batches: mapped } });
});

export const createBatch = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const batch = await Batch.create({ ...req.body, code: req.body.code || `BATCH-${Date.now()}`, createdBy: req.user!._id });
  res.status(201).json({ success: true, data: { id: batch._id, name: batch.name, code: batch.code } });
});

export const updateBatch = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const batch = await Batch.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!batch) throw new AppError('Batch not found', 404);
  res.json({ success: true, data: { id: batch._id, name: batch.name, code: batch.code } });
});

export const deleteBatch = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await Batch.findByIdAndDelete(req.params.id);
  await User.updateMany({ batchId: req.params.id }, { $unset: { batchId: '' } });
  res.json({ success: true, data: { id: req.params.id } });
});

export const getGroups = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const groups = await Group.find().sort({ createdAt: -1 });
  const mapped = await Promise.all(groups.map(async g => {
    const memberCount = await User.countDocuments({ groupIds: g._id });
    return { id: g._id, name: g.name, description: g.description, memberCount, createdAt: g.createdAt };
  }));
  res.json({ success: true, data: { groups: mapped } });
});

export const createGroup = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const group = await Group.create({ ...req.body, createdBy: req.user!._id });
  res.status(201).json({ success: true, data: { id: group._id, name: group.name } });
});

export const updateGroup = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const group = await Group.findByIdAndUpdate(req.params.id, { name: req.body.name, description: req.body.description }, { new: true });
  if (!group) throw new AppError('Group not found', 404);
  res.json({ success: true, data: { id: group._id, name: group.name, description: group.description } });
});

export const deleteGroup = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await Group.findByIdAndDelete(req.params.id);
  await User.updateMany({ groupIds: req.params.id }, { $pull: { groupIds: req.params.id } });
  res.json({ success: true, data: { id: req.params.id } });
});
