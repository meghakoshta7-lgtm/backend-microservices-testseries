import { Response } from 'express';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { User } from '@/models/User';
import { TestResult } from '@/models/TestResult';
import { Test } from '@/models/Test';
import { Achievement } from '@/models/Achievement';
import { Question } from '@/models/Question';
import { Payment } from '@/models/Payment';
import { Notification } from '@/models/Notification';
import { UserStudyProgress } from '@/models/UserStudyProgress';
import { SubscriptionPlan } from '@/models/SubscriptionPlan';
import { isUserPremium, getActiveSubscription } from '@/services';
import { calculateAccuracy, computeAverageScore, computePercentage } from '@/utils';
import { getAvailableTestQuery } from '@/utils/testAvailability';
import { buildFunnyTestNotifications } from '@/utils/funnyNotifications';

export const getStats = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) { throw new AppError('User not found', 404); }
  const userId = req.user._id;
  const [totalTests, testResults, achievements] = await Promise.all([
    Test.countDocuments(getAvailableTestQuery()),
    TestResult.find({ userId }).sort({ completedAt: -1 }).limit(10),
    Achievement.find({ userId }),
  ]);
  let totalScore = 0, totalTimeTaken = 0;
  testResults.forEach((r) => { totalScore += r.score; totalTimeTaken += r.timeTaken || 0; });
  const avgScore = testResults.length > 0 ? Math.round(totalScore / testResults.length) : 0;
  const avgSpeed = testResults.length > 0 && totalTimeTaken > 0 ? Math.round((testResults.reduce((a, r) => a + (r.correctAnswers || 0), 0) / (totalTimeTaken / 60)) * 10) / 10 : 0;
  const consistency = testResults.length > 1 ? Math.round(100 - (testResults.reduce((a, r, i, arr) => { if (i === 0) return 0; return a + Math.abs(r.score - arr[i - 1].score); }, 0) / (testResults.length - 1))) : 0;
  const recentTests = await Promise.all(testResults.slice(0, 5).map(async (result) => {
    const test = await Test.findById(result.testId);
    return { name: test?.name || 'Unknown', score: result.score, total: result.totalMarks, accuracy: result.accuracy, status: result.score >= 70 ? 'success' : result.score >= 50 ? 'warning' : 'danger', date: result.completedAt };
  }));
  const leaderboardRank = await TestResult.aggregate([{ $group: { _id: '$userId', totalScore: { $sum: '$score' } } }, { $sort: { totalScore: -1 } }, { $project: { userId: '$_id', totalScore: 1 } }]);
  const userRank = leaderboardRank.findIndex((r) => r._id.toString() === userId.toString()) + 1;
  const subjectStats: Record<string, { total: number; correct: number; count: number }> = {};
  for (const result of testResults) {
    const questions = await Question.find({ testId: result.testId });
    for (const q of questions) {
      if (!subjectStats[q.subject]) subjectStats[q.subject] = { total: 0, correct: 0, count: 0 };
      subjectStats[q.subject].count++;
      const userAnswer = (result.answers as any)?.get(q._id.toString());
      if (userAnswer !== undefined) { subjectStats[q.subject].total++; if (userAnswer === q.correctAnswer) subjectStats[q.subject].correct++; }
    }
  }
  const subjectPerformance = Object.entries(subjectStats).map(([subject, data]) => ({ subject, score: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0, totalQuestions: data.count }));
  res.json({ success: true, data: { userName: req.user.name, totalTests, completedTests: testResults.length, avgScore, rank: userRank > 0 ? `#${userRank}` : '#--', recentTests, streak: req.user.streak, achievements: achievements.length, accuracy: testResults.length > 0 ? Math.round(testResults.reduce((a, r) => a + r.accuracy, 0) / testResults.length) : 0, avgSpeed, consistency: Math.max(0, Math.min(100, consistency)), subjectPerformance, totalPoints: req.user.totalPoints } });
});

export const getFullDashboard = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) { throw new AppError('User not found', 404); }
  const userId = req.user._id;

  const [results, activePayment, achievements, notifications, studyProgress, plans, allTests] = await Promise.all([
    TestResult.find({ userId }).sort({ completedAt: -1 }).limit(20).populate('testId', 'name category difficulty duration totalQuestions'),
    getActiveSubscription(userId),
    Achievement.find({ userId }),
    Notification.find({}).sort({ createdAt: -1 }).limit(5),
    UserStudyProgress.find({ userId }),
    SubscriptionPlan.find({ isActive: true }).sort({ order: 1 }),
    Test.find(getAvailableTestQuery()).sort({ createdAt: -1 }).limit(30),
  ]);

  const isPremium = !!activePayment;
  const planData = activePayment ? { plan: activePayment.plan, endDate: activePayment.endDate, autoRenew: activePayment.autoRenew } : null;
  const allResults = await TestResult.find({ userId }).sort({ completedAt: -1 });

  // HEADER
  const header = {
    name: req.user.name,
    avatar: req.user.avatar,
    targetExam: req.user.targetExam || '',
    planStatus: isPremium ? 'premium' : 'free',
    planName: planData?.plan || 'Free',
    planEndDate: planData?.endDate || null,
    notificationCount: notifications.length,
    streak: req.user.streak || 0,
  };

  // CONTINUE LEARNING
  const lastIncomplete = results.find(r => r.status !== 'completed');
  const continueLearning = lastIncomplete && lastIncomplete.testId ? {
    testId: (lastIncomplete.testId as any)._id,
    testName: (lastIncomplete.testId as any).name || 'Unknown',
    progress: Math.min(100, Math.round(((lastIncomplete.score || 0) / (lastIncomplete.totalMarks || 1)) * 100)),
    remainingTime: (lastIncomplete.testId as any).duration ? Math.max(0, (lastIncomplete.testId as any).duration * 60 - (lastIncomplete.timeTaken || 0)) : 0,
    category: (lastIncomplete.testId as any).category || '',
  } : results.length > 0 && results[0].testId ? {
    testId: (results[0].testId as any)._id,
    testName: (results[0].testId as any).name || 'Retake',
    progress: 100,
    remainingTime: 0,
    category: (results[0].testId as any).category || '',
  } : null;

  // PREPARATION PROGRESS
  const completedResults = allResults.filter(r => r.status === 'completed');
  const totalTestsAvailable = allTests.length;
  const testsTaken = completedResults.length;
  const overallPercent = totalTestsAvailable > 0 ? Math.min(100, Math.round((testsTaken / totalTestsAvailable) * 100)) : 0;
  const dailyGoal = completedResults.filter(r => {
    const d = new Date(r.completedAt);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyGoal = completedResults.filter(r => new Date(r.completedAt) >= weekAgo).length;

  // SUBJECT PERFORMANCE (from results)
  const subjectMap: Record<string, { total: number; correct: number; count: number }> = {};
  for (const r of results) {
    if (!r.testId) continue;
    const test = r.testId as any;
    const subj = test.category || 'General';
    if (!subjectMap[subj]) subjectMap[subj] = { total: 0, correct: 0, count: 0 };
    subjectMap[subj].count++;
    subjectMap[subj].total++;
    if (r.accuracy >= 60) subjectMap[subj].correct++;
  }
  const subjectPerformance = Object.entries(subjectMap).map(([subject, data]) => ({
    subject, score: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0, weakTopics: [] as string[], improvement: data.count > 1 ? Math.round((data.correct / data.total) * 100) - 50 : 0,
  }));

  // MY PERFORMANCE
  const avgScore = computeAverageScore(completedResults.map(r => r.score));
  const avgAccuracy = completedResults.length > 0 ? Math.round(completedResults.reduce((a, r) => a + r.accuracy, 0) / completedResults.length) : 0;
  const avgSpeed = completedResults.length > 0 && completedResults.reduce((a, r) => a + (r.timeTaken || 0), 0) > 0
    ? Math.round((completedResults.reduce((a, r) => a + (r.correctAnswers || 0), 0) / (completedResults.reduce((a, r) => a + (r.timeTaken || 0), 0) / 60)) * 10) / 10 : 0;
  const leaderboardRank = await TestResult.aggregate([{ $group: { _id: '$userId', totalScore: { $sum: '$score' } } }, { $sort: { totalScore: -1 } }]);
  const rank = leaderboardRank.findIndex((r) => r._id.toString() === userId.toString()) + 1;

  const myPerformance = { totalTests: testsTaken, avgScore, accuracy: avgAccuracy, speed: avgSpeed, rank };

  // RECENT ACTIVITY
  const recentActivity = results.slice(0, 5).map(r => ({
    testId: (r.testId as any)?._id,
    testName: (r.testId as any)?.name || 'Unknown',
    score: r.score,
    totalMarks: r.totalMarks,
    accuracy: r.accuracy,
    completedAt: r.completedAt,
    correctAnswers: r.correctAnswers,
    wrongAnswers: r.wrongAnswers,
  }));
  const bookmarkedCount = await UserStudyProgress.countDocuments({ userId, isBookmarked: true });

  // UPCOMING TESTS
  const now = new Date();
  const upcomingTestsList = allTests.filter(t => t.scheduledAt && new Date(t.scheduledAt) > now).slice(0, 5).map(t => ({
    _id: t._id, name: t.name, category: t.category, difficulty: t.difficulty, scheduledAt: t.scheduledAt, duration: t.duration,
  }));
  const liveTests = allTests.filter(t => t.scheduledAt && Math.abs(new Date(t.scheduledAt).getTime() - now.getTime()) < 3600000).slice(0, 3).map(t => ({
    _id: t._id, name: t.name, category: t.category, difficulty: t.difficulty, duration: t.duration,
  }));
  const upcomingTests = { scheduled: upcomingTestsList, live: liveTests, upcoming: upcomingTestsList.slice(0, 3) };

  // TEST LIBRARY
  const mockTests = allTests.filter(t => t.category === 'mock' || t.name.toLowerCase().includes('mock')).slice(0, 8);
  const topicTests = allTests.filter(t => t.category !== 'mock' && !t.name.toLowerCase().includes('mock')).slice(0, 8);
  const pyq = allTests.filter(t => t.tags?.includes('pyq') || t.name.toLowerCase().includes('previous')).slice(0, 8);
  const miniTests = allTests.filter(t => (t.totalQuestions || 0) <= 10).slice(0, 8);
  const testLibrary = {
    mockTests: mockTests.map(t => ({ _id: t._id, name: t.name, difficulty: t.difficulty, duration: t.duration, totalQuestions: t.totalQuestions, isPremium: t.isPremium })),
    topicTests: topicTests.map(t => ({ _id: t._id, name: t.name, difficulty: t.difficulty, duration: t.duration, totalQuestions: t.totalQuestions, isPremium: t.isPremium })),
    pyq: pyq.map(t => ({ _id: t._id, name: t.name, difficulty: t.difficulty, duration: t.duration, totalQuestions: t.totalQuestions, isPremium: t.isPremium })),
    miniTests: miniTests.map(t => ({ _id: t._id, name: t.name, difficulty: t.difficulty, duration: t.duration, totalQuestions: t.totalQuestions, isPremium: t.isPremium })),
  };

  // ANALYTICS
  const totalTimeSpent = completedResults.reduce((a, r) => a + (r.timeTaken || 0), 0);
  const analytics = { totalTimeSpent, attemptTrend: completedResults.length, accuracyTrend: avgAccuracy };

  // REWARDS
  const badges = achievements.map(a => ({ id: a._id, title: a.title, description: a.description, icon: a.icon, unlockedAt: a.unlockedAt }));

  // SUBSCRIPTION
  const subscription = isPremium && planData ? {
    isPremium, plan: planData.plan, endDate: planData.endDate, autoRenew: planData.autoRenew,
    features: plans.find(p => p.slug === planData.plan)?.features || [],
  } : null;

  // RECOMMENDED
  const weakSubjects = subjectPerformance.filter(s => s.score < 60).map(s => s.subject);
  const recommended = {
    weakTopics: weakSubjects,
    todayTest: allTests.filter(t => !t.isPremium).slice(0, 1).map(t => ({ _id: t._id, name: t.name, duration: t.duration })),
    suggestedMock: allTests.filter(t => t.category === 'mock' || t.name.toLowerCase().includes('mock')).slice(0, 2).map(t => ({ _id: t._id, name: t.name, duration: t.duration, difficulty: t.difficulty })),
    pendingRevision: subjectPerformance.filter(s => s.score < 50).length > 0 ? subjectPerformance.filter(s => s.score < 50).map(s => ({ subject: s.subject, score: s.score })) : [],
  };

  // NOTIFICATIONS
  const funnyNotifications = buildFunnyTestNotifications({
    userId,
    tests: allTests,
    recentResults: allResults,
    streak: req.user.streak || 0,
  });
  const notificationsData = [
    ...funnyNotifications,
    ...(await Notification.find({}).sort({ createdAt: -1 }).limit(6)).map(n => ({
      _id: n._id,
      title: n.title,
      body: n.body,
      message: n.body,
      type: n.type,
      createdAt: n.createdAt,
      isRead: n.status !== 'sent',
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

  res.json({
    success: true,
    data: {
      header, continueLearning, preparationProgress: { overallPercent, dailyGoal, weeklyGoal, streak: req.user.streak || 0, subjectProgress: subjectPerformance, topicProgress: [], testProgress: testsTaken },
      recommended, upcomingTests, myPerformance, subjectPerformance, recentActivity,
      testLibrary, analytics, rewards: { badges, streak: req.user.streak || 0, achievements: achievements.length },
      subscription, notifications: { unread: notificationsData.filter(n => !n.isRead).length, items: notificationsData },
    },
  });
});
