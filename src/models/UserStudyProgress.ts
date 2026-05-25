import mongoose, { Document, Schema } from 'mongoose';

export interface IUserStudyProgress extends Document {
  userId: mongoose.Types.ObjectId;
  materialId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  progress: number;
  isCompleted: boolean;
  isBookmarked: boolean;
  isDownloaded: boolean;
  isInLibrary: boolean;
  lastAccessedAt: Date;
  completedAt?: Date;
  totalStudyTime: number;
}

const userStudyProgressSchema = new Schema<IUserStudyProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    materialId: { type: Schema.Types.ObjectId, ref: 'StudyMaterial', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    isCompleted: { type: Boolean, default: false },
    isBookmarked: { type: Boolean, default: false },
    isDownloaded: { type: Boolean, default: false },
    isInLibrary: { type: Boolean, default: false },
    lastAccessedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    totalStudyTime: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userStudyProgressSchema.index({ userId: 1, materialId: 1 }, { unique: true });
userStudyProgressSchema.index({ userId: 1, isBookmarked: 1 });
userStudyProgressSchema.index({ userId: 1, isInLibrary: 1 });
userStudyProgressSchema.index({ userId: 1, isCompleted: 1 });

export const UserStudyProgress = mongoose.model<IUserStudyProgress>('UserStudyProgress', userStudyProgressSchema);
