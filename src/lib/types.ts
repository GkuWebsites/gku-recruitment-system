export type UserRole = 
  | 'Department / Dean'
  | 'Dean Academic'
  | 'VC / Registrar'
  | 'HR Department'
  | 'Admin (System)';

export type HiringStatus =
  | 'Request Submitted (Department)'
  | 'Under Review (Dean Academic)'
  | 'Approved by Dean Academic'
  | 'Under Review (VC / Registrar)'
  | 'Approved by VC / Registrar'
  | 'In Process (HR - Recruitment)'
  | 'Interview & Selection Completed'
  | 'Joined & Request Closed'
  | 'Returned for Clarification'
  | 'Rejected'
  | 'Position Fulfilled (Recruitment Completed)'
  | 'Applications Closed (Intake Stopped)'
  | 'Hiring On Hold';

export type EmploymentType = 'Teaching' | 'Non-Teaching';

export type AcademicDepartment =
  | 'Computer Science & Engineering'
  | 'Mechanical Engineering'
  | 'Management Studies'
  | 'Agriculture & Forestry'
  | 'Pharmaceutical Sciences'
  | 'Faculty of Law'
  | 'Basic & Applied Sciences'
  | 'Nursing & Allied Health Sciences'
  | 'Education'
  | 'Humanities & Languages'
  | 'Commerce & Finance'
  | 'Physical Education & Sports';

export interface AuditLogEntry {
  id: string;
  action: string;
  performedBy: string;
  role: UserRole;
  details: string;
  timestamp: string;
}

export interface CommentEntry {
  id: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
  timestamp: string;
  category: 'Query' | 'Clarification' | 'Remark' | 'Internal Note';
}

export interface PromotionChannel {
  id: string;
  channelName: string; // e.g. Times Ascent, LinkedIn, University Portal, Naukri
  cost: number;
  postDate: string;
  expiryDate: string;
  urlOrRef?: string;
  notes?: string;
}

export interface InterviewScores {
  subjectKnowledge: number; // 40
  researchPublications: number; // 25
  teachingAptitude: number; // 20
  communication: number; // 15
  totalScore: number; // 100
}

export interface DocumentFileMeta {
  fileName: string;
  fileSize?: string;
  uploadedAt?: string;
  category?: string;
}

export interface DocumentVerification {
  identityProof: boolean;
  degreesVerified: boolean;
  experienceCertificates: boolean;
  policeVerification: boolean;
  medicalFitness?: boolean;
  nocRelieving?: boolean;
  verificationRemarks?: string;
  uploadedFiles?: Record<string, DocumentFileMeta>;
  [key: string]: any;
}

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  currentAffiliation: string;
  qualification: string;
  experienceYears: number;
  resumeFileName?: string;
  status: 'Applied' | 'Shortlisted' | 'Interview Scheduled' | 'Interviewed' | 'Selected' | 'Rejected' | 'Offer Issued' | 'Joined';
  interviewDetails?: {
    date: string;
    panelMembers: string[];
    scores: InterviewScores;
    panelRemarks: string;
    recommendation: 'Strongly Recommend' | 'Recommend' | 'Waitlist' | 'Not Recommended';
    evaluatorRatings?: {
      evaluatorName: string;
      rating: number;
    }[];
    scorecardFile?: string;
  };
  joiningDetails?: {
    offerLetterRef?: string;
    offerLetterDate?: string;
    offeredCtc?: string;
    basicSalary?: string;
    academicLevel?: string;
    probationPeriod?: string;
    joiningDeadline?: string;
    offerRemarks?: string;
    offerLetterFile?: string;
    signedOfferLetterCopy?: string;
    documentVerification: DocumentVerification;
    inductionCompleted: boolean;
    inductionChecklist?: {
      idCardIssued?: boolean;
      itAccountCreated?: boolean;
      workloadAssigned?: boolean;
      bankAccountOpened?: boolean;
    };
    joiningDate?: string;
    employeeId?: string;
    officialEmail?: string;
    reportingHead?: string;
    joiningRemarks?: string;
    dispatchedFromEmail?: string;
    dispatchedFromName?: string;
    dispatchedAt?: string;
    emailDispatchStatus?: 'Sent' | 'Failed' | 'Draft';
  };
}

export interface IClarificationMessage {
  id: string;
  senderName: string;
  senderRole: string; // 'Department / Dean' | 'Dean Academic' | 'VC / Registrar' | 'HR Department' | 'Admin'
  senderEmail: string;
  text: string;
  timestamp: string;
}

export interface IClarificationRecipient {
  name: string;
  email: string;
  role: string;
  department?: string;
}

export interface IClarificationThread {
  id: string;
  subject: string;
  creatorName: string;
  creatorRole: string;
  creatorEmail: string;
  primaryRecipientRole: 'Department / Dean' | 'Dean Academic' | 'Both';
  primaryRecipientEmail?: string;
  primaryRecipientName?: string;
  ccRecipients: IClarificationRecipient[];
  status: 'Open' | 'Resolved';
  createdAt: string;
  updatedAt: string;
  messages: IClarificationMessage[];
}

export interface IHiringRequest {
  _id?: string;
  requestId: string;
  department: AcademicDepartment;
  postTitle: string;
  postLevel: string;
  employmentType: EmploymentType;
  numberOfPositions: number;
  justification: string;
  requiredQualifications: string;
  experienceRequired: string;
  tentativeBudget: string;
  budgetAmountNumber?: number;
  urgency: 'Normal' | 'High' | 'Urgent';
  jobDescriptionFile?: string;
  creator: {
    name: string;
    role: UserRole;
    email: string;
  };
  status: HiringStatus;
  currentStage: number; // 1 to 6
  deanAcademicApproval?: {
    decision: 'Approved' | 'Rejected' | 'Clarification';
    remarks: string;
    decidedBy: string;
    decidedAt?: string;
  };
  vcRegistrarApproval?: {
    decision: 'Approved' | 'Rejected' | 'Clarification';
    remarks: string;
    decidedBy: string;
    decidedAt?: string;
  };
  promotionChannels: PromotionChannel[];
  totalPromotionCost: number;
  candidates: Candidate[];
  comments: CommentEntry[];
  clarificationThreads?: IClarificationThread[];
  auditTrail: AuditLogEntry[];
  createdAt: string;
  updatedAt: string;
}
