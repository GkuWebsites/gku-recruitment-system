import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment {
  name: string;
  code?: string;
  faculty?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface DepartmentDocument extends IDepartment, Document {}

const DepartmentSchema = new Schema<DepartmentDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, trim: true, default: '' },
    faculty: { type: String, trim: true, default: '' },
    createdBy: { type: String, default: 'Admin' }
  },
  { timestamps: true }
);

export const DepartmentModel =
  (mongoose.models.Department as mongoose.Model<DepartmentDocument>) ||
  mongoose.model<DepartmentDocument>('Department', DepartmentSchema);
