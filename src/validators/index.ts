import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name must be less than 50 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(50).optional(),
    email: z.string().email().optional(),
    bio: z.string().max(200).optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    targetExam: z.string().optional(),
    education: z.string().optional(),
    class: z.string().optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const submitTestSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid test ID'),
  }),
  body: z.object({
    answers: z.record(z.string(), z.number().min(0).max(3)),
    timeTaken: z.number().min(0),
    startedAt: z.string().datetime(),
    completedAt: z.string().datetime(),
  }),
});

export const createPaymentSchema = z.object({
  body: z.object({
    plan: z.string().min(1),
    amount: z.number().positive(),
    paymentMethod: z.string().min(1),
    billingCycle: z.enum(['monthly', 'yearly']).optional(),
    couponCode: z.string().optional(),
  }),
});

export const enrollTestSchema = z.object({
  body: z.object({
    testId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid test ID format'),
  }),
});

export const paginationSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
    sort: z.string().default('-createdAt'),
  }),
});
