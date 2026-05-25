import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '@/middleware/validate';
import { loginSchema, registerSchema, refreshTokenSchema } from '@/validators';
import { authenticate } from '@/middleware/auth';
import { z } from 'zod';

const router = Router();

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

const verifyResetCodeSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    code: z.string().min(1, 'Code is required'),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    code: z.string().min(1, 'Code is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

const googleLoginSchema = z.object({
  body: z.object({
    accessToken: z.string().min(1, 'Google access token is required'),
  }),
});

const githubLoginSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'GitHub authorization code is required'),
    redirectUri: z.string().url('GitHub redirect URI is required'),
  }),
});

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/google', validate(googleLoginSchema), authController.googleLogin);
router.post('/github', validate(githubLoginSchema), authController.githubLogin);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.get('/me', authenticate, authController.getMe);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/verify-reset-code', validate(verifyResetCodeSchema), authController.verifyResetCode);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

export default router;
