import mongoose, { Document, Schema } from 'mongoose';

export interface ITopic extends Document {
  name: string;
  slug: string;
  subjectId: mongoose.Types.ObjectId;
  description: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const topicSchema = new Schema<ITopic>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    description: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

topicSchema.index({ subjectId: 1, order: 1 });
topicSchema.index({ subjectId: 1, slug: 1 }, { unique: true });

export const Topic = mongoose.model<ITopic>('Topic', topicSchema);
