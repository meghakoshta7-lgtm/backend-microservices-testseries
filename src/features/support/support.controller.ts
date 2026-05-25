import { Response } from 'express';
import mongoose from 'mongoose';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { Ticket } from '@/models/Ticket';
import { FAQ } from '@/models/FAQ';

const ensureObjectId = (id: string): void => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Invalid ticket ID', 400);
};

const mapTicket = (ticket: any) => {
  const raw = typeof ticket?.toObject === 'function' ? ticket.toObject() : ticket;
  const messages = Array.isArray(raw.messages) ? raw.messages.filter(Boolean) : [];

  return {
    ...raw,
    id: raw._id?.toString(),
    messages,
    messageCount: messages.length,
  };
};

const mapTicketSummary = (ticket: any) => {
  const mapped = mapTicket(ticket);
  return {
    id: mapped.id,
    _id: mapped._id,
    subject: mapped.subject,
    category: mapped.category,
    priority: mapped.priority,
    status: mapped.status,
    messageCount: mapped.messageCount,
    createdAt: mapped.createdAt,
  };
};

export const createTicket = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { subject, description, category, priority } = req.body;
  if (!subject || !description) throw new AppError('Subject and description are required', 400);
  const ticket = await Ticket.create({
    userId: req.user!._id,
    subject,
    description,
    category: category || 'general',
    priority: priority || 'medium',
    messages: [{ sender: 'user', message: description, attachments: [], createdAt: new Date() }],
  });
  res.status(201).json({ success: true, data: mapTicketSummary(ticket) });
});

export const getMyTickets = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const [tickets, total] = await Promise.all([
    Ticket.find({ userId: req.user!._id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Ticket.countDocuments({ userId: req.user!._id }),
  ]);
  const mapped = tickets.map(mapTicketSummary);
  res.json({ success: true, data: { tickets: mapped, totalPages: Math.ceil(total / limit), currentPage: page, totalTickets: total } });
});

export const getMyTicketDetail = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  ensureObjectId(req.params.id);
  const ticket = await Ticket.findOne({ _id: req.params.id, userId: req.user!._id });
  if (!ticket) throw new AppError('Ticket not found', 404);
  res.json({ success: true, data: mapTicket(ticket) });
});

export const replyToTicket = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  ensureObjectId(req.params.id);
  const { message } = req.body;
  if (!message) throw new AppError('Message is required', 400);
  const ticket = await Ticket.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!._id },
    { $push: { messages: { sender: 'user', message, attachments: [], createdAt: new Date() } } },
    { new: true }
  );
  if (!ticket) throw new AppError('Ticket not found', 404);
  res.json({ success: true, data: mapTicket(ticket) });
});

export const getFAQs = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const faqs = await FAQ.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
  res.json({ success: true, data: { faqs } });
});
