import { Router } from 'express';
import authRoutes from '@/features/auth/auth.routes';
import otpRoutes from '@/features/otp/otp.routes';
import dashboardRoutes from '@/features/dashboard/dashboard.routes';
import testRoutes from '@/features/test/test.routes';
import profileRoutes from '@/features/profile/profile.routes';
import leaderboardRoutes from '@/features/leaderboard/leaderboard.routes';
import paymentRoutes from '@/features/payment/payment.routes';
import notificationRoutes from '@/features/notification/notification.routes';
import settingsRoutes from '@/features/settings/settings.routes';
import supportRoutes from '@/features/support/support.routes';
import contentRoutes from '@/features/content/content.routes';
import studyRoutes from '@/features/study/study.routes';
import adminRoutes from '@/features/admin/admin.routes';
import examRoutes from '@/features/exam/exam.routes';
import planRoutes from '@/features/plan/plan.routes';

export interface RouteMount {
  path: string;
  router: Router;
}

export interface MicroserviceDefinition {
  name: string;
  description: string;
  defaultPort: number;
  routes: RouteMount[];
}

export const routeMounts = {
  auth: { path: '/auth', router: authRoutes },
  otp: { path: '/otp', router: otpRoutes },
  dashboard: { path: '/dashboard', router: dashboardRoutes },
  tests: { path: '/tests', router: testRoutes },
  profile: { path: '/profile', router: profileRoutes },
  leaderboard: { path: '/leaderboard', router: leaderboardRoutes },
  payments: { path: '/payments', router: paymentRoutes },
  notifications: { path: '/notifications', router: notificationRoutes },
  settings: { path: '/settings', router: settingsRoutes },
  support: { path: '/', router: supportRoutes },
  content: { path: '/', router: contentRoutes },
  study: { path: '/study', router: studyRoutes },
  admin: { path: '/admin', router: adminRoutes },
  exam: { path: '/exam', router: examRoutes },
  subscription: { path: '/subscription', router: planRoutes },
} satisfies Record<string, RouteMount>;

export const microservices: Record<string, MicroserviceDefinition> = {
  gateway: {
    name: 'gateway',
    description: 'Backward-compatible API gateway that mounts every route under /api.',
    defaultPort: 3000,
    routes: Object.values(routeMounts),
  },
  identity: {
    name: 'identity',
    description: 'Authentication, OTP, profile, and user settings APIs.',
    defaultPort: 3001,
    routes: [routeMounts.auth, routeMounts.otp, routeMounts.profile, routeMounts.settings],
  },
  learning: {
    name: 'learning',
    description: 'Tests, exams, dashboard, study material, content, and leaderboard APIs.',
    defaultPort: 3002,
    routes: [
      routeMounts.dashboard,
      routeMounts.tests,
      routeMounts.leaderboard,
      routeMounts.study,
      routeMounts.content,
      routeMounts.exam,
    ],
  },
  commerce: {
    name: 'commerce',
    description: 'Payments and subscription plan APIs.',
    defaultPort: 3003,
    routes: [routeMounts.payments, routeMounts.subscription],
  },
  engagement: {
    name: 'engagement',
    description: 'Notifications and support APIs.',
    defaultPort: 3004,
    routes: [routeMounts.notifications, routeMounts.support],
  },
  admin: {
    name: 'admin',
    description: 'Admin back-office APIs.',
    defaultPort: 3005,
    routes: [routeMounts.admin],
  },
};

export const getMicroservice = (name: string): MicroserviceDefinition => {
  const service = microservices[name];
  if (!service) {
    throw new Error(`Unknown SERVICE_NAME "${name}". Available services: ${Object.keys(microservices).join(', ')}`);
  }
  return service;
};
