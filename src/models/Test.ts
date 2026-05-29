import mongoose, { Document, Schema } from 'mongoose';

export interface ITestSection {
  name: string;
  questionCount: number;
  subject?: string;
}

export interface ITest extends Document {
  name: string;
  description: string;
  category: string;
  subject: string;
  subCategory?: string;
  testType: 'subject' | 'chapter' | 'full';
  class?: '11' | '12' | 'all';
  chapter?: string;
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
  sections?: ITestSection[];
  scheduledAt?: Date;
  activeFrom?: Date;
  activeUntil?: Date;
  badge?: { text: string; color: string };
  createdAt: Date;
  updatedAt: Date;
}

const testSchema = new Schema<ITest>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, required: true },
    subject: { type: String, required: true },
    subCategory: { type: String, default: '' },
    testType: { type: String, enum: ['subject', 'chapter', 'full'], default: 'subject' },
    class: { type: String, enum: ['11', '12', 'all'], default: 'all' },
    chapter: { type: String, default: '' },
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
    sections: [{ name: { type: String, required: true }, questionCount: { type: Number, default: 0 }, subject: { type: String } }],
    badge: {
      text: { type: String, default: '' },
      color: { type: String, default: '' },
    },
    scheduledAt: { type: Date },
    activeFrom: { type: Date },
    activeUntil: { type: Date },
  },
  { timestamps: true }
);

testSchema.index({ category: 1, class: 1, subject: 1, difficulty: 1 });
testSchema.index({ category: 1, testType: 1 });
testSchema.index({ isActive: 1, isPremium: 1 });
testSchema.index({ isActive: 1, activeFrom: 1, activeUntil: 1 });

export const Test = mongoose.model<ITest>('Test', testSchema);
