import { Response } from 'express';
import mongoose from 'mongoose';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { Test } from '@/models/Test';
import { Question } from '@/models/Question';
import { TestResult } from '@/models/TestResult';
import { User } from '@/models/User';
import { Enrollment } from '@/models/Enrollment';
import { sendTestCompletionEmail, sendTestEnrollmentEmail } from '@/services';
import { isUserPremium } from '@/services';
import { calculateAccuracy, computeTopicPerformance, getCorrectAnswerIndex, isAnswerCorrect } from '@/utils';
import { deactivateExpiredTests, getAvailableTestQuery } from '@/utils/testAvailability';

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const isSameDay = (a?: Date | null, b?: Date | null) => {
  if (!a || !b) return false;
  return startOfDay(a).getTime() === startOfDay(b).getTime();
};

const buildStreakMessage = (streak: number, awarded: boolean) => {
  if (!awarded) return 'Daily streak already counted today.';
  if (streak <= 1) return 'Great start! Your daily test streak has begun.';
  return `Amazing! Your daily test streak is now ${streak} days.`;
};

export const getTests = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await deactivateExpiredTests(Test);

  const { category, subject, difficulty, search, page = 1, limit = 10 } = req.query;

  const query: any = getAvailableTestQuery();

  if (category) query.category = category;
  if (subject) query.subject = subject;
  if (difficulty) query.difficulty = difficulty;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const premium = req.user ? await isUserPremium(req.user._id) : false;
  if (!premium) {
    query.isPremium = false;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [tests, total] = await Promise.all([
    Test.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-__v'),
    Test.countDocuments(query),
  ]);

  const testsWithQuestionCount = await Promise.all(
    tests.map(async (test) => {
      const questionCount = await Question.countDocuments({ testId: test._id });
      return { ...test.toObject(), questionCount };
    })
  );

  res.json({
    success: true,
    data: {
      items: testsWithQuestionCount,
      total,
      page: Number(page),
      limit: Number(limit),
      hasMore: skip + tests.length < total,
    },
  });
});

export const getTest = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await deactivateExpiredTests(Test);

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid test ID', 400);
  }

  const test = await Test.findOne(getAvailableTestQuery({ _id: id }));
  if (!test) {
    throw new AppError('Test not found', 404);
  }

  const hasAccess = !test.isPremium || (req.user ? await isUserPremium(req.user._id) : false);

  if (!hasAccess) {
    const testObj = test.toObject();
    res.json({
      success: true,
      data: {
        ...testObj,
        questions: [],
        isLocked: true,
        previousResult: null,
      },
    });
    return;
  }

  const rawQuestions = await Question.find({ testId: id, isActive: true }).select('-correctAnswer -explanation -__v');
  const questions = rawQuestions.map(q => ({
    _id: q._id,
    testId: q.testId,
    type: q.type,
    question: q.text,
    options: Array.isArray(q.options) ? q.options.map(o => (typeof o === 'string' ? o : o.text || '')) : [],
    difficulty: q.difficulty,
    marks: q.marks,
    negativeMarks: q.negativeMarks ?? test.negativeMarks ?? 0,
    subject: q.subject,
    topic: q.topic || '',
    section: q.section || 'General',
    sectionName: q.sectionName || 'General',
    image: q.image || '',
    attachmentUrl: q.attachmentUrl || '',
    attachmentType: q.attachmentType || '',
  }));

  const userResult = req.user
    ? await TestResult.findOne({ userId: req.user._id, testId: id }).sort({ completedAt: -1 })
    : null;

  res.json({
    success: true,
    data: {
      ...test.toObject(),
      questions,
      previousResult: userResult
        ? { score: userResult.score, status: userResult.status }
        : null,
    },
  });
});

export const submitTest = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const { id } = req.params;
  const { answers, timeTaken, startedAt, completedAt } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid test ID', 400);
  }

  const test = await Test.findOne(getAvailableTestQuery({ _id: id }));
  if (!test) {
    throw new AppError('Test not found', 404);
  }

  if (test.isPremium && !(await isUserPremium(req.user._id))) {
    throw new AppError('Please purchase a plan to access this premium test', 403);
  }

  const questions = await Question.find({ testId: id, isActive: true });

  let correctAnswers = 0;
  let wrongAnswers = 0;
  let skippedAnswers = 0;
  let score = 0;

  questions.forEach((q) => {
    const userAnswer = answers[q._id.toString()];
    if (userAnswer === undefined || userAnswer === null) {
      skippedAnswers++;
    } else if (isAnswerCorrect(q, userAnswer)) {
      correctAnswers++;
      score += q.marks;
    } else {
      wrongAnswers++;
      const negativeMarks = q.negativeMarks ?? test.negativeMarks ?? 0;
      if (negativeMarks > 0) {
        score -= negativeMarks;
      }
    }
  });

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  const accuracy = calculateAccuracy(correctAnswers, correctAnswers + wrongAnswers);
  const completedDate = new Date(completedAt);
  const completedDayStart = startOfDay(completedDate);
  const nextDayStart = new Date(completedDayStart.getTime() + DAY_MS);
  const previousDayStart = new Date(completedDayStart.getTime() - DAY_MS);
  const user = await User.findById(req.user._id).select('streak lastStreakDate');
  let currentStreak = user?.streak || 0;
  const streakAwarded = !isSameDay(user?.lastStreakDate, completedDate);

  if (streakAwarded) {
    currentStreak = isSameDay(user?.lastStreakDate, previousDayStart) ? currentStreak + 1 : 1;
  }

  const testResult = await TestResult.create({
    userId: req.user._id,
    testId: id,
    answers,
    score: Math.max(0, score),
    totalMarks,
    correctAnswers,
    wrongAnswers,
    skippedAnswers,
    accuracy,
    timeTaken,
    startedAt: new Date(startedAt),
    completedAt: completedDate,
    status: 'completed',
    streakAwarded,
    streakCount: currentStreak,
  });

  const premiumCount = await Test.countDocuments(getAvailableTestQuery({ category: test.category, isPremium: true }));
  const pointsEarned = correctAnswers * 10;

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $inc: {
        totalTestsCompleted: 1,
        totalPoints: pointsEarned,
      },
      $set: {
        lastActiveDate: completedDate,
        ...(streakAwarded ? { streak: currentStreak, lastStreakDate: completedDate } : {}),
      },
    },
  );
  void sendTestCompletionEmail(req.user, {
    testName: test.name,
    category: test.category,
      score: testResult.score,
      totalMarks,
      correctAnswers,
    wrongAnswers,
    skippedAnswers,
    accuracy,
    timeTaken,
    pointsEarned,
    streakCount: currentStreak,
  }).catch(error => console.error('[Email] Test completion notification failed:', error));

  res.json({
    success: true,
    message: 'Test submitted successfully',
    data: {
      result: testResult,
      pointsEarned,
      category: test.category,
      hasPremiumInCategory: premiumCount > 0,
      streak: {
        current: currentStreak,
        awarded: streakAwarded,
        message: buildStreakMessage(currentStreak, streakAwarded),
        nextEligibleAt: nextDayStart,
      },
    },
  });
});

export const getTestResult = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const { resultId } = req.params;

  const result = await TestResult.findById(resultId);
  if (!result) {
    throw new AppError('Test result not found', 404);
  }

  if (result.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied', 403);
  }

  const questions = await Question.find({ testId: result.testId, isActive: true });
  const test = await Test.findById(result.testId);

  const answersMap: Record<string, number> = {};
  if (result.answers) {
    if (result.answers instanceof Map) {
      for (const [k, v] of result.answers) answersMap[k] = Number(v);
    } else if (typeof result.answers === 'object') {
      for (const [k, v] of Object.entries(result.answers)) answersMap[k] = Number(v);
    }
  }

  let negativeMarksDeducted = 0;
  let recalculatedCorrectAnswers = 0;
  let recalculatedWrongAnswers = 0;
  let recalculatedSkippedAnswers = 0;
  let scoreBeforeNegative = 0;
  let recalculatedScore = 0;
  const questionReviews = questions.map((q) => {
    const userAnswer = answersMap[q._id.toString()];
    const isCorrect = userAnswer !== undefined && isAnswerCorrect(q, userAnswer);
    const questionNegativeMarks = q.negativeMarks ?? test?.negativeMarks ?? 0;

    if (userAnswer === undefined || userAnswer === null) {
      recalculatedSkippedAnswers++;
    } else if (isCorrect) {
      recalculatedCorrectAnswers++;
      scoreBeforeNegative += q.marks;
      recalculatedScore += q.marks;
    } else {
      recalculatedWrongAnswers++;
      if (questionNegativeMarks > 0) {
        negativeMarksDeducted += questionNegativeMarks;
        recalculatedScore -= questionNegativeMarks;
      }
    }

    return {
      _id: q._id.toString(),
      question: q.text,
      options: Array.isArray(q.options) ? q.options.map(o => (typeof o === 'string' ? o : o.text || '')) : [],
      correctAnswer: getCorrectAnswerIndex(q) ?? 0,
      explanation: q.explanation,
      difficulty: q.difficulty,
      subject: q.subject,
      topic: q.topic || '',
      section: q.section || 'General',
      sectionName: q.sectionName || 'General',
      negativeMarks: questionNegativeMarks,
      image: q.image,
      attachmentUrl: q.attachmentUrl,
      attachmentType: q.attachmentType,
      userAnswer: userAnswer !== undefined ? Number(userAnswer) : null,
      isCorrect,
    };
  });

  const topicAnalysis = computeTopicPerformance(questions, answersMap);
  const displayScore = Math.max(0, recalculatedScore);
  const displayAccuracy = calculateAccuracy(recalculatedCorrectAnswers, recalculatedCorrectAnswers + recalculatedWrongAnswers);
  const displayTotalMarks = questions.reduce((sum, q) => sum + q.marks, 0) || result.totalMarks;

  const allResults = await TestResult.find({ testId: result.testId, status: 'completed' }).sort({ score: -1, timeTaken: 1, completedAt: 1 });
  const totalAttempts = allResults.length;
  const userRank = allResults.filter(r =>
    r._id.toString() !== result._id.toString() && (r.score > displayScore || (r.score === displayScore && r.timeTaken < result.timeTaken))
  ).length + 1;
  const percentile = totalAttempts > 1 ? Math.round(((totalAttempts - userRank) / (totalAttempts - 1)) * 100) : 0;
  const percentage = displayTotalMarks > 0 ? Math.round((displayScore / displayTotalMarks) * 100) : 0;
  const passingMarks = test?.passingMarks || 0;
  const qualified = passingMarks > 0 ? displayScore >= passingMarks : percentage >= 40;

  const premiumInCat = test ? await Test.countDocuments(getAvailableTestQuery({ category: test.category, isPremium: true })) : 0;
  const resultDayStart = startOfDay(result.completedAt);
  const resultNextDayStart = new Date(resultDayStart.getTime() + DAY_MS);
  const isFreshResult = Date.now() - result.completedAt.getTime() < 10 * 60 * 1000;
  const user = await User.findById(req.user._id).select('streak lastStreakDate');
  let streakAwarded = !!result.streakAwarded && isFreshResult;
  let currentStreak = result.streakCount || user?.streak || 0;

  if (isFreshResult && !result.streakAwarded && !isSameDay(user?.lastStreakDate, result.completedAt)) {
    const previousDayStart = new Date(resultDayStart.getTime() - DAY_MS);
    currentStreak = isSameDay(user?.lastStreakDate, previousDayStart) ? (user?.streak || 0) + 1 : 1;
    streakAwarded = true;

    result.streakAwarded = true;
    result.streakCount = currentStreak;
    await Promise.all([
      result.save(),
      User.findByIdAndUpdate(req.user._id, {
        $set: {
          streak: currentStreak,
          lastStreakDate: result.completedAt,
          lastActiveDate: result.completedAt,
        },
      }),
    ]);
  }

  res.json({
    success: true,
    data: {
      _id: result._id,
      testId: result.testId.toString(),
      testName: test?.name || 'Unknown Test',
      category: test?.category || '',
      hasPremiumInCategory: premiumInCat > 0,
      score: displayScore,
      totalMarks: displayTotalMarks,
      scoreBeforeNegative,
      negativeMarks: test?.negativeMarks || 0,
      negativeMarksDeducted,
      percentage,
      passingMarks,
      qualified,
      resultStatus: qualified ? 'Qualified' : 'Not Qualified',
      correctAnswers: recalculatedCorrectAnswers,
      wrongAnswers: recalculatedWrongAnswers,
      skippedAnswers: recalculatedSkippedAnswers,
      accuracy: displayAccuracy,
      percentile,
      rank: userRank,
      timeTaken: result.timeTaken,
      allottedTime: (test?.duration || 0) * 60,
      totalQuestions: questions.length,
      completedAt: result.completedAt,
      questionReviews,
      topicAnalysis,
      streak: {
        current: currentStreak,
        awarded: streakAwarded,
        message: buildStreakMessage(currentStreak, streakAwarded),
        nextEligibleAt: resultNextDayStart,
      },
    },
  });
});

export const getLatestTestResult = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const { testId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(testId)) {
    throw new AppError('Invalid test ID', 400);
  }

  const result = await TestResult.findOne({ userId: req.user._id, testId }).sort({ completedAt: -1 });
  if (!result) {
    throw new AppError('Test result not found', 404);
  }

  res.json({
    success: true,
    data: {
      resultId: result._id,
    },
  });
});

export const enrollTest = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Not authenticated', 401);

  const { testId } = req.body;
  if (!testId) throw new AppError('testId is required', 400);

  const test = await Test.findOne(getAvailableTestQuery({ _id: testId }));
  if (!test) throw new AppError('Test not found', 404);

  const existing = await Enrollment.findOne({ userId: req.user._id, testId });
  if (existing) {
    res.json({
      success: true,
      message: 'Already enrolled',
      data: { id: existing._id, enrolledAt: existing.enrolledAt, alreadyEnrolled: true },
    });
    return;
  }

  const enrollment = await Enrollment.create({ userId: req.user._id, testId });
  await sendTestEnrollmentEmail(req.user, {
    name: test.name,
    category: test.category,
    subject: test.subject,
    duration: test.duration,
  }).catch(error => console.error('[Email] Test enrollment notification failed:', error));

  res.json({ success: true, data: { id: enrollment._id, enrolledAt: enrollment.enrolledAt } });
});

export const getMyTests = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) { res.json({ success: true, data: { tests: [] } }); return; }

  const enrollments = await Enrollment.find({ userId: req.user._id }).sort({ enrolledAt: -1 }).lean();
  const enrolledTestIds = enrollments.map(e => e.testId);

  const results = await TestResult.aggregate([
    { $match: { userId: req.user._id } },
    { $sort: { completedAt: -1 } },
    { $group: { _id: '$testId', latestResult: { $first: '$$ROOT' } } },
  ]);

  const allTestIds = [...new Set([...enrolledTestIds.map(id => id.toString()), ...results.map(r => r._id.toString())])];
  const tests = await Test.find(getAvailableTestQuery({ _id: { $in: allTestIds } })).lean();

  const enrollmentMap = new Map(enrollments.map(e => [e.testId.toString(), e]));
  const resultMap = new Map(results.map(r => [r._id.toString(), r.latestResult]));

  const myTests = tests.map(t => ({
    _id: t._id,
    name: t.name,
    description: t.description,
    category: t.category,
    subject: t.subject,
    testType: t.testType,
    chapter: t.chapter,
    difficulty: t.difficulty,
    duration: t.duration,
    totalQuestions: t.totalQuestions,
    questionCount: t.questionCount,
    totalMarks: t.totalMarks,
    isPremium: t.isPremium,
    price: t.price,
    originalPrice: t.originalPrice,
    activeFrom: t.activeFrom || null,
    activeUntil: t.activeUntil || null,
    isEnrolled: enrollmentMap.has(t._id.toString()),
    enrolledAt: enrollmentMap.get(t._id.toString())?.enrolledAt || null,
    lastResult: resultMap.get(t._id.toString()) ? {
      score: resultMap.get(t._id.toString())!.score,
      totalMarks: resultMap.get(t._id.toString())!.totalMarks,
      accuracy: resultMap.get(t._id.toString())!.accuracy,
      status: resultMap.get(t._id.toString())!.status,
      completedAt: resultMap.get(t._id.toString())!.completedAt,
    } : null,
  }));

  res.json({ success: true, data: { tests: myTests } });
});

export const getCompletedCategories = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.json({ success: true, data: { categories: [] } });
    return;
  }
  const results = await TestResult.distinct('testId', { userId: req.user._id });
  const tests = await Test.find(getAvailableTestQuery({ _id: { $in: results } }));
  const categories = [...new Set(tests.map(t => t.category))];
  const hasPremium: Record<string, boolean> = {};
  for (const cat of categories) {
    const cnt = await Test.countDocuments(getAvailableTestQuery({ category: cat, isPremium: true }));
    if (cnt > 0) hasPremium[cat] = true;
  }
  res.json({ success: true, data: { categories: categories.filter(c => hasPremium[c]) } });
});
