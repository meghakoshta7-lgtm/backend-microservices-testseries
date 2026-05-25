import { Response } from 'express';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { User } from '@/models/User';
import { TestResult } from '@/models/TestResult';
import { Enrollment } from '@/models/Enrollment';
import { MaterialPurchase } from '@/models/MaterialPurchase';
import { ActivityLog } from '@/models/ActivityLog';

export const getAllBookmarks = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const users = await User.find({ bookmarkedQuestions: { $exists: true, $not: { $size: 0 } } }).select('name email bookmarkedQuestions');
  const mapped = users.map(u => ({ id: u._id, name: u.name, email: u.email, bookmarkedCount: u.bookmarkedQuestions?.length || 0 }));
  const totalBookmarks = mapped.reduce((sum, u) => sum + u.bookmarkedCount, 0);
  res.json({ success: true, data: { users: mapped, totalBookmarks } });
});

export const getLeaderboard = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { timeFilter = 'alltime', page: pageStr = '1', limit: limitStr = '20' } = req.query;
  const page = parseInt(pageStr as string) || 1;
  const limit = parseInt(limitStr as string) || 20;

  let dateFilter: any = {};
  const now = new Date();

  if (timeFilter === 'daily') {
    dateFilter = { completedAt: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } };
  } else if (timeFilter === 'weekly') {
    dateFilter = { completedAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
  } else if (timeFilter === 'monthly') {
    dateFilter = { completedAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
  }

  const leaderboard = await TestResult.aggregate([
    { $match: dateFilter },
    { $group: { _id: '$userId', totalScore: { $sum: '$score' }, testsCompleted: { $sum: 1 }, avgScore: { $avg: '$score' }, lastActive: { $max: '$completedAt' } } },
    { $sort: { totalScore: -1 } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { _id: 0, userId: '$_id', name: '$user.name', email: '$user.email', avatar: '$user.avatar', totalScore: 1, testsCompleted: 1, avgScore: { $round: ['$avgScore', 0] }, streak: '$user.streak', lastActive: 1 } },
  ]);

  const skip = (page - 1) * limit;
  const paginated = leaderboard.slice(skip, skip + limit);
  const ranked = paginated.map((entry, index) => ({ ...entry, rank: skip + index + 1 }));

  res.json({ success: true, data: { entries: ranked, total: leaderboard.length, page, limit, hasMore: skip + paginated.length < leaderboard.length } });
});

export const getReviews = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { Review } = require('@/models/Review');
  const filter: Record<string, any> = {};
  if (req.query.entityType) filter.entityType = req.query.entityType;
  if (req.query.status) filter.status = req.query.status;
  const reviews = await Review.find(filter).populate('reviewerId', 'name email').sort({ createdAt: -1 });
  res.json({ success: true, data: reviews });
});

export const createReview = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { Review } = require('@/models/Review');
  const review = await Review.create({ ...req.body, reviewerId: req.user?._id });
  await ActivityLog.create({ userId: req.user?._id, action: 'create_review', resource: 'Review', details: { entityType: review.entityType, entityId: review.entityId } });
  res.status(201).json({ success: true, message: 'Review created', data: review });
});

export const updateReviewStatus = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { Review } = require('@/models/Review');
  const { status, comments } = req.body;
  const review = await Review.findByIdAndUpdate(req.params.id, { status, comments, reviewerId: req.user?._id }, { new: true, runValidators: true });
  if (!review) throw new AppError('Review not found', 404);
  await ActivityLog.create({ userId: req.user?._id, action: 'update_review_status', resource: 'Review', details: { id: req.params.id, status } });
  res.json({ success: true, message: `Review ${status}`, data: review });
});

export const deleteReview = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { Review } = require('@/models/Review');
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw new AppError('Review not found', 404);
  await ActivityLog.create({ userId: req.user?._id, action: 'delete_review', resource: 'Review', details: { id: req.params.id } });
  res.json({ success: true, message: 'Review deleted' });
});

export const getEnrollments = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;

  const [enrollments, total] = await Promise.all([
    Enrollment.find()
      .populate('userId', 'name email phone')
      .populate('testId', 'name category subject duration')
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Enrollment.countDocuments(),
  ]);

  res.json({
    success: true,
    data: { enrollments, total, page, totalPages: Math.ceil(total / limit) },
  });
});

export const getMaterialPurchases = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;

  const [purchases, total] = await Promise.all([
    MaterialPurchase.find()
      .populate('userId', 'name email phone')
      .populate('materialId', 'title category pricing')
      .sort({ purchasedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    MaterialPurchase.countDocuments(),
  ]);

  res.json({
    success: true,
    data: { purchases, total, page, totalPages: Math.ceil(total / limit) },
  });
});
