import { Response } from 'express';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { User } from '@/models/User';
import { Test } from '@/models/Test';
import { Payment } from '@/models/Payment';
import { TestResult } from '@/models/TestResult';
import { sinceDate } from '@/utils';
import {
  getAggregatedRevenue,
  getUserGrowth,
  getRevenueOverTime,
  getTestsTakenOverTime,
  getTopExams,
  getAverageScore,
  getCompletionStats,
} from '@/services';

export const getAnalytics = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const period = (req.query.period as string) || '30d';
  const since = sinceDate(period);

  const [totalUsers, totalTests, totalRevenue, activeUsers, userGrowth, revenueData, testsTaken, topExams, averageScore, completionStats] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Test.countDocuments(),
    getAggregatedRevenue(),
    User.countDocuments({ role: 'user', lastActiveDate: { $gte: since } }),
    getUserGrowth(since),
    getRevenueOverTime(since),
    getTestsTakenOverTime(since),
    getTopExams(since),
    getAverageScore(since),
    getCompletionStats(),
  ]);

  const completionRate = completionStats.totalStarted > 0
    ? Math.round((completionStats.totalCompleted / completionStats.totalStarted) * 100) : 0;
  const testsTakenChart = testsTaken.map((t: any) => t.count);

  res.json({ success: true, data: { totalUsers, totalTests, totalRevenue, activeUsers, userGrowth, revenueData, testsTaken: testsTakenChart, topExams, averageScore, completionRate, period } });
});

export const getRevenueReport = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const period = (req.query.period as string) || '30d';
  const since = sinceDate(period);
  const data = await Payment.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$amount' }, count: { $sum: 1 }, refunds: { $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, '$amount', 0] } } } },
    { $sort: { _id: 1 } },
  ]);
  res.json({ success: true, data: { report: data, period } });
});

export const getAttemptReport = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { testId } = req.query;
  const match: Record<string, any> = {};
  if (testId) match.testId = testId;
  const data = await TestResult.aggregate([
    { $match: match },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, count: { $sum: 1 }, avgScore: { $avg: '$score' } } },
    { $sort: { _id: 1 } },
  ]);
  res.json({ success: true, data: { report: data } });
});

export const exportReportCSV = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { type } = req.params;
  let csv = '';
  if (type === 'users') {
    const users = await User.find({ role: 'user' }).select('name email phone totalTestsCompleted averageScore lastActiveDate createdAt');
    csv = 'Name,Email,Phone,Tests Completed,Avg Score,Last Active,Created At\n' + users.map(u => `${u.name},${u.email},${u.phone || ''},${u.totalTestsCompleted || 0},${u.averageScore || 0}%,${u.lastActiveDate?.toISOString()?.split('T')[0] || ''},${u.createdAt?.toISOString()?.split('T')[0] || ''}`).join('\n');
  } else if (type === 'payments') {
    const payments = await Payment.find().sort({ createdAt: -1 }).populate('userId', 'name email');
    csv = 'Transaction ID,User,Email,Plan,Amount,Status,Date\n' + payments.map(p => {
      const u = p.userId as any;
      return `${p.transactionId},${u?.name || 'Unknown'},${u?.email || ''},${p.plan},${p.amount},${p.status},${p.createdAt?.toISOString()?.split('T')[0] || ''}`;
    }).join('\n');
  } else {
    const results = await TestResult.find().sort({ completedAt: -1 }).populate('userId', 'name email').populate('testId', 'name');
    csv = 'Name,Email,Test,Score,Total,Accuracy,Completed At\n' + results.map(r => {
      const u = r.userId as any;
      const t = r.testId as any;
      return `${u?.name || 'Unknown'},${u?.email || ''},${t?.name || 'Unknown'},${r.score},${r.totalMarks},${r.accuracy}%,${r.completedAt?.toISOString()?.split('T')[0] || ''}`;
    }).join('\n');
  }
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
  res.send(csv);
});
