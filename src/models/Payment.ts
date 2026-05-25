import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  plan: string;
  billingCycle?: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  orderId: string;
  transactionId: string;
  utr?: string;
  upiId?: string;
  qrPayload?: string;
  paidAt?: Date;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    plan: { type: String, default: 'free', trim: true, lowercase: true },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    paymentMethod: { type: String, default: '' },
    orderId: { type: String, unique: true, required: true },
    transactionId: { type: String, unique: true },
    utr: { type: String, unique: true, sparse: true },
    upiId: { type: String, default: '' },
    qrPayload: { type: String, default: '' },
    paidAt: { type: Date },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    autoRenew: { type: Boolean, default: true },
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ orderId: 1, userId: 1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
