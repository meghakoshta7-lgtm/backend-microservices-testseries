import mongoose, { Document, Schema } from 'mongoose';

export interface IHomeContent extends Document {
  key: string;
  value: string;
  type: 'text' | 'rich-text' | 'image' | 'json';
  section: string;
  label: string;
  order: number;
  isActive: boolean;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const homeContentSchema = new Schema<IHomeContent>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
    type: { type: String, enum: ['text', 'rich-text', 'image', 'json'], default: 'text' },
    section: { type: String, required: true },
    label: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const HomeContent = mongoose.model<IHomeContent>('HomeContent', homeContentSchema);
