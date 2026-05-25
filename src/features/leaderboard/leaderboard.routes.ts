import { Router } from 'express';
import * as leaderboardController from './leaderboard.controller';
import { authenticate, optionalAuth } from '@/middleware/auth';

const router = Router();

router.get('/', optionalAuth, leaderboardController.getLeaderboard);
router.get('/:userId/rank', authenticate, leaderboardController.getUserRank);

export default router;
