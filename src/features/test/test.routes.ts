import { Router } from 'express';
import * as testController from './test.controller';
import { validate } from '@/middleware/validate';
import { submitTestSchema, enrollTestSchema } from '@/validators';
import { authenticate, optionalAuth } from '@/middleware/auth';

const router = Router();

router.get('/', optionalAuth, testController.getTests);
router.get('/my', authenticate, testController.getMyTests);
router.post('/enroll', authenticate, validate(enrollTestSchema), testController.enrollTest);
router.get('/completed-categories', authenticate, testController.getCompletedCategories);
router.get('/result/latest/:testId', authenticate, testController.getLatestTestResult);
router.get('/result/:resultId', authenticate, testController.getTestResult);
router.get('/:id', optionalAuth, testController.getTest);
router.post('/:id/submit', authenticate, validate(submitTestSchema), testController.submitTest);

export default router;
