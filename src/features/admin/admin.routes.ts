import { Router } from 'express';
import multer from 'multer';
import * as c from './admin';
import * as studyCtrl from '../study/study.controller';
import { authenticate, authorize } from '@/middleware/auth';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();

// Auth (no middleware)
router.post('/auth/admin-login', c.adminLogin);

// All below require admin auth
router.use(authenticate, authorize('super_admin', 'admin', 'editor', 'support'));

// Dashboard
router.get('/dashboard', c.getDashboard);

// ─── USERS ───
router.get('/users', c.getUsers);
router.get('/users/:id', c.getUserDetail);
router.post('/users', c.createUser);
router.put('/users/:id', c.updateUser);
router.patch('/users/:id/status', c.toggleUserLogin);
router.patch('/users/:id/batch', c.assignBatch);
router.delete('/users/:id', c.deleteUser);
router.get('/users/:id/progress', c.getStudentProgress);

// ─── BATCHES ───
router.get('/batches', c.getBatches);
router.post('/batches', c.createBatch);
router.patch('/batches/:id', c.updateBatch);
router.delete('/batches/:id', c.deleteBatch);

// ─── GROUPS ───
router.get('/groups', c.getGroups);
router.post('/groups', c.createGroup);
router.patch('/groups/:id', c.updateGroup);
router.delete('/groups/:id', c.deleteGroup);

// ─── PDF Import (Nougat → Parse → JSON → Import) ───
router.post('/pdf/import', upload.single('pdf'), c.importPdfQuestions);

// ─── TESTS ───
router.get('/tests', c.getTests);
router.post('/tests', c.createTest);
router.post('/tests/bulk', c.bulkCreateTests);
router.patch('/tests/:id', c.updateTest);
router.post('/tests/:id/duplicate', c.duplicateTest);
router.delete('/tests/:id', c.deleteTest);
router.post('/tests/pdf/ocr-extract', c.extractPdfWithOCR);
router.get('/tests/pdf/ocr-check', c.checkOCRAvailability);

// ─── QUESTIONS ───
router.get('/questions', c.getQuestions);
router.post('/questions', c.createQuestion);
router.patch('/questions/:id', c.updateQuestion);
router.delete('/questions/by-test/:testId', c.deleteQuestionsByTest);
router.delete('/questions/:id', c.deleteQuestion);
router.post('/questions/bulk-upload', c.bulkUploadQuestions);
router.post('/questions/bulk', c.bulkUploadQuestions);

// ─── RESULTS ───
router.get('/results', c.getResults);
router.post('/results/:testId/ranks', c.generateRanks);
router.get('/results/export', c.exportResults);

// ─── PAYMENTS ───
router.get('/payments', c.getPayments);
router.post('/payments/:id/refund', c.refundPayment);
router.get('/invoices', c.getInvoices);

// ─── COUPONS ───
router.get('/coupons', c.getCoupons);
router.post('/coupons', c.createCoupon);
router.patch('/coupons/:id', c.updateCoupon);
router.delete('/coupons/:id', c.deleteCoupon);

// ─── NOTIFICATIONS ───
router.get('/notifications', c.getNotifications);
router.post('/notifications', c.createNotification);
router.patch('/notifications/:id', c.updateNotification);
router.delete('/notifications/:id', c.deleteNotification);
router.post('/notifications/:id/send', c.sendNotification);

// ─── TICKETS ───
router.get('/tickets', c.getTickets);
router.get('/tickets/:id', c.getTicketDetail);
router.patch('/tickets/:id', c.updateTicket);
router.post('/tickets/:id/reply', c.replyTicket);

// ─── ACTIVITY LOGS ───
router.get('/activity-logs', c.getActivityLogs);

// ─── BANNERS ───
router.get('/banners', c.getBanners);
router.post('/banners', c.createBanner);
router.patch('/banners/:id', c.updateBanner);
router.delete('/banners/:id', c.deleteBanner);

// ─── FAQ ───
router.get('/faqs', c.getFAQs);
router.post('/faqs', c.createFAQ);
router.patch('/faqs/:id', c.updateFAQ);
router.delete('/faqs/:id', c.deleteFAQ);

// ─── ANNOUNCEMENTS ───
router.get('/announcements', c.getAnnouncements);
router.post('/announcements', c.createAnnouncement);
router.patch('/announcements/:id', c.updateAnnouncement);
router.delete('/announcements/:id', c.deleteAnnouncement);

// ─── ANALYTICS ───
router.get('/analytics', c.getAnalytics);

// ─── REPORTS ───
router.get('/reports/revenue', c.getRevenueReport);
router.get('/reports/attempts', c.getAttemptReport);
router.get('/reports/export/:type', c.exportReportCSV);

// ─── SETTINGS ───
router.get('/settings', c.getSettings);
router.patch('/settings', c.updateSettings);

// ─── EXAM CATEGORIES ───
router.get('/exam-categories', c.getExamCategories);
router.post('/exam-categories', c.createExamCategory);
router.patch('/exam-categories/:id', c.updateExamCategory);
router.delete('/exam-categories/:id', c.deleteExamCategory);

// ─── EXAMS ───
router.get('/exams', c.getExams);
router.post('/exams', c.createExam);
router.patch('/exams/:id', c.updateExam);
router.delete('/exams/:id', c.deleteExam);

// ─── SUBJECTS (Admin) ───
router.get('/subjects', c.getAdminSubjects);
router.post('/subjects', c.createAdminSubject);
router.patch('/subjects/:id', c.updateAdminSubject);
router.delete('/subjects/:id', c.deleteAdminSubject);

// ─── TOPICS ───
router.get('/topics', c.getTopics);
router.post('/topics', c.createTopic);
router.patch('/topics/:id', c.updateTopic);
router.delete('/topics/:id', c.deleteTopic);

// ─── SUBSCRIPTION PLANS ───
router.get('/plans', c.getPlans);
router.post('/plans', c.createPlan);
router.patch('/plans/:id', c.updatePlan);
router.delete('/plans/:id', c.deletePlan);

// ─── CONTENT ACCESS RULES ───
router.get('/access-rules', c.getAccessRules);
router.post('/access-rules', c.createAccessRule);
router.patch('/access-rules/:id', c.updateAccessRule);
router.delete('/access-rules/:id', c.deleteAccessRule);

// ─── BOOKMARKS ───
router.get('/bookmarks', c.getAllBookmarks);

// ─── LEADERBOARD ───
router.get('/leaderboard', c.getLeaderboard);

// ─── HOME CONTENT ───
router.get('/home-content', c.getHomeContents);
router.post('/home-content', c.createHomeContent);
router.patch('/home-content/:id', c.updateHomeContent);
router.delete('/home-content/:id', c.deleteHomeContent);

// ─── ENROLLMENTS ───
router.get('/enrollments', c.getEnrollments);

// ─── MATERIAL PURCHASES ───
router.get('/material-purchases', c.getMaterialPurchases);

// ─── REVIEW / APPROVAL ───
router.get('/reviews', c.getReviews);
router.post('/reviews', c.createReview);
router.patch('/reviews/:id/status', c.updateReviewStatus);
router.delete('/reviews/:id', c.deleteReview);

// ─── STUDY (Subjects & Materials) ───
router.get('/study/subjects', studyCtrl.getSubjects);
router.get('/study/materials', studyCtrl.getMaterials);
router.get('/study/materials/:id', studyCtrl.getMaterialDetail);
router.post('/study/subjects', studyCtrl.createSubject);
router.patch('/study/subjects/:id', studyCtrl.updateSubject);
router.delete('/study/subjects/:id', studyCtrl.deleteSubject);
router.post('/study/materials/create', studyCtrl.createMaterial);
router.patch('/study/materials/:id', studyCtrl.updateMaterial);
router.delete('/study/materials/:id', studyCtrl.deleteMaterial);

export default router;
