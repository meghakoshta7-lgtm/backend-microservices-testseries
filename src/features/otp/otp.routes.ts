import { Router } from 'express';
import * as otpController from './otp.controller';
import { validate } from '@/middleware/validate';
import { authenticate } from '@/middleware/auth';
import { z } from 'zod';

const router = Router();

const sendOTPSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

const verifyOTPSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
  }),
});

const profileSetupSchema = z.object({
  body: z.object({
    phone: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    targetExam: z.string().optional(),
    education: z.string().optional(),
    class: z.string().optional(),
  }),
});

router.post('/send-otp', validate(sendOTPSchema), otpController.sendOTP);
router.post('/verify-otp', validate(verifyOTPSchema), otpController.verifyOTP);
router.post('/resend-otp', validate(sendOTPSchema), otpController.resendOTP);
router.post('/profile-setup', authenticate, validate(profileSetupSchema), otpController.updateProfileSetup);

export default router;
