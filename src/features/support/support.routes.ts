import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { createTicket, getMyTickets, getMyTicketDetail, replyToTicket, getFAQs } from './support.controller';

const router = Router();

router.get('/faqs', getFAQs);
router.post('/tickets', authenticate, createTicket);
router.get('/tickets', authenticate, getMyTickets);
router.get('/tickets/:id', authenticate, getMyTicketDetail);
router.post('/tickets/:id/reply', authenticate, replyToTicket);

export default router;
