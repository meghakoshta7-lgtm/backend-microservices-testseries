import mongoose, { Document, Schema } from 'mongoose';

export interface IMaterialPurchase extends Document {
  userId: mongoose.Types.ObjectId;
  materialId: mongoose.Types.ObjectId;
  category: string;
  amount: number;
  purchasedAt: Date;
}

const materialPurchaseSchema = new Schema<IMaterialPurchase>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  materialId: { type: Schema.Types.ObjectId, ref: 'StudyMaterial', required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  purchasedAt: { type: Date, default: Date.now },
});

materialPurchaseSchema.index({ userId: 1, materialId: 1 }, { unique: true });
materialPurchaseSchema.index({ userId: 1, category: 1 });

export const MaterialPurchase = mongoose.model<IMaterialPurchase>('MaterialPurchase', materialPurchaseSchema);
