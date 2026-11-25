import mongoose, { Schema, Document } from 'mongoose';

export type UserDesignation =
  | 'Dean'
  | 'HOD'
  | 'Dean Academic'
  | 'Director'
  | 'Vice Chancellor'
  | 'Registrar'
  | 'VC / Registrar'
  | 'HR'
  | 'Admin';

export type ProfileRole = string;

export interface IUserMailSettings {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  senderName?: string;
  isConfigured?: boolean;
  lastTestedAt?: string;
}

export interface IUserProfile {
  name: string;
  email: string;
  password?: string;
  designation: UserDesignation;
  role?: string;
  department?: string;
  phone?: string;
  status: 'Active' | 'Inactive';
  canUseOfficialEmail?: boolean;
  mailSettings?: IUserMailSettings;
  createdAt?: string;
}

export interface UserProfileDocument extends IUserProfile, Document {}

const UserProfileSchema = new Schema<UserProfileDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: 'admin123' },
    designation: {
      type: String,
      required: true,
      enum: ['Dean', 'HOD', 'Dean Academic', 'Director', 'Vice Chancellor', 'Registrar', 'VC / Registrar', 'HR', 'Admin']
    },
    role: { type: String, required: false },
    department: { type: String, default: '' },
    phone: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    canUseOfficialEmail: { type: Boolean, default: false },
    mailSettings: {
      smtpHost: { type: String, default: 'smtp.gmail.com' },
      smtpPort: { type: Number, default: 465 },
      smtpUser: { type: String, default: '' },
      smtpPass: { type: String, default: '' },
      senderName: { type: String, default: '' },
      isConfigured: { type: Boolean, default: false },
      lastTestedAt: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

export const UserProfileModel =
  (mongoose.models.UserProfile as mongoose.Model<UserProfileDocument>) ||
  mongoose.model<UserProfileDocument>('UserProfile', UserProfileSchema);
