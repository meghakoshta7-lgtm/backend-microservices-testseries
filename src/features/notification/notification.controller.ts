import { Response } from 'express';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { TestResult } from '@/models/TestResult';
import { Achievement } from '@/models/Achievement';

export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.json({ success: true, data: { items: [], total: 0 } });
    return;
  }

  const { filter = 'all', page = 1, limit = 20 } = req.query;

  const notifications: any[] = [];

  const recentResults = await TestResult.find({ userId: req.user._id })
    .sort({ completedAt: -1 })
    .limit(5)
    .populate('testId', 'name');

  recentResults.forEach((result) => {
    notifications.push({
      id: result._id,
      type: 'test',
      title: 'Test Result Available',
      message: `Your ${result.testId ? (result.testId as any).name : 'test'} results are ready. You scored ${result.score}%.`,
      time: result.completedAt,
      read: true,
    });
  });

  const achievements = await Achievement.find({ userId: req.user._id }).sort({ unlockedAt: -1 }).limit(5);

  achievements.forEach((achievement) => {
    notifications.push({
      id: achievement._id,
      type: 'achievement',
      title: 'New Achievement Unlocked!',
      message: `Congratulations! You earned the "${achievement.title}" badge.`,
      time: achievement.unlockedAt,
      read: false,
    });
  });

  notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const skip = (Number(page) - 1) * Number(limit);
  const paginatedNotifications = notifications.slice(skip, skip + Number(limit));

  res.json({
    success: true,
    data: {
      items: paginatedNotifications,
      total: notifications.length,
      page: Number(page),
      limit: Number(limit),
      hasMore: skip + paginatedNotifications.length < notifications.length,
      unreadCount: notifications.filter((n) => !n.read).length,
    },
  });
});

export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: 'Notification marked as read',
  });
});

export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
});

export const deleteNotification = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: 'Notification deleted',
  });
});
