import mongoose, { Schema, Document } from 'mongoose';

export interface IMailDeskConfig {
  deskId: 'hr' | 'hrm';
  deskName: string;
  email: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  isConfigured: boolean;
  lastTestedAt?: string;
  allowedRoles?: string[]; // which roles can dispatch from this desk
}

export interface ISystemSettings {
  key: string;
  centralMailDesks: {
    hr: IMailDeskConfig;
    hrm: IMailDeskConfig;
  };
  allowedCorporateEmailUsers: string[]; // List of emails allowed to send from personal official email
  updatedAt?: Date;
}

export interface SystemSettingsDocument extends ISystemSettings, Document {}

const MailDeskConfigSchema = new Schema(
  {
    deskId: { type: String, required: true },
    deskName: { type: String, required: true },
    email: { type: String, required: true },
    smtpHost: { type: String, default: 'smtp.gmail.com' },
    smtpPort: { type: Number, default: 465 },
    smtpUser: { type: String, default: '' },
    smtpPass: { type: String, default: '' },
    isConfigured: { type: Boolean, default: false },
    lastTestedAt: { type: String, default: '' },
    allowedRoles: { type: [String], default: ['HR', 'Admin'] }
  },
  { _id: false }
);

const SystemSettingsSchema = new Schema<SystemSettingsDocument>(
  {
    key: { type: String, required: true, unique: true, default: 'global_settings' },
    centralMailDesks: {
      hr: {
        type: MailDeskConfigSchema,
        default: () => ({
          deskId: 'hr',
          deskName: 'Directorate of HR & Faculty Affairs',
          email: 'hr@gku.ac.in',
          smtpHost: 'smtp.gmail.com',
          smtpPort: 465,
          smtpUser: 'hr@gku.ac.in',
          smtpPass: '',
          isConfigured: false,
          allowedRoles: ['HR', 'Admin']
        })
      },
      hrm: {
        type: MailDeskConfigSchema,
        default: () => ({
          deskId: 'hrm',
          deskName: 'GKU Talent Acquisition & Recruitment Portal',
          email: 'hrm@gku.ac.in',
          smtpHost: 'smtp.gmail.com',
          smtpPort: 465,
          smtpUser: 'hrm@gku.ac.in',
          smtpPass: '',
          isConfigured: false,
          allowedRoles: ['HR', 'Admin']
        })
      }
    },
    allowedCorporateEmailUsers: { type: [String], default: ['nancy172122@gku.ac.in'] }
  },
  { timestamps: true }
);

export const SystemSettingsModel =
  (mongoose.models.SystemSettings as mongoose.Model<SystemSettingsDocument>) ||
  mongoose.model<SystemSettingsDocument>('SystemSettings', SystemSettingsSchema);
