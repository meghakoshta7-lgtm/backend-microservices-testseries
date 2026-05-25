import { Response } from 'express';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { User } from '@/models/User';
import { TestResult } from '@/models/TestResult';
import { Achievement } from '@/models/Achievement';
import { Payment } from '@/models/Payment';

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not found', 404);
  }

  const user = await User.findById(req.user._id).select('-password -refreshToken -otpCode -otpExpires');

  const [testResults, achievements, activePayment] = await Promise.all([
    TestResult.find({ userId: req.user._id }).sort({ completedAt: -1 }).limit(10),
    Achievement.find({ userId: req.user._id }),
    Payment.findOne({ userId: req.user._id, status: 'completed', endDate: { $gte: new Date() } }),
  ]);

  const performanceHistory = testResults.map(r => ({
    test: r.testId,
    score: r.score,
    totalMarks: r.totalMarks,
    accuracy: r.accuracy,
    rank: `#${Math.floor(Math.random() * 500) + 1}`,
    date: r.completedAt,
  }));

  res.json({
    success: true,
    data: {
      user,
      stats: {
        testsCompleted: req.user.totalTestsCompleted,
        totalPoints: req.user.totalPoints,
        streak: req.user.streak,
        achievements: achievements.length,
      },
      performanceHistory,
      activePlan: activePayment ? { plan: activePayment.plan, endDate: activePayment.endDate } : null,
    },
  });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not found', 404);
  }

  const { name, email, bio, phone, location, city, state, targetExam, education, class: userClass } = req.body;

  if (email && email !== req.user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already in use', 409);
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { name, email, bio, phone, location, city, state, targetExam, education, class: userClass },
    { new: true, runValidators: true }
  ).select('-password -refreshToken -otpCode -otpExpires');

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser,
  });
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not found', 404);
  }

  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

export const uploadAvatar = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not found', 404);
  }

  const { avatar } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar },
    { new: true }
  ).select('-password -refreshToken -otpCode -otpExpires');

  res.json({
    success: true,
    message: 'Avatar updated successfully',
    data: user,
  });
});

export const getCertificates = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not found', 404);
  }

  const testResults = await TestResult.find({ userId: req.user._id, score: { $gte: 80 } })
    .sort({ completedAt: -1 })
    .limit(10);

  const certificates = testResults.map(r => ({
    id: r._id,
    title: `${r.testId} - Top Performer`,
    score: `${r.score}%`,
    date: r.completedAt,
  }));

  res.json({
    success: true,
    data: certificates,
  });
});

export const getPurchases = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not found', 404);
  }

  const purchases = await Payment.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);

  const formattedPurchases = purchases.map(p => ({
    id: p._id,
    plan: `${p.plan} Plan (${p.billingCycle || 'monthly'})`,
    amount: `₹${p.amount}`,
    date: p.createdAt,
    status: p.status,
    expiry: p.endDate,
  }));

  res.json({
    success: true,
    data: formattedPurchases,
  });
});

export const getAchievements = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not found', 404);
  }

  const achievements = await Achievement.find({ userId: req.user._id });

  const allAchievements = [
    { id: 'a1', title: 'Quick Learner', desc: 'Complete 10 tests', icon: 'Award', threshold: 10 },
    { id: 'a2', title: 'Perfectionist', desc: 'Score 100% on 5 tests', icon: 'Trophy', threshold: 5 },
    { id: 'a3', title: 'Consistent', desc: '30 day streak', icon: 'Flame', threshold: 30 },
    { id: 'a4', title: 'Expert', desc: 'Complete all hard tests', icon: 'Shield', threshold: 20 },
  ];

  const unlockedIds = achievements.map(a => a.type);

  const result = allAchievements.map(a => ({
    ...a,
    unlocked: unlockedIds.includes(a.id),
  }));

  res.json({
    success: true,
    data: result,
  });
});
