interface Coupon {
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount?: number;
  minAmount?: number;
  usageLimit?: number;
  usedCount?: number;
  expiresAt?: Date;
  startsAt?: Date;
}

interface CouponResult {
  valid: boolean;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  message?: string;
}

export const validateCoupon = (coupon: Coupon, baseAmount: number): { valid: boolean; message?: string } => {
  const now = new Date();
  if (coupon.expiresAt && coupon.expiresAt < now) return { valid: false, message: 'Coupon has expired' };
  if (coupon.startsAt && coupon.startsAt > now) return { valid: false, message: 'Coupon is not yet valid' };
  if (coupon.usageLimit && coupon.usedCount && coupon.usedCount >= coupon.usageLimit) return { valid: false, message: 'Coupon usage limit reached' };
  if (coupon.minAmount && baseAmount < coupon.minAmount) return { valid: false, message: `Minimum order amount of ${coupon.minAmount} not met` };
  return { valid: true };
};

export const calculateDiscount = (coupon: Coupon, baseAmount: number): number => {
  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (baseAmount * coupon.discountValue) / 100;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
  } else {
    discount = coupon.discountValue;
  }
  return discount;
};

export const calculateFinalAmount = (coupon: Coupon, baseAmount: number): CouponResult => {
  const validation = validateCoupon(coupon, baseAmount);
  if (!validation.valid) {
    return { valid: false, originalAmount: baseAmount, discountAmount: 0, finalAmount: baseAmount, message: validation.message };
  }
  const discountAmount = calculateDiscount(coupon, baseAmount);
  const finalAmount = Math.max(0, baseAmount - discountAmount);
  return {
    valid: true,
    originalAmount: baseAmount,
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalAmount: Math.round(finalAmount * 100) / 100,
  };
};
