import { Response } from 'express';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { Notification } from '@/models/Notification';

export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const [notifs, total] = await Promise.all([
    Notification.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('createdBy', 'name'),
    Notification.countDocuments(),
  ]);
  res.json({ success: true, data: { notifications: notifs, totalNotifications: total, totalPages: Math.ceil(total / limit), currentPage: page } });
});

export const createNotification = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const notif = await Notification.create({ ...req.body, createdBy: req.user!._id });
  res.status(201).json({ success: true, data: notif });
});

export const sendNotification = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const notif = await Notification.findByIdAndUpdate(req.params.id, { status: 'sent', sentAt: new Date() }, { new: true });
  if (!notif) throw new AppError('Notification not found', 404);
  res.json({ success: true, data: notif });
});

export const updateNotification = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const notif = await Notification.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!notif) throw new AppError('Notification not found', 404);
  res.json({ success: true, data: notif });
});

export const deleteNotification = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ success: true, data: { id: req.params.id } });
});
