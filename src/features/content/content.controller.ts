import { Response } from 'express';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { Banner } from '@/models/Banner';
import { Announcement } from '@/models/Announcement';
import { Question } from '@/models/Question';

export const getActiveBanners = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const now = new Date();
  const banners = await Banner.find({
    isActive: true,
    $and: [
      { $or: [{ startsAt: { $exists: false } }, { startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gte: now } }] },
    ],
  }).sort({ priority: -1, createdAt: -1 });
  res.json({ success: true, data: { banners } });
});

export const getActiveAnnouncements = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const announcements = await Announcement.find({ isActive: true }).sort({ pinned: -1, createdAt: -1 }).populate('createdBy', 'name');
  res.json({ success: true, data: { announcements } });
});

export const bookmarkQuestion = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { questionId } = req.body;
  if (!questionId) throw new Error('Question ID required');
  const user = req.user!;
  const bookmarks = user.bookmarkedQuestions || [];
  if (bookmarks.includes(questionId)) {
    res.json({ success: true, data: { bookmarked: true, message: 'Already bookmarked' } });
    return;
  }
  bookmarks.push(questionId);
  user.bookmarkedQuestions = bookmarks;
  await user.save();
  res.json({ success: true, data: { bookmarked: true, count: bookmarks.length } });
});

export const removeBookmark = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { questionId } = req.params;
  const user = req.user!;
  user.bookmarkedQuestions = (user.bookmarkedQuestions || []).filter((id: any) => id.toString() !== questionId);
  await user.save();
  res.json({ success: true, data: { bookmarked: false, count: user.bookmarkedQuestions.length } });
});

export const getBookmarkedQuestions = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const bookmarkIds = user.bookmarkedQuestions || [];
  const questions = await Question.find({ _id: { $in: bookmarkIds } }).select('-correctAnswer');
  res.json({ success: true, data: { questions, count: bookmarkIds.length } });
});

export const getActiveHomeContent = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { HomeContent } = require('@/models/HomeContent');
  const contents = await HomeContent.find({ isActive: true }).sort({ section: 1, order: 1 });
  res.json({ success: true, data: contents });
});
