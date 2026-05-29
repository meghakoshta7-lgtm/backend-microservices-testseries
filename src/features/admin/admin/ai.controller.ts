import { Response } from 'express';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { processChatMessage } from '@/services/ai/service';

export const aiStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: { configured: !!process.env.AI_API_KEY, model: process.env.AI_MODEL || 'gpt-4o-mini' } });
});

export const aiChat = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { message, history } = req.body;
  if (!message || typeof message !== 'string') {
    res.status(400).json({ success: false, message: 'Message is required' });
    return;
  }

  const result = await processChatMessage(message, history || []);
  res.json({ success: true, data: result });
});
