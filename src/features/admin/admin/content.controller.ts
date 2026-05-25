import { Response } from 'express';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { ActivityLog } from '@/models/ActivityLog';
import { Banner } from '@/models/Banner';
import { FAQ } from '@/models/FAQ';
import { Announcement } from '@/models/Announcement';

export const getActivityLogs = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const [logs, total] = await Promise.all([
    ActivityLog.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('userId', 'name email'),
    ActivityLog.countDocuments(),
  ]);
  res.json({ success: true, data: { logs, totalLogs: total, totalPages: Math.ceil(total / limit), currentPage: page } });
});

export const getBanners = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const banners = await Banner.find().sort({ priority: -1, createdAt: -1 });
  res.json({ success: true, data: { banners } });
});

export const createBanner = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const banner = await Banner.create({ ...req.body, createdBy: req.user!._id });
  res.status(201).json({ success: true, data: banner });
});

export const updateBanner = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!banner) throw new AppError('Banner not found', 404);
  res.json({ success: true, data: banner });
});

export const deleteBanner = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await Banner.findByIdAndDelete(req.params.id);
  res.json({ success: true, data: { id: req.params.id } });
});

export const getFAQs = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const faqs = await FAQ.find().sort({ order: 1, createdAt: -1 });
  res.json({ success: true, data: { faqs } });
});

export const createFAQ = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const faq = await FAQ.create(req.body);
  res.status(201).json({ success: true, data: faq });
});

export const updateFAQ = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!faq) throw new AppError('FAQ not found', 404);
  res.json({ success: true, data: faq });
});

export const deleteFAQ = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await FAQ.findByIdAndDelete(req.params.id);
  res.json({ success: true, data: { id: req.params.id } });
});

export const getAnnouncements = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const announcements = await Announcement.find().sort({ pinned: -1, createdAt: -1 }).populate('createdBy', 'name');
  res.json({ success: true, data: { announcements } });
});

export const createAnnouncement = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const a = await Announcement.create({ ...req.body, createdBy: req.user!._id });
  res.status(201).json({ success: true, data: a });
});

export const updateAnnouncement = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const a = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!a) throw new AppError('Announcement not found', 404);
  res.json({ success: true, data: a });
});

export const deleteAnnouncement = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ success: true, data: { id: req.params.id } });
});

export const getHomeContents = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { HomeContent } = require('@/models/HomeContent');
  const contents = await HomeContent.find().sort({ section: 1, order: 1 });
  res.json({ success: true, data: contents });
});

export const createHomeContent = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { HomeContent } = require('@/models/HomeContent');
  const content = await HomeContent.create({ ...req.body, updatedBy: req.user?._id });
  res.status(201).json({ success: true, data: content });
});

export const updateHomeContent = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { HomeContent } = require('@/models/HomeContent');
  const content = await HomeContent.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user?._id }, { new: true, runValidators: true });
  if (!content) throw new AppError('Home content not found', 404);
  res.json({ success: true, data: content });
});

export const deleteHomeContent = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { HomeContent } = require('@/models/HomeContent');
  const content = await HomeContent.findByIdAndDelete(req.params.id);
  if (!content) throw new AppError('Home content not found', 404);
  res.json({ success: true, data: { id: req.params.id } });
});
