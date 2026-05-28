import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  userId: mongoose.Types.ObjectId;
  role: 'user' | 'bot';
  message: string;
  createdAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['user', 'bot'], required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

chatMessageSchema.index({ userId: 1, createdAt: 1 });

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
