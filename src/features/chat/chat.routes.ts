import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import * as c from './chat.controller';

const router = Router();

router.use(authenticate);

router.post('/message', c.sendMessage);
router.get('/history', c.getChatHistory);

export default router;
