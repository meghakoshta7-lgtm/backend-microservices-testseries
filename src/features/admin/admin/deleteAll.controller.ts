import { Response } from 'express';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { Announcement } from '@/models/Announcement';
import { Banner } from '@/models/Banner';
import { Batch } from '@/models/Batch';
import { ContentAccessRule } from '@/models/ContentAccessRule';
import { Coupon } from '@/models/Coupon';
import { Enrollment } from '@/models/Enrollment';
import { Exam } from '@/models/Exam';
import { ExamCategory } from '@/models/ExamCategory';
import { FAQ } from '@/models/FAQ';
import { Group } from '@/models/Group';
import { HomeContent } from '@/models/HomeContent';
import { MaterialPurchase } from '@/models/MaterialPurchase';
import { Notification } from '@/models/Notification';
import { Payment } from '@/models/Payment';
import { Question } from '@/models/Question';
import { Review } from '@/models/Review';
import { Section } from '@/models/Section';
import { Subject } from '@/models/Subject';
import { SubscriptionPlan } from '@/models/SubscriptionPlan';
import { Test } from '@/models/Test';
import { TestResult } from '@/models/TestResult';
import { Ticket } from '@/models/Ticket';
import { Topic } from '@/models/Topic';
import { User } from '@/models/User';

const MODEL_MAP: Record<string, any> = {
  announcements: Announcement,
  banners: Banner,
  batches: Batch,
  'access-rules': ContentAccessRule,
  coupons: Coupon,
  enrollments: Enrollment,
  exams: Exam,
  'exam-categories': ExamCategory,
  faqs: FAQ,
  groups: Group,
  'home-content': HomeContent,
  'material-purchases': MaterialPurchase,
  notifications: Notification,
  payments: Payment,
  questions: Question,
  reviews: Review,
  sections: Section,
  subjects: Subject,
  plans: SubscriptionPlan,
  tests: Test,
  'test-results': TestResult,
  tickets: Ticket,
  topics: Topic,
  users: User,
};

export const deleteAll = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { resource } = req.params;
  const Model = MODEL_MAP[resource];
  if (!Model) throw new AppError(`Invalid resource: ${resource}`, 400);
  const result = await Model.deleteMany({});
  res.json({ success: true, message: `Deleted ${result.deletedCount} ${resource}`, deletedCount: result.deletedCount });
});
