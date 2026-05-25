import mongoose, { Document, Schema } from 'mongoose';

export interface ITicket extends Document {
  userId: mongoose.Types.ObjectId;
  subject: string;
  description: string;
  category: 'technical' | 'payment' | 'content' | 'general' | 'doubt';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  messages: { sender: 'user' | 'admin'; message: string; attachments: string[]; createdAt: Date }[];
  assignedTo?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  feedback?: { rating: number; comment: string };
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ['technical', 'payment', 'content', 'general', 'doubt'], default: 'general' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
    messages: [{
      sender: { type: String, enum: ['user', 'admin'], required: true },
      message: { type: String, required: true },
      attachments: [{ type: String }],
      createdAt: { type: Date, default: Date.now },
    }],
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
    },
  },
  { timestamps: true }
);

export const Ticket = mongoose.model<ITicket>('Ticket', ticketSchema);
