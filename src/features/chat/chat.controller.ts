import { Response } from 'express';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { ChatMessage } from '@/models/ChatMessage';
import { getChatResponse } from './gemini.service';

export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Not authenticated', 401);

  const { message } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new AppError('Message is required', 400);
  }

  const userMessage = await ChatMessage.create({
    userId: req.user._id,
    role: 'user',
    message: message.trim(),
  });

  const botReply = await getChatResponse(message);
  const botMessage = await ChatMessage.create({
    userId: req.user._id,
    role: 'bot',
    message: botReply,
  });

  res.json({
    success: true,
    data: { userMessage, botMessage },
  });
});

export const getChatHistory = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Not authenticated', 401);

  const messages = await ChatMessage.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  res.json({
    success: true,
    data: messages.reverse(),
  });
});
