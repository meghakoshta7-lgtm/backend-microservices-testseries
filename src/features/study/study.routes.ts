import { Router } from 'express';
import * as c from './study.controller';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// Public / user-facing
router.get('/subjects', c.getSubjects);
router.get('/materials', c.getMaterials);
router.get('/materials/:id', c.getMaterialDetail);
router.get('/subjects/:subjectId/chapters', c.getChapters);
router.get('/subjects/:subjectId/chapters/:chapterTitle/materials', c.getMaterialsByChapter);

// Requires auth
router.post('/progress', authenticate, c.updateProgress);
router.get('/my-library', authenticate, c.getMyLibrary);
router.get('/profile-progress', authenticate, c.getProfileProgress);
router.get('/my-purchases', authenticate, c.getMyPurchases);
router.post('/purchase', authenticate, c.purchaseMaterial);
router.post('/purchase/verify', authenticate, c.verifyMaterialPurchase);

// Admin
router.post('/subjects', authenticate, authorize('super_admin', 'admin', 'editor'), c.createSubject);
router.patch('/subjects/:id', authenticate, authorize('super_admin', 'admin', 'editor'), c.updateSubject);
router.delete('/subjects/:id', authenticate, authorize('super_admin', 'admin'), c.deleteSubject);
router.post('/materials/create', authenticate, authorize('super_admin', 'admin', 'editor'), c.createMaterial);
router.patch('/materials/:id', authenticate, authorize('super_admin', 'admin', 'editor'), c.updateMaterial);
router.delete('/materials/:id', authenticate, authorize('super_admin', 'admin'), c.deleteMaterial);

export default router;
