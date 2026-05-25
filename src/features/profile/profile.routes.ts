import { Router } from 'express';
import * as profileController from './profile.controller';
import { validate } from '@/middleware/validate';
import { updateProfileSchema, changePasswordSchema } from '@/validators';
import { authenticate } from '@/middleware/auth';

const router = Router();

router.get('/', authenticate, profileController.getProfile);
router.put('/', authenticate, validate(updateProfileSchema), profileController.updateProfile);
router.post('/change-password', authenticate, validate(changePasswordSchema), profileController.changePassword);
router.put('/avatar', authenticate, profileController.uploadAvatar);
router.get('/certificates', authenticate, profileController.getCertificates);
router.get('/purchases', authenticate, profileController.getPurchases);
router.get('/achievements', authenticate, profileController.getAchievements);

export default router;
