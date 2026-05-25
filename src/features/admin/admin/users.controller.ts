import { Response } from 'express';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { User } from '@/models/User';
import { Test } from '@/models/Test';
import { TestResult } from '@/models/TestResult';
import { Payment } from '@/models/Payment';
import { Ticket } from '@/models/Ticket';
import { ActivityLog } from '@/models/ActivityLog';

export const getUsers = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = (req.query.search as string) || '';
  const role = (req.query.role as string) || '';
  const batchId = (req.query.batchId as string) || '';
  const status = (req.query.status as string) || '';

  const query: Record<string, any> = {};
  if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
  if (role) query.role = role;
  if (batchId) query.batchId = batchId;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('-password -refreshToken'),
    User.countDocuments(query),
  ]);

  const mapped = users.map(u => ({
    id: u._id, name: u.name, email: u.email, phone: u.phone || '', role: u.role,
    status: status === 'disabled' ? 'disabled' : u.isLoginDisabled ? 'disabled' : u.lastActiveDate && u.lastActiveDate >= thirtyDaysAgo ? 'active' : 'inactive',
    isLoginDisabled: u.isLoginDisabled, batchId: u.batchId, groupIds: u.groupIds || [],
    exams: u.targetExam ? [u.targetExam] : [], testsCompleted: u.totalTestsCompleted || 0,
    totalAttempts: u.totalAttempts || 0, avgScore: u.averageScore || 0, accuracy: u.accuracy || 0,
    totalTimeSpent: u.totalTimeSpent || 0, totalPoints: u.totalPoints || 0,
    streak: u.streak || 0, createdAt: u.createdAt, lastActive: u.lastActiveDate,
  }));

  res.json({ success: true, data: { users: mapped, totalUsers: total, totalPages: Math.ceil(total / limit), currentPage: page } });
});

export const getUserDetail = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id).select('-password -refreshToken');
  if (!user) throw new AppError('User not found', 404);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const userStatus = user.isLoginDisabled ? 'disabled' : user.lastActiveDate && user.lastActiveDate >= thirtyDaysAgo ? 'active' : 'inactive';
  const testResults = await TestResult.find({ userId: user._id }).sort({ completedAt: -1 }).limit(50);
  const avgScore = testResults.length > 0 ? Math.round(testResults.reduce((a, r) => a + (r.totalMarks > 0 ? (r.score / r.totalMarks) * 100 : 0), 0) / testResults.length) : 0;
  const topicPerformance: Record<string, { total: number; correct: number }> = {};
  testResults.forEach(r => { if (!topicPerformance[r.testId.toString()]) topicPerformance[r.testId.toString()] = { total: 0, correct: 0 }; topicPerformance[r.testId.toString()].total++; topicPerformance[r.testId.toString()].correct += r.score > 0 ? 1 : 0; });
  const topicData = await Test.find({ _id: { $in: Object.keys(topicPerformance) } }).select('name category');
  const topicWise = topicData.map(t => ({ topic: t.name || t.category, score: Math.round(((topicPerformance[t._id.toString()]?.correct || 0) / Math.max(topicPerformance[t._id.toString()]?.total || 1, 1)) * 100) }));

  res.json({ success: true, data: { id: user._id, name: user.name, email: user.email, phone: user.phone || '', role: user.role, status: userStatus, isLoginDisabled: user.isLoginDisabled, batchId: user.batchId, groupIds: user.groupIds || [], exams: user.targetExam ? [user.targetExam] : [], testsCompleted: user.totalTestsCompleted || 0, totalAttempts: user.totalAttempts || 0, avgScore: user.averageScore || avgScore, accuracy: user.accuracy || 0, totalTimeSpent: user.totalTimeSpent || 0, totalPoints: user.totalPoints || 0, streak: user.streak || 0, createdAt: user.createdAt, lastActive: user.lastActiveDate, topicWise, testHistory: testResults.slice(0, 20).map(r => ({ id: r._id, score: r.score, total: r.totalMarks, accuracy: r.accuracy, completedAt: r.completedAt })) } });
});

export const createUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, email, password, phone, role, batchId, groupIds } = req.body;
  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already registered', 400);
  const user = await User.create({ name, email, password, phone: phone || '', role: role || 'user', batchId: batchId || undefined, groupIds: groupIds || [], isEmailVerified: true });
  await ActivityLog.create({ userId: req.user!._id, action: 'create_user', resource: 'users', resourceId: user._id.toString(), details: { email } });
  res.status(201).json({ success: true, data: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, batchId: user.batchId, groupIds: user.groupIds || [] } });
});

export const updateUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const allowed = ['name', 'phone', 'role', 'batchId', 'groupIds', 'targetExam'];
  const updates: Record<string, any> = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password -refreshToken');
  if (!user) throw new AppError('User not found', 404);
  await ActivityLog.create({ userId: req.user!._id, action: 'update_user', resource: 'users', resourceId: user._id.toString() });
  res.json({ success: true, data: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, batchId: user.batchId, groupIds: user.groupIds || [] } });
});

export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  await Promise.all([TestResult.deleteMany({ userId: user._id }), Payment.deleteMany({ userId: user._id }), Ticket.deleteMany({ userId: user._id })]);
  await ActivityLog.create({ userId: req.user!._id, action: 'delete_user', resource: 'users', resourceId: user._id.toString() });
  res.json({ success: true, data: { id: req.params.id } });
});

export const toggleUserLogin = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  const { status } = req.body;
  if (status === 'active') {
    user.isLoginDisabled = false;
  } else if (status === 'disabled' || status === 'inactive') {
    user.isLoginDisabled = true;
  } else {
    user.isLoginDisabled = !user.isLoginDisabled;
  }
  await user.save();
  res.json({ success: true, data: { id: user._id, isLoginDisabled: user.isLoginDisabled, status: user.isLoginDisabled ? 'disabled' : 'active' } });
});

export const assignBatch = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { batchId } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { batchId: batchId || undefined }, { new: true }).select('name email batchId');
  if (!user) throw new AppError('User not found', 404);
  res.json({ success: true, data: { id: user._id, name: user.name, email: user.email, batchId: user.batchId } });
});
