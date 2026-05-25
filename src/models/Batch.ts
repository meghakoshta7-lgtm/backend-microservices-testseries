import mongoose, { Document, Schema } from 'mongoose';

export interface IBatch extends Document {
  name: string;
  description: string;
  code: string;
  subjects: string[];
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const batchSchema = new Schema<IBatch>(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    code: { type: String, required: true, unique: true },
    subjects: [{ type: String }],
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Batch = mongoose.model<IBatch>('Batch', batchSchema);
