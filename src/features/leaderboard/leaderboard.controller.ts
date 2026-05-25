import { Response } from 'express';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { getLeaderboardAggregation } from '@/services';

export const getLeaderboard = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { timeFilter = 'alltime', page = 1, limit = 20 } = req.query;

  let dateFilter: any = {};
  const now = new Date();

  if (timeFilter === 'daily') {
    dateFilter = { completedAt: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } };
  } else if (timeFilter === 'weekly') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    dateFilter = { completedAt: { $gte: weekAgo } };
  } else if (timeFilter === 'monthly') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    dateFilter = { completedAt: { $gte: monthAgo } };
  }

  const leaderboard = await getLeaderboardAggregation(dateFilter);

  const skip = (Number(page) - 1) * Number(limit);
  const paginatedLeaderboard = leaderboard.slice(skip, skip + Number(limit));

  const rankedLeaderboard = paginatedLeaderboard.map((entry, index) => ({
    ...entry,
    rank: skip + index + 1,
  }));

  let userRank = null;
  if (req.user) {
    const userEntry = leaderboard.findIndex((e) => e.userId.toString() === req.user!._id.toString());
    if (userEntry !== -1) {
      userRank = {
        rank: userEntry + 1,
        totalScore: leaderboard[userEntry].totalScore,
      };
    }
  }

  res.json({
    success: true,
    data: {
      entries: rankedLeaderboard,
      total: leaderboard.length,
      page: Number(page),
      limit: Number(limit),
      hasMore: skip + paginatedLeaderboard.length < leaderboard.length,
      userRank,
    },
  });
});

export const getUserRank = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new Error('User not authenticated');
  }

  const { userId } = req.params;
  const targetUserId = userId || req.user._id.toString();

  const leaderboard = await getLeaderboardAggregation();

  const userIndex = leaderboard.findIndex((e) => e.userId.toString() === targetUserId);

  if (userIndex === -1) {
    res.json({
      success: true,
      data: { rank: null, totalScore: 0, testsCompleted: 0 },
    });
    return;
  }

  const userData = leaderboard[userIndex];

  res.json({
    success: true,
    data: {
      rank: userIndex + 1,
      totalScore: userData.totalScore,
      testsCompleted: userData.testsCompleted,
    },
  });
});
