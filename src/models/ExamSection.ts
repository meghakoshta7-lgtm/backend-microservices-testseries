import mongoose, { Document, Schema } from 'mongoose';

export interface IExamSection extends Document {
  categoryId: mongoose.Types.ObjectId;
  title: string;
  subtitle: string;
  icon: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const examSectionSchema = new Schema<IExamSection>(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: 'ExamCategory', required: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    icon: { type: String, default: 'BookOpen' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

examSectionSchema.index({ categoryId: 1, order: 1 });

export const ExamSection = mongoose.model<IExamSection>('ExamSection', examSectionSchema);
