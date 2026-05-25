import mongoose, { Document, Schema } from 'mongoose';

export interface IEnrollment extends Document {
  userId: mongoose.Types.ObjectId;
  testId: mongoose.Types.ObjectId;
  enrolledAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
  enrolledAt: { type: Date, default: Date.now },
});

enrollmentSchema.index({ userId: 1, testId: 1 }, { unique: true });
enrollmentSchema.index({ userId: 1, enrolledAt: -1 });

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
