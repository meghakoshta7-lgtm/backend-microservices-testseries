import { Response } from 'express';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { TestResult } from '@/models/TestResult';
import { Achievement } from '@/models/Achievement';
import { Test } from '@/models/Test';
import { buildFunnyResultMessage, buildFunnyTestNotifications } from '@/utils/funnyNotifications';
import { getAvailableTestQuery } from '@/utils/testAvailability';

export const getNotifications = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.json({ success: true, data: { items: [], total: 0 } });
    return;
  }

  const { filter = 'all', page = 1, limit = 20 } = req.query;

  const notifications: any[] = [];

  const [recentResults, availableTests] = await Promise.all([
    TestResult.find({ userId: req.user._id })
      .sort({ completedAt: -1 })
      .limit(5)
      .populate('testId', 'name'),
    Test.find(getAvailableTestQuery()).sort({ createdAt: -1 }).limit(4).select('name duration'),
  ]);

  notifications.push(...buildFunnyTestNotifications({
    userId: req.user._id,
    tests: availableTests,
    recentResults,
    streak: req.user.streak || 0,
  }));

  recentResults.forEach((result) => {
    const testName = result.testId ? (result.testId as any).name : 'test';
    const message = buildFunnyResultMessage(testName, result.score);
    notifications.push({
      _id: result._id,
      id: result._id,
      type: 'result',
      title: 'Scorecard aa gaya',
      message,
      body: message,
      createdAt: result.completedAt,
      time: result.completedAt,
      isRead: true,
      read: true,
    });
  });

  const achievements = await Achievement.find({ userId: req.user._id }).sort({ unlockedAt: -1 }).limit(5);

  achievements.forEach((achievement) => {
    notifications.push({
      _id: achievement._id,
      id: achievement._id,
      type: 'achievement',
      title: 'Badge unlocked',
      message: `Achievement shelf me naya badge: "${achievement.title}". Nice, ab next test bhi de do.`,
      body: `Achievement shelf me naya badge: "${achievement.title}". Nice, ab next test bhi de do.`,
      createdAt: achievement.unlockedAt,
      time: achievement.unlockedAt,
      isRead: false,
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
