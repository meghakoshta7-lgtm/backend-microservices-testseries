import { Router } from 'express';
import { SubscriptionPlan } from '@/models/SubscriptionPlan';
import { asyncHandler } from '@/middleware/asyncHandler';
import { defaultSubscriptionPlans, normalizeSubscriptionPlans } from '@/utils/subscriptionPlans';

const router = Router();

router.get('/plans', asyncHandler(async (req, res) => {
  const plans = await SubscriptionPlan.find({ isActive: true }).sort({ order: 1 });
  res.json({
    success: true,
    data: plans.length > 0 ? normalizeSubscriptionPlans(plans) : defaultSubscriptionPlans,
  });
}));

export default router;
