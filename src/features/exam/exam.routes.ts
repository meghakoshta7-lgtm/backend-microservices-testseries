import { Router } from 'express';
import { authenticate, optionalAuth } from '@/middleware/auth';
import {
  getCategories,
  getExamsByCategory,
  getExamDetail,
  getHomeData,
  checkAccess,
  getUserDashboard,
} from './exam.controller';

const router = Router();

router.get('/categories', getCategories);
router.get('/categories/:categorySlug/exams', getExamsByCategory);
router.get('/exams/:examSlug', getExamDetail);
router.get('/home', authenticate, getHomeData);
router.get('/access/:testId', authenticate, checkAccess);
router.get('/dashboard', authenticate, getUserDashboard);

export default router;
