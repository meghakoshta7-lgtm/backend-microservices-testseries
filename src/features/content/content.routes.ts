import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { getActiveBanners, getActiveAnnouncements, bookmarkQuestion, removeBookmark, getBookmarkedQuestions, getActiveHomeContent } from './content.controller';

const router = Router();

router.get('/banners', getActiveBanners);
router.get('/announcements', getActiveAnnouncements);
router.get('/home', getActiveHomeContent);
router.post('/bookmarks', authenticate, bookmarkQuestion);
router.delete('/bookmarks/:questionId', authenticate, removeBookmark);
router.get('/bookmarks', authenticate, getBookmarkedQuestions);

export default router;
