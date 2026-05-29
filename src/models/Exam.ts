import mongoose, { Document, Schema } from 'mongoose';

export interface IExam extends Document {
  name: string;
  slug: string;
  categoryId: mongoose.Types.ObjectId;
  description: string;
  icon: string;
  color: string;
  totalTests: number;
  totalSubjects: number;
  difficulty: string;
  successStats: { label: string; value: string }[];
  bannerUrl: string;
  isActive: boolean;
  order: number;
  group?: 'national' | 'state' | '';
  createdAt: Date;
  updatedAt: Date;
}

const examSchema = new Schema<IExam>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'ExamCategory', required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'FileText' },
    color: { type: String, default: 'from-blue-500 to-blue-600' },
    totalTests: { type: Number, default: 0 },
    totalSubjects: { type: Number, default: 0 },
    difficulty: { type: String, default: 'medium' },
    successStats: [{ label: String, value: String }],
    bannerUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    group: { type: String, enum: ['national', 'state', ''], default: '' },
  },
  { timestamps: true }
);

examSchema.index({ categoryId: 1, order: 1 });

export const Exam = mongoose.model<IExam>('Exam', examSchema);
