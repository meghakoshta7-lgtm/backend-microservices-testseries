import { Response } from 'express';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { ActivityLog } from '@/models/ActivityLog';

let settingsStore: Record<string, any> = {
  siteName: 'DreamBoost', siteDescription: "India's #1 Exam Preparation Platform", logoUrl: '', faviconUrl: '',
  primaryColor: '#3273e6', secondaryColor: '#f7941d', supportEmail: 'support@dreamboost.com',
  minPasswordLength: 6, maxLoginAttempts: 5, sessionTimeout: 60, timezone: 'Asia/Kolkata', language: 'en',
  examPatterns: [{ name: 'SSC', subjects: ['General Intelligence', 'General Awareness', 'Quantitative Aptitude', 'English'] },
    { name: 'Banking', subjects: ['Reasoning', 'Quantitative Aptitude', 'English', 'General Awareness'] }],
  smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', fromEmail: '',
  otpEnabled: true, twoFactorEnabled: false, antiCheatingEnabled: true,
};

export const getSettings = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, data: settingsStore });
});

export const updateSettings = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  settingsStore = { ...settingsStore, ...req.body };
  await ActivityLog.create({ userId: req.user!._id, action: 'update_settings', resource: 'settings' });
  res.json({ success: true, message: 'Settings updated', data: settingsStore });
});
