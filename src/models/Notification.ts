import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  title: string;
  body: string;
  type: 'test_launch' | 'result' | 'promotional' | 'system' | 'reminder';
  targetAudience: 'all' | 'batch' | 'individual';
  targetIds: mongoose.Types.ObjectId[];
  channels: ('email' | 'sms' | 'push')[];
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  scheduledAt?: Date;
  sentAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, enum: ['test_launch', 'result', 'promotional', 'system', 'reminder'], required: true },
    targetAudience: { type: String, enum: ['all', 'batch', 'individual'], default: 'all' },
    targetIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    channels: [{ type: String, enum: ['email', 'sms', 'push'] }],
    status: { type: String, enum: ['draft', 'scheduled', 'sent', 'failed'], default: 'draft' },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
