import mongoose from 'mongoose';
import { Payment } from '@/models/Payment';
import { Coupon } from '@/models/Coupon';
import { SubscriptionPlan } from '@/models/SubscriptionPlan';

const FALLBACK_PLANS: Record<string, { name: string; price: number; durationMonths: number }> = {
  starter: { name: 'Starter', price: 99, durationMonths: 1 },
  pro: { name: 'Pro', price: 99, durationMonths: 1 },
  premium: { name: 'Premium', price: 499, durationMonths: 1 },
};

export const isUserPremium = async (userId: mongoose.Types.ObjectId): Promise<boolean> => {
  const payment = await Payment.findOne({
    userId,
    status: 'completed',
    endDate: { $gte: new Date() },
  });
  return !!payment;
};

export const getActiveSubscription = async (userId: mongoose.Types.ObjectId) => {
  return Payment.findOne({
    userId,
    status: 'completed',
    endDate: { $gte: new Date() },
  }).sort({ endDate: -1 });
};

export const getPlanDetails = async (plan: string) => {
  const normalizedPlan = plan === 'enterprise' ? 'premium' : plan;
  const dbPlan = await SubscriptionPlan.findOne({
    isActive: true,
    $or: [{ slug: normalizedPlan }, { name: new RegExp(`^${normalizedPlan}$`, 'i') }],
  });
  if (dbPlan) {
    return {
      slug: dbPlan.slug,
      name: dbPlan.name,
      price: dbPlan.price,
      durationMonths: dbPlan.durationMonths || 1,
    };
  }
  const fallback = FALLBACK_PLANS[normalizedPlan];
  return fallback ? { slug: normalizedPlan, ...fallback } : null;
};

export const getPayableAmount = async (baseAmount: number, couponCode?: string): Promise<number> => {
  if (!couponCode) return baseAmount;
  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
  if (!coupon) return baseAmount;
  const now = new Date();
  if (coupon.expiresAt && coupon.expiresAt < now) return baseAmount;
  if (coupon.startsAt && coupon.startsAt > now) return baseAmount;
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return baseAmount;
  if (baseAmount < coupon.minAmount) return baseAmount;
  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = (baseAmount * coupon.discountValue) / 100;
    if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) discountAmount = coupon.maxDiscount;
  } else {
    discountAmount = coupon.discountValue;
  }
  return Math.round(Math.max(0, baseAmount - discountAmount) * 100) / 100;
};

export const buildUPIPayload = (amount: number, orderId: string, merchantUPI: string, merchantName: string): string => {
  const params = new URLSearchParams({
    pa: merchantUPI,
    pn: merchantName,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: `Order ${orderId}`,
    tr: orderId,
  });
  return `upi://pay?${params.toString()}`;
};

export const getPaymentSummary = async () => {
  const agg = await Payment.aggregate([
    { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  const summary: Record<string, { total: number; count: number }> = {};
  agg.forEach((r: any) => { summary[r._id] = { total: r.total, count: r.count }; });
  return summary;
};
