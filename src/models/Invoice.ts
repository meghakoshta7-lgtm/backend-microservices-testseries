import mongoose, { Document, Schema } from 'mongoose';

export interface IInvoice extends Document {
  userId: mongoose.Types.ObjectId;
  paymentId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  plan: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'cancelled' | 'refunded';
  items: { description: string; amount: number; quantity: number }[];
  billingAddress?: Record<string, any>;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    invoiceNumber: { type: String, required: true, unique: true },
    plan: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: { type: String, enum: ['paid', 'pending', 'cancelled', 'refunded'], default: 'paid' },
    items: [{
      description: { type: String, required: true },
      amount: { type: Number, required: true },
      quantity: { type: Number, default: 1 },
    }],
    billingAddress: { type: Schema.Types.Mixed },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
