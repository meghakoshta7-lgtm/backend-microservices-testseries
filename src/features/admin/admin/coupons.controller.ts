import { Response } from 'express';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { Coupon } from '@/models/Coupon';

export const getCoupons = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, data: { coupons } });
});

export const createCoupon = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const coupon = await Coupon.create({ ...req.body, createdBy: req.user!._id });
  res.status(201).json({ success: true, data: coupon });
});

export const updateCoupon = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!coupon) throw new AppError('Coupon not found', 404);
  res.json({ success: true, data: coupon });
});

export const deleteCoupon = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true, data: { id: req.params.id } });
});
