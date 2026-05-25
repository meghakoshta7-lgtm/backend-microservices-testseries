import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { User } from '@/models/User';
import { ActivityLog } from '@/models/ActivityLog';
import { config } from '@/config';

export const adminLogin = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new AppError('Invalid email or password', 401);
  if (!['super_admin', 'admin', 'editor', 'support'].includes(user.role)) throw new AppError('Access denied', 403);
  if (user.isLoginDisabled) throw new AppError('Account disabled. Contact super admin.', 403);

  const isValid = await user.comparePassword(password);
  if (!isValid) throw new AppError('Invalid email or password', 401);

  const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn as any });

  await ActivityLog.create({ userId: user._id, action: 'admin_login', resource: 'auth', details: { ip: req.ip } });

  res.json({ success: true, message: 'Login successful', data: { token, user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar || '', createdAt: user.createdAt } } });
});
