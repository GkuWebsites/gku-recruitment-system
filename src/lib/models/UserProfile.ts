import mongoose, { Schema, Document } from 'mongoose';

export type UserDesignation =
  | 'Dean'
  | 'Dean Academic'
  | 'Director'
  | 'VC / Registrar'
  | 'HR'
  | 'Admin';

export type ProfileRole = string;

export interface IUserProfile {
  name: string;
  email: string;
  password?: string;
  designation: UserDesignation;
  role?: string;
  department?: string;
  phone?: string;
  status: 'Active' | 'Inactive';
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
      enum: ['Dean', 'Dean Academic', 'Director', 'VC / Registrar', 'HR', 'Admin']
    },
    role: { type: String, required: false },
    department: { type: String, default: '' },
    phone: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
  },
  { timestamps: true }
);

export const UserProfileModel =
  (mongoose.models.UserProfile as mongoose.Model<UserProfileDocument>) ||
  mongoose.model<UserProfileDocument>('UserProfile', UserProfileSchema);
