import mongoose, { Schema, Model } from 'mongoose';
import { IHiringRequest } from '../types';

const PromotionChannelSchema = new Schema({
  id: { type: String, required: true },
  channelName: { type: String, required: true },
  cost: { type: Number, default: 0 },
  postDate: { type: String },
  expiryDate: { type: String },
  urlOrRef: { type: String },
  notes: { type: String }
}, { _id: false });

const CandidateSchema = new Schema({
  id: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  currentAffiliation: { type: String, default: '' },
  qualification: { type: String, default: '' },
  experienceYears: { type: Number, default: 0 },
  resumeFileName: { type: String, default: 'Curriculum_Vitae.pdf' },
  status: {
    type: String,
    enum: [
      'Applied',
      'Shortlisted',
      'Interview Scheduled',
      'Interviewed',
      'Selected',
      'Rejected',
      'Offer Issued',
      'Joined'
    ],
    default: 'Applied'
  },
  interviewDetails: {
    date: { type: String },
    panelMembers: [{ type: String }],
    scores: {
      subjectKnowledge: { type: Number, default: 0 },
      researchPublications: { type: Number, default: 0 },
      teachingAptitude: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      totalScore: { type: Number, default: 0 }
    },
    panelRemarks: { type: String },
    recommendation: {
      type: String,
      enum: ['Strongly Recommend', 'Recommend', 'Waitlist', 'Not Recommended']
    },
    evaluatorRatings: [{
      evaluatorName: { type: String },
      rating: { type: Number, default: 0 }
    }],
    scorecardFile: { type: String }
  },
  joiningDetails: {
    offerLetterRef: { type: String },
    offerLetterDate: { type: String },
    offeredCtc: { type: String },
    basicSalary: { type: String },
    academicLevel: { type: String },
    probationPeriod: { type: String },
    joiningDeadline: { type: String },
    offerRemarks: { type: String },
    offerLetterFile: { type: String },
    documentVerification: {
      identityProof: { type: Boolean, default: false },
      degreesVerified: { type: Boolean, default: false },
      experienceCertificates: { type: Boolean, default: false },
      policeVerification: { type: Boolean, default: false },
      medicalFitness: { type: Boolean, default: false },
      nocRelieving: { type: Boolean, default: false },
      verificationRemarks: { type: String },
      uploadedFiles: { type: Object, default: {} }
    },
    signedOfferLetterCopy: { type: String },
    inductionCompleted: { type: Boolean, default: false },
    inductionChecklist: {
      idCardIssued: { type: Boolean, default: false },
      itAccountCreated: { type: Boolean, default: false },
      workloadAssigned: { type: Boolean, default: false },
      bankAccountOpened: { type: Boolean, default: false }
    },
    joiningDate: { type: String },
    employeeId: { type: String },
    officialEmail: { type: String },
    reportingHead: { type: String },
    joiningRemarks: { type: String }
  }
}, { _id: false });

const CommentSchema = new Schema({
  id: { type: String, required: true },
  authorName: { type: String, required: true },
  authorRole: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: String, required: true },
  category: {
    type: String,
    enum: ['Query', 'Clarification', 'Remark', 'Internal Note'],
    default: 'Remark'
  }
}, { _id: false });

const AuditLogSchema = new Schema({
  id: { type: String, required: true },
  action: { type: String, required: true },
  performedBy: { type: String, required: true },
  role: { type: String, required: true },
  details: { type: String, required: true },
  timestamp: { type: String, required: true }
}, { _id: false });

const ClarificationMessageSchema = new Schema({
  id: { type: String, required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true },
  senderEmail: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: String, required: true }
}, { _id: false });

const ClarificationRecipientSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true },
  department: { type: String }
}, { _id: false });

const ClarificationThreadSchema = new Schema({
  id: { type: String, required: true },
  subject: { type: String, required: true },
  creatorName: { type: String, required: true },
  creatorRole: { type: String, required: true },
  creatorEmail: { type: String, required: true },
  primaryRecipientRole: {
    type: String,
    enum: ['Department / Dean', 'Dean Academic', 'Both'],
    required: true
  },
  primaryRecipientEmail: { type: String },
  primaryRecipientName: { type: String },
  ccRecipients: [ClarificationRecipientSchema],
  status: { type: String, enum: ['Open', 'Resolved'], default: 'Open' },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
  messages: [ClarificationMessageSchema]
}, { _id: false });

const HiringRequestSchema = new Schema<IHiringRequest>(
  {
    requestId: { type: String, required: true, unique: true, index: true },
    department: { type: String, required: true, index: true },
    postTitle: { type: String, required: true },
    postLevel: { type: String, required: true },
    employmentType: { type: String, enum: ['Teaching', 'Non-Teaching'], required: true },
    numberOfPositions: { type: Number, required: true, default: 1 },
    justification: { type: String, required: true },
    requiredQualifications: { type: String, required: true },
    experienceRequired: { type: String, required: true },
    tentativeBudget: { type: String, required: true },
    budgetAmountNumber: { type: Number, default: 0 },
    urgency: { type: String, enum: ['Normal', 'High', 'Urgent'], default: 'Normal' },
    creator: {
      name: { type: String, required: true },
      role: { type: String, required: true },
      email: { type: String, required: true }
    },
    status: {
      type: String,
      enum: [
        'Request Submitted (Department)',
        'Under Review (Dean Academic)',
        'Approved by Dean Academic',
        'Under Review (VC / Registrar)',
        'Approved by VC / Registrar',
        'In Process (HR - Recruitment)',
        'Interview & Selection Completed',
        'Joined & Request Closed',
        'Returned for Clarification',
        'Rejected',
        'Position Fulfilled (Recruitment Completed)',
        'Applications Closed (Intake Stopped)',
        'Hiring On Hold'
      ],
      default: 'Request Submitted (Department)',
      index: true
    },
    currentStage: { type: Number, default: 1 },
    deanAcademicApproval: {
      decision: { type: String, enum: ['Approved', 'Rejected', 'Clarification'] },
      remarks: { type: String },
      decidedBy: { type: String },
      decidedAt: { type: String }
    },
    vcRegistrarApproval: {
      decision: { type: String, enum: ['Approved', 'Rejected', 'Clarification'] },
      remarks: { type: String },
      decidedBy: { type: String },
      decidedAt: { type: String }
    },
    promotionChannels: [PromotionChannelSchema],
    totalPromotionCost: { type: Number, default: 0 },
    candidates: [CandidateSchema],
    comments: [CommentSchema],
    clarificationThreads: [ClarificationThreadSchema],
    auditTrail: [AuditLogSchema]
  },
  {
    timestamps: true
  }
);

if (process.env.NODE_ENV !== 'production' && mongoose.models.HiringRequest) {
  delete mongoose.models.HiringRequest;
}
export const HiringRequestModel: Model<IHiringRequest> =
  mongoose.models.HiringRequest || mongoose.model<IHiringRequest>('HiringRequest', HiringRequestSchema);
