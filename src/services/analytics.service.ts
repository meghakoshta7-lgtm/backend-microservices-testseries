import { Payment } from '@/models/Payment';
import { TestResult } from '@/models/TestResult';
import { User } from '@/models/User';
import { Test } from '@/models/Test';

const colors = ['#3273e6', '#f7941d', '#3ca350', '#e84d55', '#8b5cf6', '#06b6d4', '#f43f5e', '#10b981'];

export const getAggregatedRevenue = async (since?: Date) => {
  const match: Record<string, any> = { status: 'completed' };
  if (since) match.createdAt = { $gte: since };
  const [result] = await Payment.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return result?.total || 0;
};

export const getUserGrowth = async (since: Date) => {
  return User.aggregate([
    { $match: { role: 'user', createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
};

export const getRevenueOverTime = async (since: Date) => {
  return Payment.aggregate([
    { $match: { status: 'completed', createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
};

export const getTestsTakenOverTime = async (since: Date) => {
  return TestResult.aggregate([
    { $match: { completedAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
};

export const getTopExams = async (since: Date, limit = 5) => {
  const topRaw = await TestResult.aggregate([
    { $match: { completedAt: { $gte: since } } },
    { $group: { _id: '$testId', avgScore: { $avg: '$score' }, attempts: { $sum: 1 } } },
    { $sort: { attempts: -1 } },
    { $limit: limit },
  ]);
  const testIds = topRaw.map((e: any) => e._id);
  const tests = await Test.find({ _id: { $in: testIds } }).select('name');
  const nameMap = new Map(tests.map((t: any) => [t._id.toString(), t.name]));
  return topRaw.map((e: any, i: number) => ({
    name: nameMap.get(e._id.toString()) || `Exam ${i + 1}`,
    attempts: e.attempts,
    avgScore: Math.round(e.avgScore),
    color: colors[i % colors.length],
  }));
};

export const getAverageScore = async (since?: Date) => {
  const match: Record<string, any> = {};
  if (since) match.completedAt = { $gte: since };
  const [result] = await TestResult.aggregate([
    { $match: match },
    { $group: { _id: null, avgScore: { $avg: '$score' } } },
  ]);
  return result ? Math.round(result.avgScore) : 0;
};

export const getCompletionStats = async () => {
  const [result] = await TestResult.aggregate([
    { $group: { _id: null, totalCompleted: { $sum: 1 }, totalStarted: { $sum: 1 } } },
  ]);
  return result ? { totalCompleted: result.totalCompleted, totalStarted: result.totalStarted } : { totalCompleted: 0, totalStarted: 0 };
};

export const getTestAttemptStats = async () => {
  return TestResult.aggregate([
    { $group: { _id: '$testId', count: { $sum: 1 }, avgScore: { $avg: '$score' } } },
  ]);
};

export const getLeaderboardAggregation = (dateFilter: Record<string, any> = {}) => {
  return TestResult.aggregate([
    { $match: dateFilter },
    { $group: { _id: '$userId', totalScore: { $sum: '$score' }, testsCompleted: { $sum: 1 }, avgScore: { $avg: '$score' }, lastActive: { $max: '$completedAt' } } },
    { $sort: { totalScore: -1 } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { _id: 0, userId: '$_id', name: '$user.name', email: '$user.email', avatar: '$user.avatar', totalScore: 1, testsCompleted: 1, avgScore: { $round: ['$avgScore', 0] }, streak: '$user.streak', lastActive: 1 } },
  ]);
};
