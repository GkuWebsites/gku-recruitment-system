import { AcademicDepartment, UserRole, HiringStatus } from './types';

export const UNIVERSITY_DEPARTMENTS: AcademicDepartment[] = [
  'Computer Science & Engineering',
  'Mechanical Engineering',
  'Management Studies',
  'Agriculture & Forestry',
  'Pharmaceutical Sciences',
  'Faculty of Law',
  'Basic & Applied Sciences',
  'Nursing & Allied Health Sciences',
  'Education',
  'Humanities & Languages',
  'Commerce & Finance',
  'Physical Education & Sports'
];

export const USER_ROLES: { id: UserRole; label: string; description: string; avatar: string }[] = [
  {
    id: 'Department / Dean',
    label: 'Department Dean',
    description: 'Raise requests, view department status, reply to clarifications',
    avatar: 'D'
  },
  {
    id: 'Dean Academic',
    label: 'Dean Academic Affairs',
    description: 'First-level academic audit, approve/reject/seek clarification',
    avatar: 'DA'
  },
  {
    id: 'VC / Registrar',
    label: 'VC / Registrar Office',
    description: 'Final institutional & financial administrative approval',
    avatar: 'VC'
  },
  {
    id: 'HR Department',
    label: 'HR Recruitment Cell',
    description: 'Sourcing, promotions, screening, interviews & joining',
    avatar: 'HR'
  },
  {
    id: 'Admin (System)',
    label: 'System Administrator',
    description: 'Complete institutional visibility, audit logs & system setup',
    avatar: 'SA'
  },
  {
    id: 'Expert Panel',
    label: 'Subject Expert / Panelist',
    description: 'Review assigned interviews, evaluate candidates and score out of 50',
    avatar: 'EX'
  }
];

export const RECRUITMENT_STAGES = [
  {
    stage: 1,
    title: 'Raise Requirement',
    owner: 'Department / Dean',
    description: 'Hiring requirement raised with justification, budget and qualification criteria.'
  },
  {
    stage: 2,
    title: 'Review by Dean Academic',
    owner: 'Dean Academic',
    description: 'Academic workload verification, faculty cadre ratio validation & recommendation.'
  },
  {
    stage: 3,
    title: 'Approval by VC / Registrar',
    owner: 'VC / Registrar',
    description: 'Final administrative and financial sanction by competent university authority.'
  },
  {
    stage: 4,
    title: 'HR - Recruitment Process',
    owner: 'HR Department',
    description: 'Advertisement across media channels, application reception and screening.'
  },
  {
    stage: 5,
    title: 'Interview & Evaluation',
    owner: 'HR & Selection Committee',
    description: 'Interview panels convened, scorecards tallied across 4 evaluation domains.'
  },
  {
    stage: 6,
    title: 'Offer & Joining',
    owner: 'HR Onboarding Cell',
    description: 'Offer letters issued, credentials verified, employee code allocated & closed.'
  }
];

export const POST_LEVELS = [
  // Teaching / Academic
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Senior Lecturer',
  'Lecturer',
  'Visiting Professor',
  'Adjunct Faculty',
  'Research Professor',
  'Research Associate',
  'Research Fellow',
  // Administrative / Non-Teaching
  'Registrar',
  'Deputy Registrar',
  'Assistant Registrar',
  'Administrative Officer',
  'Section Officer',
  'Office Superintendent',
  // Finance & Accounts
  'Finance Officer',
  'Accounts Officer',
  'Accounts & Finance Executive',
  'Audit Officer',
  // Technical / Lab
  'Lab Superintendent',
  'Lab Technician / Technical Staff',
  'Systems Analyst / IT Officer',
  'Network & Infrastructure Engineer',
  // Library
  'Librarian',
  'Deputy Librarian',
  'Assistant Librarian',
  'Library Assistant',
  // Support
  'Sports Officer',
  'Medical Officer / Medical Superintendent',
  'Student Counsellor / Welfare Officer',
  'Public Relations Officer',
  // Other
  'Other'
];

export const PROMOTION_CHANNELS_LIST = [
  'Times Ascent (National Newspaper)',
  'LinkedIn Talent Solutions',
  'Guru Kashi University Career Portal',
  'Naukri.com Education Portal',
  'The Tribune / Regional Daily',
  'University News (AIU Publication)',
  'Indeed Higher Ed'
];
