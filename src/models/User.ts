import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '@/config';

export type UserRole = 'super_admin' | 'admin' | 'editor' | 'support' | 'user';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  phone?: string;
  city?: string;
  state?: string;
  targetExam?: string;
  education?: string;
  class?: string;
  isEmailVerified: boolean;
  isLoginDisabled: boolean;
  otpCode?: string;
  otpExpires?: Date;
  emailVerificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  resetPasswordCode?: string;
  streak: number;
  lastStreakDate?: Date;
  lastActiveDate: Date;
  totalTestsCompleted: number;
  totalPoints: number;
  totalAttempts: number;
  averageScore: number;
  accuracy: number;
  totalTimeSpent: number;
  batchId?: mongoose.Types.ObjectId;
  groupIds: mongoose.Types.ObjectId[];
  refreshToken?: string;
  notificationPreferences?: {
    emailNotifications: boolean;
    testReminders: boolean;
    leaderboardUpdates: boolean;
    promotionalEmails: boolean;
    resultNotifications: boolean;
    achievementAlerts: boolean;
    systemUpdates: boolean;
  };
  appearanceSettings?: {
    theme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
  };
  bookmarkedQuestions?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateTokens(): { accessToken: string; refreshToken: string };
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['super_admin', 'admin', 'editor', 'support', 'user'], default: 'user' },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 200 },
    phone: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    targetExam: { type: String, default: '' },
    education: { type: String, default: '' },
    class: { type: String, default: '' },
    isEmailVerified: { type: Boolean, default: false },
    isLoginDisabled: { type: Boolean, default: false },
    otpCode: { type: String },
    otpExpires: { type: Date },
    emailVerificationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    resetPasswordCode: { type: String },
    streak: { type: Number, default: 0 },
    lastStreakDate: { type: Date },
    lastActiveDate: { type: Date, default: Date.now },
    totalTestsCompleted: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    totalAttempts: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch' },
    groupIds: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
    refreshToken: { type: String },
    notificationPreferences: {
      type: {
        emailNotifications: { type: Boolean, default: true },
        testReminders: { type: Boolean, default: true },
        leaderboardUpdates: { type: Boolean, default: false },
        promotionalEmails: { type: Boolean, default: false },
        resultNotifications: { type: Boolean, default: true },
        achievementAlerts: { type: Boolean, default: true },
        systemUpdates: { type: Boolean, default: true },
      },
      default: {},
    },
    appearanceSettings: {
      type: {
        theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
        fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
        compactMode: { type: Boolean, default: false },
      },
      default: {},
    },
    bookmarkedQuestions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, config.bcrypt.rounds);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateTokens = function (): { accessToken: string; refreshToken: string } {
  const jwt = require('jsonwebtoken');
  const accessToken = jwt.sign(
    { userId: this._id, email: this.email, role: this.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  const refreshToken = jwt.sign(
    { userId: this._id },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
  return { accessToken, refreshToken };
};

export const User = mongoose.model<IUser>('User', userSchema);
