import mongoose, { Document, Schema } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  targetAudience: 'all' | 'batch' | 'individual';
  targetIds: mongoose.Types.ObjectId[];
  priority: 'low' | 'medium' | 'high';
  isActive: boolean;
  pinned: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['info', 'warning', 'success', 'alert'], default: 'info' },
    targetAudience: { type: String, enum: ['all', 'batch', 'individual'], default: 'all' },
    targetIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    isActive: { type: Boolean, default: true },
    pinned: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Announcement = mongoose.model<IAnnouncement>('Announcement', announcementSchema);
