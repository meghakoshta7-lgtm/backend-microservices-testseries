import { Response } from 'express';
import mongoose from 'mongoose';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { Ticket } from '@/models/Ticket';

const ensureObjectId = (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid ticket ID', 400);
  }
};

const mapTicket = (ticket: any) => {
  const raw = typeof ticket.toObject === 'function' ? ticket.toObject() : ticket;
  return {
    ...raw,
    id: raw._id?.toString(),
  };
};

export const getTickets = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = (req.query.status as string) || '';
  const query: Record<string, any> = {};
  if (status) query.status = status;
  const [tickets, total] = await Promise.all([
    Ticket.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('userId', 'name email'),
    Ticket.countDocuments(query),
  ]);
  const mapped = tickets.map(t => {
    const u = t.userId as any;
    return { id: t._id, userId: t.userId, userName: u?.name || 'Unknown', userEmail: u?.email || '', subject: t.subject, description: t.description, category: t.category, priority: t.priority, status: t.status, messageCount: t.messages?.length || 0, assignedTo: t.assignedTo, createdAt: t.createdAt };
  });
  res.json({ success: true, data: { tickets: mapped, totalTickets: total, totalPages: Math.ceil(total / limit), currentPage: page } });
});

export const getTicketDetail = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  ensureObjectId(req.params.id);
  const ticket = await Ticket.findById(req.params.id).populate('userId', 'name email').populate('assignedTo', 'name');
  if (!ticket) throw new AppError('Ticket not found', 404);
  res.json({ success: true, data: mapTicket(ticket) });
});

export const updateTicket = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  ensureObjectId(req.params.id);
  const { status, assignedTo, priority } = req.body;
  const updates: Record<string, any> = {};
  if (status) updates.status = status;
  if (assignedTo) updates.assignedTo = assignedTo;
  if (priority) updates.priority = priority;
  if (status === 'resolved') updates.resolvedAt = new Date();
  const ticket = await Ticket.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!ticket) throw new AppError('Ticket not found', 404);
  res.json({ success: true, data: mapTicket(ticket) });
});

export const replyTicket = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  ensureObjectId(req.params.id);
  const { message } = req.body;
  if (!message) throw new AppError('Message required', 400);
  const ticket = await Ticket.findByIdAndUpdate(req.params.id, {
    $push: { messages: { sender: 'admin', message, attachments: [], createdAt: new Date() } },
    status: 'in_progress',
  }, { new: true });
  if (!ticket) throw new AppError('Ticket not found', 404);
  res.json({ success: true, data: mapTicket(ticket) });
});
