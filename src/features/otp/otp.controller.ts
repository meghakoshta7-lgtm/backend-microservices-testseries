import { Response } from 'express';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { User } from '@/models/User';
import { sendOTPEmail } from '@/services/email.service';

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTP = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  user.otpCode = otp;
  user.otpExpires = otpExpires;
  await user.save();

  await sendOTPEmail(email, otp);

  res.json({
    success: true,
    message: 'OTP sent successfully',
    data: { email, expiresAt: otpExpires },
  });
});

export const verifyOTP = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new AppError('Email and OTP are required', 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!user.otpCode || !user.otpExpires) {
    throw new AppError('No OTP requested. Please request a new OTP.', 400);
  }

  if (Date.now() > user.otpExpires.getTime()) {
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();
    throw new AppError('OTP expired. Please request a new OTP.', 400);
  }

  if (user.otpCode !== otp) {
    throw new AppError('Invalid OTP. Please try again.', 400);
  }

  user.isEmailVerified = true;
  user.otpCode = undefined;
  user.otpExpires = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'OTP verified successfully',
    data: { email, isVerified: true },
  });
});

export const resendOTP = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  user.otpCode = otp;
  user.otpExpires = otpExpires;
  await user.save();

  await sendOTPEmail(email, otp);

  res.json({
    success: true,
    message: 'OTP resent successfully',
    data: { email, expiresAt: otpExpires },
  });
});

export const updateProfileSetup = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const { phone, city, state, targetExam, education, class: userClass } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { phone, city, state, targetExam, education, class: userClass },
    { new: true, runValidators: true }
  ).select('-password -refreshToken -otpCode -otpExpires');

  res.json({
    success: true,
    message: 'Profile setup completed',
    data: updatedUser,
  });
});
