import { Response } from 'express';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { Payment } from '@/models/Payment';
import { Coupon } from '@/models/Coupon';
import { getPlanDetails, buildUPIPayload, sendSubscriptionPurchaseEmail } from '@/services';
import { validateCoupon, calculateFinalAmount } from '@/utils';

const MERCHANT_UPI_ID = process.env.MERCHANT_UPI_ID || 'merchant@upi';
const MERCHANT_NAME = process.env.MERCHANT_UPI_NAME || 'DreamBoost';

export const createPayment = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const { plan, amount, paymentMethod = 'upi', billingCycle = 'monthly', couponCode } = req.body;
  const planDetails = await getPlanDetails(plan);

  if (!planDetails) {
    throw new AppError('Invalid plan', 400);
  }

  let payableAmount = planDetails.price;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (!coupon) throw new AppError('Invalid coupon code', 404);
    const result = calculateFinalAmount(coupon, planDetails.price);
    if (!result.valid) throw new AppError(result.message || 'Coupon validation failed', 400);
    payableAmount = result.finalAmount;
  }

  if (Number(amount) !== payableAmount) {
    throw new AppError('Payment amount does not match the selected plan', 400);
  }

  const now = new Date();
  const orderId = `TS${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
  const qrPayload = buildUPIPayload(payableAmount, orderId, MERCHANT_UPI_ID, MERCHANT_NAME);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrPayload)}`;

  const payment = await Payment.create({
    userId: req.user._id,
    plan: planDetails.slug,
    amount: payableAmount,
    status: 'pending',
    paymentMethod,
    orderId,
    transactionId: orderId,
    upiId: MERCHANT_UPI_ID,
    qrPayload,
    startDate: now,
    endDate: now,
    autoRenew: false,
  });

  res.status(201).json({
    success: true,
    message: 'Payment order created',
    data: {
      orderId: payment.orderId,
      plan: payment.plan,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      qrImageUrl,
    },
  });
});

export const verifyPayment = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const { orderId } = req.params;
  const { utr } = req.body;
  const normalizedUtr = String(utr || '').trim().toUpperCase();

  if (!normalizedUtr || normalizedUtr.length < 8) {
    throw new AppError('Valid UTR is required', 400);
  }

  const payment = await Payment.findOne({ orderId, userId: req.user._id });
  if (!payment) {
    throw new AppError('Order not found', 404);
  }

  if (payment.status === 'completed') {
    throw new AppError('Order is already paid', 400);
  }

  const duplicateUtr = await Payment.findOne({ utr: normalizedUtr, _id: { $ne: payment._id } });
  if (duplicateUtr) {
    throw new AppError('This UTR has already been used', 400);
  }

  const planDetails = await getPlanDetails(payment.plan);
  if (!planDetails || payment.amount <= 0) {
    throw new AppError('Order amount verification failed', 400);
  }

  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + planDetails.durationMonths);

  payment.status = 'completed';
  payment.utr = normalizedUtr;
  payment.startDate = now;
  payment.endDate = endDate;
  payment.autoRenew = false;
  payment.paidAt = now;
  payment.transactionId = normalizedUtr;
  await payment.save();
  await sendSubscriptionPurchaseEmail(req.user, {
    plan: planDetails.name || payment.plan,
    amount: payment.amount,
    currency: payment.currency,
    endDate,
    transactionId: payment.transactionId,
  }).catch(error => console.error('[Email] Subscription purchase notification failed:', error));

  res.json({
    success: true,
    message: 'Payment verified and subscription activated',
    data: payment,
  });
});

export const getPaymentHistory = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [payments, total] = await Promise.all([
    Payment.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payment.countDocuments({ userId: req.user._id }),
  ]);

  res.json({
    success: true,
    data: {
      items: payments,
      total,
      page: Number(page),
      limit: Number(limit),
      hasMore: skip + payments.length < total,
    },
  });
});

export const getCurrentPlan = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const activePayment = await Payment.findOne({
    userId: req.user._id,
    status: 'completed',
    endDate: { $gte: new Date() },
  }).sort({ endDate: -1 });

  res.json({
    success: true,
    data: {
      plan: activePayment ? activePayment.plan : 'free',
      endDate: activePayment ? activePayment.endDate : null,
      autoRenew: activePayment ? activePayment.autoRenew : false,
    },
  });
});

export const applyCoupon = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { code, plan, billingCycle } = req.body;
  if (!code) throw new AppError('Coupon code is required', 400);

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) throw new AppError('Invalid coupon code', 404);

  const planDetails = await getPlanDetails(plan);
  if (!planDetails) throw new AppError('Invalid plan', 400);

  const result = calculateFinalAmount(coupon, planDetails.price);
  if (!result.valid) throw new AppError(result.message || 'Coupon validation failed', 400);

  res.json({
    success: true,
    data: {
      valid: true,
      couponCode: coupon.code,
      originalAmount: result.originalAmount,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    },
  });
});
