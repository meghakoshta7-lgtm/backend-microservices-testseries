import { Response } from 'express';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { User } from '@/models/User';

export const updateNotificationPreferences = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const { emailNotifications, testReminders, leaderboardUpdates, promotionalEmails, resultNotifications, achievementAlerts, systemUpdates } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      notificationPreferences: {
        emailNotifications,
        testReminders,
        leaderboardUpdates,
        promotionalEmails,
        resultNotifications,
        achievementAlerts,
        systemUpdates,
      },
    },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    message: 'Notification preferences updated',
    data: user.notificationPreferences,
  });
});

export const updateAppearanceSettings = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const { theme, fontSize, compactMode } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      appearanceSettings: {
        theme,
        fontSize,
        compactMode,
      },
    },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    message: 'Appearance settings updated',
    data: user.appearanceSettings,
  });
});

export const getSettings = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const user = await User.findById(req.user._id).select('notificationPreferences appearanceSettings');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: {
      notificationPreferences: user.notificationPreferences || {
        emailNotifications: true,
        testReminders: true,
        leaderboardUpdates: false,
        promotionalEmails: false,
        resultNotifications: true,
        achievementAlerts: true,
        systemUpdates: true,
      },
      appearanceSettings: user.appearanceSettings || {
        theme: 'light',
        fontSize: 'medium',
        compactMode: false,
      },
    },
  });
});

export const logoutAllSessions = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  await User.findByIdAndUpdate(req.user._id, { refreshToken: undefined });

  res.json({
    success: true,
    message: 'Logged out from all other sessions',
  });
});
