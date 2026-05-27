import mongoose, { Document, Schema } from 'mongoose';

export interface ISection extends Document {
  testId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  order: number;
  duration?: number;
  totalQuestions?: number;
  totalMarks?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sectionSchema = new Schema<ISection>(
  {
    testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    order: { type: Number, required: true },
    duration: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

sectionSchema.index({ testId: 1, order: 1 });

export const Section = mongoose.model<ISection>('Section', sectionSchema);
