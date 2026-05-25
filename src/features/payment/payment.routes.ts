import { Router } from 'express';
import * as paymentController from './payment.controller';
import { validate } from '@/middleware/validate';
import { createPaymentSchema } from '@/validators';
import { authenticate } from '@/middleware/auth';

const router = Router();

router.post('/', authenticate, validate(createPaymentSchema), paymentController.createPayment);
router.get('/', authenticate, paymentController.getPaymentHistory);
router.get('/current-plan', authenticate, paymentController.getCurrentPlan);
router.post('/apply-coupon', authenticate, paymentController.applyCoupon);
router.post('/:orderId/verify', authenticate, paymentController.verifyPayment);

export default router;
