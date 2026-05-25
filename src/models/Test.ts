import mongoose, { Document, Schema } from 'mongoose';

export interface ITest extends Document {
  name: string;
  description: string;
  category: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number;
  totalQuestions: number;
  totalMarks: number;
  passingMarks: number;
  negativeMarks: number;
  isActive: boolean;
  isPremium: boolean;
  price: number;
  originalPrice: number;
  prerequisites: mongoose.Types.ObjectId[];
  thumbnail?: string;
  tags: string[];
  questionCount: number;
  scheduledAt?: Date;
  activeFrom?: Date;
  activeUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const testSchema = new Schema<ITest>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, required: true },
    subject: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    duration: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    totalMarks: { type: Number, default: 0 },
    passingMarks: { type: Number, default: 0 },
    negativeMarks: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isPremium: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
    originalPrice: { type: Number, default: 0 },
    prerequisites: [{ type: Schema.Types.ObjectId, ref: 'Test' }],
    thumbnail: { type: String, default: '' },
    tags: [{ type: String }],
    questionCount: { type: Number, default: 0 },
    scheduledAt: { type: Date },
    activeFrom: { type: Date },
    activeUntil: { type: Date },
  },
  { timestamps: true }
);

testSchema.index({ category: 1, subject: 1, difficulty: 1 });
testSchema.index({ isActive: 1, isPremium: 1 });
testSchema.index({ isActive: 1, activeFrom: 1, activeUntil: 1 });

export const Test = mongoose.model<ITest>('Test', testSchema);
