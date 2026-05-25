import mongoose, { Document, Schema } from 'mongoose';

export interface IContentAccessRule extends Document {
  role: string;
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  maxTests: number;
  isLocked: boolean;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const contentAccessRuleSchema = new Schema<IContentAccessRule>(
  {
    role: { type: String, enum: ['free', 'paid', 'premium'], required: true },
    entityType: { type: String, enum: ['exam', 'test', 'subject', 'study_material'], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    maxTests: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

contentAccessRuleSchema.index({ entityType: 1, entityId: 1, role: 1 }, { unique: true });

export const ContentAccessRule = mongoose.model<IContentAccessRule>('ContentAccessRule', contentAccessRuleSchema);
