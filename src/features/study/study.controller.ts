import { Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import { AppError } from '@/middleware/error';
import { asyncHandler } from '@/middleware/asyncHandler';
import { AuthRequest } from '@/middleware/auth';
import { Subject } from '@/models/Subject';
import { StudyMaterial } from '@/models/StudyMaterial';
import { UserStudyProgress } from '@/models/UserStudyProgress';
import { MaterialPurchase } from '@/models/MaterialPurchase';
import { Payment } from '@/models/Payment';
import { buildUPIPayload, sendMaterialPurchaseEmail } from '@/services';

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  standard: 'Standard',
  premium: 'Premium',
};
const PDF_DOWNLOAD_PRICE = 39;
const MERCHANT_UPI_ID = process.env.MERCHANT_UPI_ID || 'merchant@upi';
const MERCHANT_NAME = process.env.MERCHANT_UPI_NAME || 'DreamBoost';

type UploadedPdfPayload = {
  name: string;
  type: string;
  data: string;
};

const MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024;

const sanitizeFileName = (name: string) =>
  name
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'study-material.pdf';

const getPublicBaseUrl = (req: AuthRequest) => `${req.protocol}://${req.get('host')}`;

const isBinaryPdfContent = (content?: string) => {
  if (!content) return false;
  const sample = content.slice(0, 1200);
  const replacementCount = (sample.match(/\uFFFD/g) || []).length;
  return sample.startsWith('%PDF') || sample.includes('/Type /Page') || replacementCount > 20;
};

const saveUploadedPdf = async (req: AuthRequest, upload?: UploadedPdfPayload): Promise<string | undefined> => {
  if (!upload?.data) return undefined;

  const isPdf = upload.type === 'application/pdf' || upload.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) throw new AppError('Only PDF files are allowed', 400);

  const base64 = upload.data.includes(',') ? upload.data.split(',').pop() || '' : upload.data;
  const buffer = Buffer.from(base64, 'base64');
  if (!buffer.length) throw new AppError('Uploaded PDF is empty', 400);
  if (buffer.length > MAX_PDF_SIZE_BYTES) throw new AppError('PDF file must be 25MB or smaller', 400);

  const uploadDir = path.join(process.cwd(), 'uploads', 'study-materials');
  await fs.mkdir(uploadDir, { recursive: true });

  const ext = path.extname(upload.name).toLowerCase() === '.pdf' ? '.pdf' : '.pdf';
  const baseName = sanitizeFileName(path.basename(upload.name, path.extname(upload.name)));
  const fileName = `${Date.now()}-${baseName}${ext}`;
  await fs.writeFile(path.join(uploadDir, fileName), buffer);

  return `${getPublicBaseUrl(req)}/uploads/study-materials/${fileName}`;
};

const buildMaterialPayload = async (req: AuthRequest, options: { requireSubject: boolean }) => {
  const { pdfUpload, ...payload } = req.body;

  if (!payload.title || !String(payload.title).trim()) {
    throw new AppError('Title is required', 400);
  }

  if (options.requireSubject && !payload.subject) {
    throw new AppError('Subject is required', 400);
  }

  if (payload.subject !== undefined) {
    if (!payload.subject || !mongoose.Types.ObjectId.isValid(payload.subject)) {
      throw new AppError('Please select a valid subject', 400);
    }

    const subjectExists = await Subject.exists({ _id: payload.subject, isActive: true });
    if (!subjectExists) throw new AppError('Selected subject was not found', 400);
  }

  const uploadedPdfUrl = await saveUploadedPdf(req, pdfUpload);
  if (uploadedPdfUrl) payload.pdfUrl = uploadedPdfUrl;
  if ((uploadedPdfUrl || payload.category === 'pdf') && isBinaryPdfContent(payload.content)) {
    payload.content = '';
  }
  return payload;
};

const getEffectiveMaterialPricing = (material: { pricing?: any; pdfUrl?: string }) => {
  const pricing = material.pricing || { plan: 'free', price: 0, originalPrice: 0 };
  if (!material.pdfUrl) return pricing;

  return {
    ...pricing,
    plan: pricing.plan === 'free' ? 'basic' : pricing.plan,
    price: PDF_DOWNLOAD_PRICE,
    originalPrice: pricing.originalPrice > PDF_DOWNLOAD_PRICE ? pricing.originalPrice : PDF_DOWNLOAD_PRICE,
  };
};

// ==================== SUBJECTS ====================

export const getSubjects = asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const subjects = await Subject.find({ isActive: true }).sort({ order: 1, name: 1 });
  const mapped = await Promise.all(subjects.map(async (s) => {
    const materialCount = await StudyMaterial.countDocuments({ subject: s._id, isActive: true });
    return { id: s._id, name: s.name, icon: s.icon, color: s.color, description: s.description, materialCount };
  }));
  res.json({ success: true, data: { subjects: mapped } });
});

// ==================== STUDY MATERIALS ====================

export const getMaterials = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const subject = (req.query.subject as string) || '';
  const category = (req.query.category as string) || '';
  const chapter = (req.query.chapter as string) || '';
  const search = (req.query.search as string) || '';

  const query: Record<string, any> = { isActive: true };
  if (subject) query.subject = subject;
  if (category) query.category = category;
  if (chapter) query.chapter = chapter;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  const [materials, total] = await Promise.all([
    StudyMaterial.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('subject', 'name icon color'),
    StudyMaterial.countDocuments(query),
  ]);

  const mapped = materials.map((m) => ({
    id: m._id, title: m.title, description: m.description,
    subject: m.subject, category: m.category, chapter: m.chapter,
    thumbnail: m.thumbnail, duration: m.duration, author: m.author,
    tags: m.tags, pdfUrl: m.pdfUrl, videoUrl: m.videoUrl,
    pricing: m.pricing || { plan: 'free', price: 0, originalPrice: 0 },
    createdAt: m.createdAt,
  }));

  res.json({ success: true, data: { materials: mapped, totalMaterials: total, totalPages: Math.ceil(total / limit), currentPage: page } });
});

export const getMaterialDetail = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const material = await StudyMaterial.findById(req.params.id).populate('subject', 'name icon color');
  if (!material) throw new AppError('Material not found', 404);

  let progress = null;
  let isPurchased = false;
  if (req.user) {
    [progress, isPurchased] = await Promise.all([
      UserStudyProgress.findOne({ userId: req.user._id, materialId: material._id }),
      MaterialPurchase.findOne({ userId: req.user._id, materialId: material._id }).then(Boolean),
    ]);
  }

  const pricing = getEffectiveMaterialPricing(material);
  const isLocked = pricing.price > 0 && !isPurchased;

  res.json({
    success: true, data: {
      id: material._id, title: material.title, description: material.description,
      subject: material.subject, category: material.category, chapter: material.chapter,
      thumbnail: material.thumbnail, duration: material.duration, author: material.author,
      tags: material.tags, content: material.content, pdfUrl: material.pdfUrl, videoUrl: material.videoUrl,
      isActive: material.isActive, createdAt: material.createdAt, updatedAt: material.updatedAt,
      pricing, isLocked, isPurchased,
      progress: progress ? { progress: progress.progress, isCompleted: progress.isCompleted, isBookmarked: progress.isBookmarked, isDownloaded: progress.isDownloaded, lastAccessedAt: progress.lastAccessedAt } : null,
    },
  });
});

export const getChapters = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { subjectId } = req.params;
  const materials = await StudyMaterial.find({ subject: subjectId, isActive: true }).select('chapter').sort({ chapter: 1 });
  const chapterSet = new Set<string>();
  materials.forEach((m) => { if (m.chapter) chapterSet.add(m.chapter); });
  const chapters = Array.from(chapterSet).map((title, idx) => ({ id: `ch-${idx}`, title, materialCount: materials.filter((m) => m.chapter === title).length }));
  res.json({ success: true, data: { chapters } });
});

export const getMaterialsByChapter = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { subjectId, chapterTitle } = req.params;
  const materials = await StudyMaterial.find({ subject: subjectId, chapter: decodeURIComponent(chapterTitle), isActive: true }).sort({ createdAt: -1 }).populate('subject', 'name icon color');
  const mapped = materials.map((m) => ({
    id: m._id, title: m.title, description: m.description, subject: m.subject,
    category: m.category, chapter: m.chapter, thumbnail: m.thumbnail,
    duration: m.duration, author: m.author, tags: m.tags,
    pdfUrl: m.pdfUrl, videoUrl: m.videoUrl,
    pricing: m.pricing || { plan: 'free', price: 0, originalPrice: 0 },
    createdAt: m.createdAt,
  }));
  res.json({ success: true, data: { materials: mapped } });
});

// ==================== USER PROGRESS ====================

export const updateProgress = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { materialId, subjectId, progress, isCompleted, isBookmarked, isDownloaded, isInLibrary } = req.body;
  if (!materialId) throw new AppError('materialId is required', 400);

  let record = await UserStudyProgress.findOne({ userId: req.user!._id, materialId });
  if (record) {
    if (progress !== undefined) record.progress = progress;
    if (isCompleted !== undefined) { record.isCompleted = isCompleted; if (isCompleted) record.completedAt = new Date(); }
    if (isBookmarked !== undefined) record.isBookmarked = isBookmarked;
    if (isDownloaded !== undefined) record.isDownloaded = isDownloaded;
    if (isInLibrary !== undefined) record.isInLibrary = isInLibrary;
    record.lastAccessedAt = new Date();
    await record.save();
  } else {
    record = await UserStudyProgress.create({
      userId: req.user!._id, materialId, subjectId: subjectId || undefined,
      progress: progress || 0, isCompleted: isCompleted || false,
      isBookmarked: isBookmarked || false, isDownloaded: isDownloaded || false,
      isInLibrary: isInLibrary || false,
    });
  }

  res.json({ success: true, data: { id: record._id, progress: record.progress, isCompleted: record.isCompleted, isBookmarked: record.isBookmarked, isDownloaded: record.isDownloaded, isInLibrary: record.isInLibrary } });
});

export const getMyLibrary = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const tab = (req.query.tab as string) || 'all';
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const query: Record<string, any> = { userId: req.user!._id };
  if (tab === 'bookmarked') query.isBookmarked = true;
  else if (tab === 'completed') query.isCompleted = true;
  else if (tab === 'downloaded') query.isDownloaded = true;
  else if (tab === 'history') { query.isInLibrary = true; }
  else { query.isInLibrary = true; }

  const [records, total] = await Promise.all([
    UserStudyProgress.find(query).sort({ lastAccessedAt: -1 }).skip((page - 1) * limit).limit(limit).populate({ path: 'materialId', populate: { path: 'subject', select: 'name icon color' } }),
    UserStudyProgress.countDocuments(query),
  ]);

  const materials = records.map((r) => {
    const m = r.materialId as any;
    return {
      id: r._id, materialId: m?._id, title: m?.title || 'Unknown',
      subject: m?.subject, category: m?.category, chapter: m?.chapter,
      thumbnail: m?.thumbnail, duration: m?.duration, author: m?.author,
      progress: r.progress, isCompleted: r.isCompleted, isBookmarked: r.isBookmarked,
      isDownloaded: r.isDownloaded, lastAccessedAt: r.lastAccessedAt, completedAt: r.completedAt,
    };
  });

  res.json({ success: true, data: { materials, totalMaterials: total, totalPages: Math.ceil(total / limit), currentPage: page } });
});

export const getProfileProgress = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!._id;

  const [totalMaterials, totalChapters, progressAgg, subjectProgress, recentActivity] = await Promise.all([
    StudyMaterial.countDocuments({ isActive: true }),
    StudyMaterial.distinct('chapter', { isActive: true }),
    UserStudyProgress.aggregate([
      { $match: { userId } },
      { $group: { _id: null, totalStudyTime: { $sum: '$totalStudyTime' }, completedCount: { $sum: { $cond: ['$isCompleted', 1, 0] } }, totalProgress: { $avg: '$progress' } } },
    ]),
    UserStudyProgress.aggregate([
      { $match: { userId } },
      { $group: { _id: '$subjectId', progress: { $avg: '$progress' }, completedCount: { $sum: { $cond: ['$isCompleted', 1, 0] } } } },
      { $lookup: { from: 'subjects', localField: '_id', foreignField: '_id', as: 'subject' } },
      { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
    ]),
    UserStudyProgress.find({ userId }).sort({ lastAccessedAt: -1 }).limit(10).populate('materialId', 'title category'),
  ]);

  const agg = progressAgg[0] || { totalStudyTime: 0, completedCount: 0, totalProgress: 0 };
  const weakSubjects = subjectProgress.filter((s: any) => (s.progress || 0) < 50).map((s: any) => ({ id: s._id, name: s.subject?.name || 'Unknown', progress: Math.round(s.progress || 0) }));

  res.json({
    success: true, data: {
      totalStudyHours: Math.round(agg.totalStudyTime / 3600),
      completionPercent: totalMaterials > 0 ? Math.round((agg.completedCount / totalMaterials) * 100) : 0,
      weakSubjects,
      completedCount: agg.completedCount,
      totalMaterials,
      totalChapters: totalChapters.length,
      recentActivity: recentActivity.map((r: any) => {
        const m = r.materialId as any;
        return { id: r._id, title: m?.title || 'Unknown', category: m?.category || '', progress: r.progress, isCompleted: r.isCompleted, lastAccessedAt: r.lastAccessedAt };
      }),
    },
  });
});

// ==================== PURCHASE ====================

export const purchaseMaterial = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Not authenticated', 401);

  const { materialId } = req.body;
  if (!materialId) throw new AppError('materialId is required', 400);

  const material = await StudyMaterial.findById(materialId);
  if (!material) throw new AppError('Material not found', 404);

  const pricing = getEffectiveMaterialPricing(material);
  if (pricing.price <= 0) throw new AppError('This material is free', 400);

  const existing = await MaterialPurchase.findOne({ userId: req.user._id, materialId });
  if (existing) {
    res.json({ success: true, data: { isPurchased: true, id: existing._id, plan: pricing.plan, category: existing.category, amount: existing.amount, purchasedAt: existing.purchasedAt } });
    return;
  }

  const pending = await Payment.findOne({
    userId: req.user._id,
    plan: `material-${material._id}`,
    status: 'pending',
  }).sort({ createdAt: -1 });

  const orderId = pending?.orderId || `MAT${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
  const qrPayload = buildUPIPayload(pricing.price, orderId, MERCHANT_UPI_ID, MERCHANT_NAME);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrPayload)}`;

  const payment = pending || await Payment.create({
    userId: req.user._id,
    plan: `material-${material._id}`,
    amount: pricing.price,
    currency: 'INR',
    status: 'pending',
    paymentMethod: req.body.paymentMethod || 'upi',
    orderId,
    transactionId: orderId,
    upiId: MERCHANT_UPI_ID,
    qrPayload,
    startDate: new Date(),
    endDate: new Date(),
    autoRenew: false,
  });

  res.status(pending ? 200 : 201).json({
    success: true,
    message: 'Payment order created',
    data: {
      isPurchased: false,
      orderId: payment.orderId,
      materialId: material._id,
      plan: pricing.plan,
      category: material.category,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      qrImageUrl,
    },
  });
});

export const verifyMaterialPurchase = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Not authenticated', 401);

  const { orderId, materialId, utr } = req.body;
  if (!orderId) throw new AppError('orderId is required', 400);
  if (!materialId) throw new AppError('materialId is required', 400);

  const normalizedUtr = String(utr || '').trim().toUpperCase();
  if (!normalizedUtr || normalizedUtr.length < 8) {
    throw new AppError('Valid UTR is required', 400);
  }

  const [payment, material] = await Promise.all([
    Payment.findOne({ orderId, userId: req.user._id, plan: `material-${materialId}` }),
    StudyMaterial.findById(materialId),
  ]);

  if (!payment) throw new AppError('Payment order not found', 404);
  if (!material) throw new AppError('Material not found', 404);

  const existing = await MaterialPurchase.findOne({ userId: req.user._id, materialId });
  if (existing) {
    res.json({ success: true, data: { isPurchased: true, id: existing._id, amount: existing.amount, purchasedAt: existing.purchasedAt } });
    return;
  }

  const duplicateUtr = await Payment.findOne({ utr: normalizedUtr, _id: { $ne: payment._id } });
  if (duplicateUtr) throw new AppError('This UTR has already been used', 400);

  const now = new Date();
  payment.status = 'completed';
  payment.utr = normalizedUtr;
  payment.transactionId = normalizedUtr;
  payment.paidAt = now;
  payment.startDate = now;
  payment.endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  await payment.save();

  const purchase = await MaterialPurchase.create({
    userId: req.user._id,
    materialId: material._id,
    category: material.category,
    amount: payment.amount,
  });
  await sendMaterialPurchaseEmail(req.user, {
    title: material.title,
    category: material.category,
    amount: payment.amount,
    currency: payment.currency,
    transactionId: payment.transactionId,
  }).catch(error => console.error('[Email] Material purchase notification failed:', error));

  res.json({
    success: true,
    message: 'Payment verified and material unlocked',
    data: { isPurchased: true, id: purchase._id, amount: purchase.amount, purchasedAt: purchase.purchasedAt },
  });
});

export const getMyPurchases = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) { res.json({ success: true, data: { purchases: [] } }); return; }
  const purchases = await MaterialPurchase.find({ userId: req.user._id }).select('materialId category amount purchasedAt');
  res.json({ success: true, data: { purchases } });
});

// ==================== ADMIN CRUD ====================

export const createSubject = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const subject = await Subject.create(req.body);
  res.status(201).json({ success: true, data: { id: subject._id, name: subject.name, icon: subject.icon, color: subject.color, description: subject.description } });
});

export const updateSubject = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!subject) throw new AppError('Subject not found', 404);
  res.json({ success: true, data: { id: subject._id, name: subject.name, icon: subject.icon, color: subject.color, description: subject.description } });
});

export const deleteSubject = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await Subject.findByIdAndDelete(req.params.id);
  await StudyMaterial.updateMany({ subject: req.params.id }, { isActive: false });
  res.json({ success: true, data: { id: req.params.id } });
});

export const createMaterial = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const payload = await buildMaterialPayload(req, { requireSubject: true });
  const material = await StudyMaterial.create(payload);
  res.status(201).json({ success: true, data: { id: material._id, title: material.title } });
});

export const updateMaterial = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const payload = await buildMaterialPayload(req, { requireSubject: false });
  const material = await StudyMaterial.findByIdAndUpdate(req.params.id, payload, { new: true });
  if (!material) throw new AppError('Material not found', 404);
  res.json({ success: true, data: { id: material._id, title: material.title } });
});

export const deleteMaterial = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  await StudyMaterial.findByIdAndDelete(req.params.id);
  await UserStudyProgress.deleteMany({ materialId: req.params.id });
  res.json({ success: true, data: { id: req.params.id } });
});
