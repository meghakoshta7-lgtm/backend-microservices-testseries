import { Response } from 'express';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { User } from '@/models/User';
import { Payment } from '@/models/Payment';
import { Invoice } from '@/models/Invoice';

export const getPayments = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = (req.query.status as string) || '';
  const search = (req.query.search as string) || '';
  const query: Record<string, any> = {};
  if (status) query.status = status;
  if (search) query.$or = [{ transactionId: { $regex: search, $options: 'i' } }];
  const [payments, total, agg] = await Promise.all([
    Payment.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Payment.countDocuments(query),
    Payment.aggregate([{ $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
  ]);
  const summary: Record<string, { total: number; count: number }> = {};
  agg.forEach((r: any) => { summary[r._id] = { total: r.total, count: r.count }; });
  const mapped = await Promise.all(payments.map(async p => {
    const user = await User.findById(p.userId).select('name email');
    return { id: p._id, transactionId: p.transactionId, userId: p.userId, userName: user?.name || 'Unknown', userEmail: user?.email || '', plan: p.plan, amount: p.amount, currency: p.currency || 'USD', status: p.status, paymentMethod: p.paymentMethod || '', createdAt: p.createdAt, updatedAt: p.updatedAt };
  }));
  res.json({ success: true, data: { payments: mapped, totalRevenue: summary.completed?.total || 0, activePlans: summary.completed?.count || 0, pendingAmount: summary.pending?.total || 0, refundedAmount: summary.refunded?.total || 0, totalPages: Math.ceil(total / limit), currentPage: page, totalPayments: total } });
});

export const refundPayment = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const payment = await Payment.findByIdAndUpdate(req.params.id, { status: 'refunded' }, { new: true });
  if (!payment) throw new AppError('Payment not found', 404);
  const user = await User.findById(payment.userId).select('name email');
  res.json({ success: true, data: { id: payment._id, transactionId: payment.transactionId, userId: payment.userId, userName: user?.name || 'Unknown', userEmail: user?.email || '', plan: payment.plan, amount: payment.amount, currency: payment.currency || 'USD', status: payment.status, paymentMethod: payment.paymentMethod || '', createdAt: payment.createdAt, updatedAt: payment.updatedAt } });
});

export const getInvoices = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const [invoices, total] = await Promise.all([
    Invoice.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('userId', 'name email'),
    Invoice.countDocuments(),
  ]);
  const mapped = invoices.map(inv => {
    const u = inv.userId as any;
    return { id: inv._id, invoiceNumber: inv.invoiceNumber, userId: inv.userId, userName: u?.name || 'Unknown', plan: inv.plan, amount: inv.amount, currency: inv.currency, status: inv.status, paidAt: inv.paidAt, items: inv.items || [], createdAt: inv.createdAt };
  });
  res.json({ success: true, data: { invoices: mapped, totalInvoices: total, totalPages: Math.ceil(total / limit), currentPage: page } });
});
