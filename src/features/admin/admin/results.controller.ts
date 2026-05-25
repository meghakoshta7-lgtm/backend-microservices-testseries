import { Response } from 'express';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { User } from '@/models/User';
import { Test } from '@/models/Test';
import { TestResult } from '@/models/TestResult';

export const getResults = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const testId = (req.query.testId as string) || '';

  const query: Record<string, any> = {};
  if (testId) query.testId = testId;

  const [results, total] = await Promise.all([
    TestResult.find(query).sort({ completedAt: -1 }).skip((page - 1) * limit).limit(limit).populate('userId', 'name email'),
    TestResult.countDocuments(query),
  ]);

  const mapped = await Promise.all(results.map(async r => {
    const user = r.userId as any;
    const test = await Test.findById(r.testId).select('name');
    return {
      id: r._id, userId: r.userId._id || r.userId, userName: user?.name || 'Unknown', userEmail: user?.email || '',
      testId: r.testId, testTitle: test?.name || 'Unknown', score: r.score, totalMarks: r.totalMarks,
      correctAnswers: r.correctAnswers, wrongAnswers: r.wrongAnswers, skippedAnswers: r.skippedAnswers,
      accuracy: r.accuracy, timeTaken: r.timeTaken, rank: 0, completedAt: r.completedAt,
    };
  }));

  res.json({ success: true, data: { results: mapped, totalResults: total, totalPages: Math.ceil(total / limit), currentPage: page } });
});

export const generateRanks = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { testId } = req.params;
  const results = await TestResult.find({ testId }).sort({ score: -1, timeTaken: 1 });
  const ranked = results.map((r, i) => ({ resultId: r._id, rank: i + 1 }));
  res.json({ success: true, data: { ranks: ranked, total: ranked.length } });
});

export const getStudentProgress = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = await User.findById(id).select('name email totalTestsCompleted totalAttempts averageScore accuracy totalTimeSpent');
  if (!user) throw new AppError('User not found', 404);
  const results = await TestResult.find({ userId: id }).sort({ completedAt: -1 }).populate('testId', 'name category');
  const topicPerf: Record<string, { total: number; correct: number }> = {};
  results.forEach(r => {
    const test = r.testId as any;
    const key = test?.category || 'general';
    if (!topicPerf[key]) topicPerf[key] = { total: 0, correct: 0 };
    topicPerf[key].total++;
    topicPerf[key].correct += r.correctAnswers;
  });
  const topicWise = Object.entries(topicPerf).map(([topic, d]) => ({ topic, score: Math.round((d.correct / Math.max(d.total, 1)) * 100) }));
  res.json({ success: true, data: { ...user.toObject(), id: user._id, topicWise, recentResults: results.slice(0, 10) } });
});

export const exportResults = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { testId } = req.query;
  const query: Record<string, any> = {};
  if (testId) query.testId = testId;
  const results = await TestResult.find(query).sort({ completedAt: -1 }).populate('userId', 'name email');
  const csv = 'Name,Email,Score,Total,Accuracy,Time Taken,Completed At\n' + results.map(r => {
    const u = r.userId as any;
    return `${u?.name || 'Unknown'},${u?.email || ''},${r.score},${r.totalMarks},${r.accuracy}%,${r.timeTaken}s,${r.completedAt.toISOString()}`;
  }).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=results.csv');
  res.send(csv);
});
