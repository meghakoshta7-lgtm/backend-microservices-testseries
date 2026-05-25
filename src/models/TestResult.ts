import mongoose, { Document, Schema } from 'mongoose';

export interface ITestResult extends Document {
  userId: mongoose.Types.ObjectId;
  testId: mongoose.Types.ObjectId;
  answers: Record<number, number>;
  score: number;
  totalMarks: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  accuracy: number;
  timeTaken: number;
  startedAt: Date;
  completedAt: Date;
  status: 'completed' | 'abandoned';
  streakAwarded?: boolean;
  streakCount?: number;
}

const testResultSchema = new Schema<ITestResult>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
    answers: { type: Map, of: Number, default: {} },
    score: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    correctAnswers: { type: Number, default: 0 },
    wrongAnswers: { type: Number, default: 0 },
    skippedAnswers: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    timeTaken: { type: Number, default: 0 },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, required: true },
    status: { type: String, enum: ['completed', 'abandoned'], default: 'completed' },
    streakAwarded: { type: Boolean, default: false },
    streakCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

testResultSchema.index({ userId: 1, testId: 1 });
testResultSchema.index({ userId: 1, completedAt: -1 });

export const TestResult = mongoose.model<ITestResult>('TestResult', testResultSchema);
