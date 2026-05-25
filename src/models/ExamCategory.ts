import mongoose, { Document, Schema } from 'mongoose';

export interface IExamCategory extends Document {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  image?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const examCategorySchema = new Schema<IExamCategory>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'BookOpen' },
    color: { type: String, default: 'from-blue-500 to-blue-600' },
    image: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ExamCategory = mongoose.model<IExamCategory>('ExamCategory', examCategorySchema);
