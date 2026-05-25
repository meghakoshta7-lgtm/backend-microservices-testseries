import mongoose, { Document, Schema } from 'mongoose';

export interface ISubject extends Document {
  name: string;
  icon: string;
  color: string;
  categoryId?: mongoose.Types.ObjectId;
  description: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
}

const subjectSchema = new Schema<ISubject>(
  {
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: 'BookOpen' },
    color: { type: String, default: '#3273e6' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'ExamCategory' },
    description: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

subjectSchema.index({ categoryId: 1, name: 1 }, { unique: true });

export const Subject = mongoose.model<ISubject>('Subject', subjectSchema);
