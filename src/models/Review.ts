import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  status: string;
  reviewerId: mongoose.Types.ObjectId;
  comments: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    entityType: { type: String, enum: ['test', 'question', 'study_material', 'exam'], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    status: { type: String, enum: ['draft', 'review', 'approved', 'rejected'], default: 'draft' },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User' },
    comments: { type: String, default: '' },
  },
  { timestamps: true }
);

reviewSchema.index({ entityType: 1, entityId: 1 });
reviewSchema.index({ status: 1 });

export const Review = mongoose.model<IReview>('Review', reviewSchema);
