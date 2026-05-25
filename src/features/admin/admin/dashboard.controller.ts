import { Response } from 'express';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { User } from '@/models/User';
import { Test } from '@/models/Test';
import { Payment } from '@/models/Payment';
import { TestResult } from '@/models/TestResult';
import { Ticket } from '@/models/Ticket';

const colors = ['#3273e6', '#f7941d', '#3ca350', '#e84d55', '#8b5cf6', '#06b6d4', '#f43f5e', '#10b981'];

export const getDashboard = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalUsers, totalTests, attemptsCount, newUsersToday, testsTakenToday, revenueAgg, revenueTodayAgg, recentUsers, userGrowthRaw, testsByCategory, completionAgg, paymentCount, openTickets, purchasedUsersAgg, pendingReviews] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Test.countDocuments(),
    TestResult.countDocuments(),
    User.countDocuments({ role: 'user', createdAt: { $gte: todayStart } }),
    TestResult.countDocuments({ completedAt: { $gte: todayStart } }),
    Payment.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Payment.aggregate([{ $match: { status: 'completed', createdAt: { $gte: todayStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(8).select('name email createdAt'),
    User.aggregate([{ $match: { role: 'user', createdAt: { $gte: thirtyDaysAgo } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }, { $limit: 30 }]),
    Test.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    TestResult.aggregate([{ $group: { _id: null, avgScore: { $avg: '$score' }, total: { $sum: 1 } } }]),
    Payment.countDocuments({ status: 'completed' }),
    Ticket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
    Payment.distinct('userId', { status: 'completed' }),
    (async () => { try { const { Review } = require('@/models/Review'); return await Review.countDocuments({ status: { $in: ['draft', 'review'] } }); } catch { return 0; } })(),
  ]);

  const totalRevenue = revenueAgg[0]?.total || 0;
  const revenueToday = revenueTodayAgg[0]?.total || 0;
  const completionRate = completionAgg[0] ? Math.round(completionAgg[0].avgScore) : 0;
  const purchasedUsers = purchasedUsersAgg.length;
  const conversionRate = totalUsers > 0 ? Math.round((purchasedUsers / totalUsers) * 100) : 0;
  const recentActivity = recentUsers.map(u => ({ id: u._id, userName: u.name, userAvatar: '', action: 'User registered', target: '', time: u.createdAt.toISOString(), type: 'user' as const }));
  let cum = 0;
  const userGrowth = userGrowthRaw.map((u: any) => { cum += u.count; return { label: u._id, value: cum }; });
  const revenueChart = userGrowthRaw.map((u: any) => ({ label: u._id, value: 0 }));
  const testsByCategoryChart = testsByCategory.map((t: any, i: number) => ({ label: t._id, value: t.count, color: colors[i % colors.length] }));

  res.json({ success: true, data: { totalUsers, totalTests, totalRevenue, attemptsCount, activeUsers: attemptsCount > 0 ? totalUsers : 0, purchasedUsers, conversionRate, pendingReviews, newUsersToday, testsTakenToday, revenueToday, recentActivity, userGrowth, revenueChart, testsByCategory: testsByCategoryChart, testCompletionRate: completionRate, totalPayments: paymentCount, openTickets } });
});
