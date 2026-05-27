import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion extends Document {
  testId?: mongoose.Types.ObjectId;
  text: string;
  options: { label: string; text: string }[];
  correctAnswer: string | string[];
  explanation?: any;
  type: 'mcq' | 'single' | 'multiple' | 'subjective' | 'descriptive';
  category: string;
  subject: string;
  topic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negativeMarks: number;
  image?: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'pdf' | '';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    testId: { type: Schema.Types.ObjectId, ref: 'Test' },
    text: { type: String, required: true },
    options: [{
      label: { type: String, required: true },
      text: { type: String, required: true },
    }],
    correctAnswer: { type: Schema.Types.Mixed, required: true },
    explanation: { type: Schema.Types.Mixed, default: '' },
    type: { type: String, enum: ['mcq', 'single', 'multiple', 'subjective', 'descriptive'], default: 'mcq' },
    category: { type: String, required: true },
    subject: { type: String, required: true },
    topic: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    marks: { type: Number, default: 1 },
    negativeMarks: { type: Number, default: 0 },
    image: { type: String, default: '' },
    attachmentUrl: { type: String, default: '' },
    attachmentType: { type: String, enum: ['image', 'pdf', ''], default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

questionSchema.index({ category: 1, subject: 1 });
questionSchema.index({ testId: 1 });

export const Question = mongoose.model<IQuestion>('Question', questionSchema);
