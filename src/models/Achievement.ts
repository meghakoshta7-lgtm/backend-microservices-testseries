import mongoose, { Document, Schema } from 'mongoose';

export interface IAchievement extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  category: string;
}

const achievementSchema = new Schema<IAchievement>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: '🏆' },
    unlockedAt: { type: Date, default: Date.now },
    category: { type: String, default: 'general' },
  },
  { timestamps: true }
);

achievementSchema.index({ userId: 1 });

export const Achievement = mongoose.model<IAchievement>('Achievement', achievementSchema);
