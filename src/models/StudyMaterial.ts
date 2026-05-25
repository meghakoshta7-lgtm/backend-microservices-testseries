import mongoose, { Document, Schema } from 'mongoose';

export interface IChapterContent {
  type: 'notes' | 'video' | 'quiz';
  title: string;
  url: string;
  duration?: number;
}

export interface IChapter {
  title: string;
  description?: string;
  content: IChapterContent[];
}

export interface IPricingPlan {
  plan: 'free' | 'basic' | 'standard' | 'premium';
  price: number;
  originalPrice: number;
}

export interface IStudyMaterial extends Document {
  title: string;
  description: string;
  subject: mongoose.Types.ObjectId;
  category: 'notes' | 'pdf' | 'video' | 'pyq' | 'short-notes' | 'revision';
  chapter: string;
  thumbnail?: string;
  duration: number;
  author: string;
  tags: string[];
  content?: string;
  pdfUrl?: string;
  videoUrl?: string;
  pricing: IPricingPlan;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const chapterContentSchema = new Schema<IChapterContent>(
  {
    type: { type: String, enum: ['notes', 'video', 'quiz'], required: true },
    title: { type: String, required: true },
    url: { type: String, default: '' },
    duration: { type: Number, default: 0 },
  },
  { _id: false }
);

const chapterSchema = new Schema<IChapter>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    content: [chapterContentSchema],
  },
  { _id: true }
);

const pricingPlanSchema = new Schema<IPricingPlan>(
  {
    plan: { type: String, enum: ['free', 'basic', 'standard', 'premium'], default: 'free' },
    price: { type: Number, default: 0 },
    originalPrice: { type: Number, default: 0 },
  },
  { _id: false }
);

const studyMaterialSchema = new Schema<IStudyMaterial>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    category: {
      type: String,
      enum: ['notes', 'pdf', 'video', 'pyq', 'short-notes', 'revision'],
      default: 'notes',
    },
    chapter: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    duration: { type: Number, default: 0 },
    author: { type: String, default: '' },
    tags: [{ type: String }],
    content: { type: String, default: '' },
    pdfUrl: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    pricing: { type: pricingPlanSchema, default: () => ({ plan: 'free', price: 0, originalPrice: 0 }) },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

studyMaterialSchema.index({ subject: 1, category: 1, isActive: 1 });
studyMaterialSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const StudyMaterial = mongoose.model<IStudyMaterial>('StudyMaterial', studyMaterialSchema);
