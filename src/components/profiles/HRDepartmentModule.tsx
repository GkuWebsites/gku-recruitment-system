'use client';

import React, { useState } from 'react';
import { IHiringRequest, Candidate, PromotionChannel, HiringStatus } from '@/lib/types';
import { TimelineModal } from '@/components/TimelineModal';
import { JobDetailsModal } from '@/components/JobDetailsModal';
import { OfferLetterWorkbench } from '@/components/OfferLetterWorkbench';
import {
  Users,
  Megaphone,
  Calendar,
  UserPlus,
  CheckCircle2,
  Clock,
  Search,
  AlertCircle,
  Plus,
  FileText,
  Building2,
  Check,
  Send,
  ExternalLink,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Sparkles,
  ArrowRight,
  FileCheck2,
  Award,
  UserCheck,
  CheckCircle,
  Star,
  X,
  SlidersHorizontal,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  FolderCheck,
  Folder,
  FolderOpen,
  Archive,
  RotateCcw,
  Ban,
  UploadCloud,
  Trash2,
  Upload
} from 'lucide-react';

interface HRDepartmentModuleProps {
  requests: IHiringRequest[];
  onSelectRequest: (request: IHiringRequest) => void;
  onRefresh: () => void;
}

export function HRDepartmentModule({
  requests,
  onSelectRequest,
  onRefresh
}: HRDepartmentModuleProps) {
  // 6 Dedicated Tabs for the HR Pipeline (including Archive Cabinet)
  type HRTab = 'approved' | 'posted' | 'interviews' | 'offerLetters' | 'pipeline' | 'archive';
  const [activeTab, setActiveTab] = useState<HRTab>('approved');
  const [searchQuery, setSearchQuery] = useState('');
  const [openedFolders, setOpenedFolders] = useState<Record<string, boolean>>({});

  // Modals state
  const [postingReq, setPostingReq] = useState<IHiringRequest | null>(null);
  const [resumeReq, setResumeReq] = useState<IHiringRequest | null>(null);
  const [viewApplicantsReq, setViewApplicantsReq] = useState<IHiringRequest | null>(null);
  const [schedulingReq, setSchedulingReq] = useState<IHiringRequest | null>(null);
  const [schedulingCand, setSchedulingCand] = useState<Candidate | null>(null);

  // Interview Scoring & Evaluation Modal (Evaluator Ratings & Scorecard Upload)
  interface EvaluatorScoreItem {
    id: string;
    name: string;
    rating: number | string;
  }
  const [evaluatingReq, setEvaluatingReq] = useState<IHiringRequest | null>(null);
  const [evaluatingCand, setEvaluatingCand] = useState<Candidate | null>(null);
  const [evaluatorEntries, setEvaluatorEntries] = useState<EvaluatorScoreItem[]>([
    { id: 'ev-1', name: 'Dr. Harpreet Singh (Dean)', rating: 8.0 },
    { id: 'ev-2', name: 'Subject Expert Nominee', rating: 8.0 }
  ]);
  const [scorecardFileName, setScorecardFileName] = useState<string>('');
  const [scorecardFileSize, setScorecardFileSize] = useState<string>('');
  const [evalRecommendation, setEvalRecommendation] = useState<'Strongly Recommend' | 'Recommend' | 'Waitlist' | 'Not Recommended'>('Recommend');
  const [evalRemarks, setEvalRemarks] = useState('');
  const [evalDecision, setEvalDecision] = useState<'interviewed' | 'shortlist' | 'reject'>('interviewed');

  const handleAddEvaluator = () => {
    setEvaluatorEntries((prev) => [
      ...prev,
      { id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, name: '', rating: 8.0 }
    ]);
  };

  const handleRemoveEvaluator = (id: string) => {
    setEvaluatorEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleEvaluatorNameChange = (id: string, name: string) => {
    setEvaluatorEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, name } : e))
    );
  };

  const handleEvaluatorRatingChange = (id: string, rating: string) => {
    setEvaluatorEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, rating } : e))
    );
  };

  const handleScorecardUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScorecardFileName(file.name);
      setScorecardFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    }
  };

  // Collapse / Expand state for Accordions in Tab 2, Tab 3, Tab 4
  const [expandedPostedReqs, setExpandedPostedReqs] = useState<Record<string, boolean>>({});
  const [expandedInterviewReqs, setExpandedInterviewReqs] = useState<Record<string, boolean>>({});
  const [expandedOfferReqs, setExpandedOfferReqs] = useState<Record<string, boolean>>({});

  // Manage Recruitment & Intake Closure Modal
  const [manageStatusReq, setManageStatusReq] = useState<IHiringRequest | null>(null);
  const [statusUpdateChoice, setStatusUpdateChoice] = useState<HiringStatus>('Position Fulfilled (Recruitment Completed)');
  const [statusUpdateReason, setStatusUpdateReason] = useState<string>('');
  const [postedIntakeFilter, setPostedIntakeFilter] = useState<'all' | 'active' | 'closed'>('all');

  // Offer Letter & Onboarding Modals
  const [offerReq, setOfferReq] = useState<IHiringRequest | null>(null);
  const [offerCand, setOfferCand] = useState<Candidate | null>(null);
  const [onboardReq, setOnboardReq] = useState<IHiringRequest | null>(null);
  const [onboardCand, setOnboardCand] = useState<Candidate | null>(null);

  // Timeline & Job Details
  const [timelineReq, setTimelineReq] = useState<IHiringRequest | null>(null);
  const [jobDetailsReq, setJobDetailsReq] = useState<IHiringRequest | null>(null);

  // Available media platforms for job advertisement
  const AVAILABLE_PLATFORMS = [
    { id: 'LinkedIn Jobs', label: 'LinkedIn Jobs', icon: '💼', tag: 'Global Portal' },
    { id: 'Indeed', label: 'Indeed', icon: '🔍', tag: 'Job Search Engine' },
    { id: 'Naukri.com', label: 'Naukri.com', icon: '🌐', tag: 'India #1 Portal' },
    { id: 'University Careers Website', label: 'University Careers Website', icon: '🏛️', tag: 'Official Website' },
    { id: 'Newspaper (Times Ascent)', label: 'Newspaper (Times Ascent)', icon: '📰', tag: 'National Daily' },
    { id: 'Newspaper (The Tribune)', label: 'Newspaper (The Tribune)', icon: '🗞️', tag: 'Regional Daily' },
    { id: 'University News (AIU Publication)', label: 'University News (AIU Publication)', icon: '📚', tag: 'Academic Journal' }
  ];

  // Form states: 1. Post Job
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    'LinkedIn Jobs',
    'Naukri.com',
    'University Careers Website'
  ]);
  const [postingRemarks, setPostingRemarks] = useState('');
  const [adSpendBudget, setAdSpendBudget] = useState('');
  const [adExpiry, setAdExpiry] = useState('2026-12-31');

  // Form states: 2. Upload Resume
  const [candName, setCandName] = useState('');
  const [candPhone, setCandPhone] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candQual, setCandQual] = useState('');
  const [candExp, setCandExp] = useState('3');
  const [candAffiliation, setCandAffiliation] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeFileName, setResumeFileName] = useState('');

  // Form states: 3. Schedule Interview (Interactive Panel Members Adder)
  const [interviewDate, setInterviewDate] = useState('2026-12-10');
  const [interviewTime, setInterviewTime] = useState('11:00 AM');
  const [panelMembersList, setPanelMembersList] = useState<string[]>([
    'Prof. Balwant Singh (Dean Academic)',
    'Subject Expert Nominee'
  ]);
  const [memberInput, setMemberInput] = useState('');
  const [interviewVenue, setInterviewVenue] = useState('Board Room 1, Guru Kashi University');

  // Comprehensive Form states: 4. Issue Offer Letter
  const [offerLetterRef, setOfferLetterRef] = useState('');
  const [offeredCtc, setOfferedCtc] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [academicLevel, setAcademicLevel] = useState('Academic Level 10 (Cell 1)');
  const [probationPeriod, setProbationPeriod] = useState('1 Year');
  const [joiningDeadline, setJoiningDeadline] = useState('2026-12-31');
  const [offerRemarks, setOfferRemarks] = useState('');
  const [offerLetterFile, setOfferLetterFile] = useState('GKU_Formal_Appointment_Offer.pdf');

  // Form states: Document Verification Desk
  const [docVerifyReq, setDocVerifyReq] = useState<IHiringRequest | null>(null);
  const [docVerifyCand, setDocVerifyCand] = useState<Candidate | null>(null);
  const [docIdentityProof, setDocIdentityProof] = useState(true);
  const [docDegreesVerified, setDocDegreesVerified] = useState(true);
  const [docExperienceCertificates, setDocExperienceCertificates] = useState(true);
  const [docPoliceVerification, setDocPoliceVerification] = useState(true);
  const [docMedicalFitness, setDocMedicalFitness] = useState(true);
  const [docNocRelieving, setDocNocRelieving] = useState(true);
  const [docRemarks, setDocRemarks] = useState('All statutory original credentials, degrees & clearances verified.');

  // Form states: 5. Formal Faculty Joining & Induction
  const [employeeId, setEmployeeId] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [reportingHead, setReportingHead] = useState('');
  const [joiningDate, setJoiningDate] = useState('2026-12-15');
  const [chkIdCard, setChkIdCard] = useState(true);
  const [chkItAccount, setChkItAccount] = useState(true);
  const [chkWorkload, setChkWorkload] = useState(true);
  const [chkBankAccount, setChkBankAccount] = useState(true);
  const [joiningRemarks, setJoiningRemarks] = useState('Faculty induction completed. Smart card issued & biometric enrollment completed.');

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Helper for Panel Member Adder
  const handleAddMember = (nameToAdd?: string) => {
    const name = (nameToAdd || memberInput).trim();
    if (!name) return;
    if (!panelMembersList.includes(name)) {
      setPanelMembersList([...panelMembersList, name]);
    }
    setMemberInput('');
  };

  const handleRemoveMember = (idxToRemove: number) => {
    setPanelMembersList(panelMembersList.filter((_, idx) => idx !== idxToRemove));
  };

  // --- FILTERING LOGIC FOR THE 5 TABS ---

  // All requisitions that have completed full governance clearance (Dean Academic + VC/Registrar)
  const allSanctioned = requests.filter(
    (r) =>
      r.status !== 'Rejected' &&
      r.deanAcademicApproval?.decision === 'Approved' &&
      (r.currentStage >= 4 ||
        r.vcRegistrarApproval?.decision === 'Approved' ||
        [
          'Approved by VC / Registrar',
          'In Process (HR - Recruitment)',
          'Interview & Selection Completed',
          'Joined & Request Closed'
        ].includes(r.status))
  );

  // TAB 1: Approved for Hiring (Awaiting Media Posting)
  const approvedForPosting = allSanctioned.filter(
    (r) => !r.promotionChannels || r.promotionChannels.length === 0
  );

  // TAB 6: Archives & Fulfilled Cabinet (Closed, Fulfilled, or Completed drives stored separately)
  const archivedReqs = allSanctioned.filter(
    (r) =>
      r.status === 'Position Fulfilled (Recruitment Completed)' ||
      r.status === 'Joined & Request Closed' ||
      r.status === 'Applications Closed (Intake Stopped)' ||
      r.status === 'Hiring On Hold'
  );

  // TAB 2: Active Posted Jobs (Only genuinely active postings receiving/screening resumes)
  const activePostedJobs = allSanctioned.filter(
    (r) =>
      r.promotionChannels &&
      r.promotionChannels.length > 0 &&
      r.status !== 'Position Fulfilled (Recruitment Completed)' &&
      r.status !== 'Joined & Request Closed' &&
      r.status !== 'Applications Closed (Intake Stopped)' &&
      r.status !== 'Hiring On Hold'
  );

  // TAB 3: Jobs with Candidates in Interview Pipeline (Scheduled, Interviewed, Evaluated)
  const interviewJobs = allSanctioned.filter((r) =>
    (r.candidates || []).some(
      (c) =>
        c.status === 'Interview Scheduled' ||
        c.status === 'Interviewed' ||
        c.status === 'Selected' ||
        (c.interviewDetails !== undefined && c.status !== 'Joined' && c.status !== 'Offer Issued')
    )
  );

  // TAB 4: Jobs with Shortlisted Candidates & Formal Offers (Selected, Offer Issued, Joined)
  const shortlistedJobs = allSanctioned.filter((r) =>
    (r.candidates || []).some(
      (c) => c.status === 'Selected' || c.status === 'Offer Issued' || c.status === 'Joined'
    )
  );

  // Total Counts for Tabs Badges
  const totalInterviewCandidates = allSanctioned.reduce((sum, req) => {
    return (
      sum +
      (req.candidates || []).filter(
        (c) =>
          c.status === 'Interview Scheduled' ||
          c.status === 'Interviewed' ||
          c.status === 'Selected' ||
          (c.interviewDetails !== undefined && c.status !== 'Joined' && c.status !== 'Offer Issued')
      ).length
    );
  }, 0);

  const totalShortlistedCandidates = allSanctioned.reduce((sum, req) => {
    return (
      sum +
      (req.candidates || []).filter(
        (c) => c.status === 'Selected' || c.status === 'Offer Issued' || c.status === 'Joined'
      ).length
    );
  }, 0);

  // Helper to format scores cleanly (e.g., 95 -> 9.5, 89 -> 8.9)
  const formatScore = (rawScore: number | undefined): string => {
    if (!rawScore) return '0.0';
    const num = Number(rawScore);
    if (num > 10) return (num / 10).toFixed(1);
    return num.toFixed(1);
  };

  // Accordion Expand/Collapse Helpers (Clean & Collapsed by default to avoid visual clutter)
  const isPostedExpanded = (reqId: string) => !!expandedPostedReqs[reqId];
  const isInterviewExpanded = (reqId: string) => !!expandedInterviewReqs[reqId];
  const isOfferExpanded = (reqId: string) => !!expandedOfferReqs[reqId];

  const togglePostedExpand = (reqId: string) => {
    setExpandedPostedReqs((prev) => ({
      ...prev,
      [reqId]: !prev[reqId]
    }));
  };

  const toggleInterviewExpand = (reqId: string) => {
    setExpandedInterviewReqs((prev) => ({
      ...prev,
      [reqId]: !prev[reqId]
    }));
  };

  const toggleOfferExpand = (reqId: string) => {
    setExpandedOfferReqs((prev) => ({
      ...prev,
      [reqId]: !prev[reqId]
    }));
  };

  const toggleAllPosted = (expand: boolean) => {
    const updated: Record<string, boolean> = {};
    activePostedJobs.forEach((r) => {
      updated[r.requestId] = expand;
    });
    setExpandedPostedReqs(updated);
  };

  const toggleAllInterview = (expand: boolean) => {
    const updated: Record<string, boolean> = {};
    interviewJobs.forEach((r) => {
      updated[r.requestId] = expand;
    });
    setExpandedInterviewReqs(updated);
  };

  const toggleAllOffer = (expand: boolean) => {
    const updated: Record<string, boolean> = {};
    shortlistedJobs.forEach((r) => {
      updated[r.requestId] = expand;
    });
    setExpandedOfferReqs(updated);
  };

  // Helper to open Detailed Offer Modal
  const openOfferModal = (req: IHiringRequest, cand: Candidate) => {
    setOfferReq(req);
    setOfferCand(cand);
    setOfferLetterRef(
      cand.joiningDetails?.offerLetterRef ||
      `GKU/EST/OFFER/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`
    );
    setOfferedCtc(cand.joiningDetails?.offeredCtc || req.tentativeBudget);
    setBasicSalary(cand.joiningDetails?.basicSalary || '₹57,700/mo (7th CPC Level 10)');
    setAcademicLevel(cand.joiningDetails?.academicLevel || req.postLevel || 'Academic Level 10');
    setProbationPeriod(cand.joiningDetails?.probationPeriod || '1 Year');
    setJoiningDeadline(cand.joiningDetails?.joiningDeadline || '2026-12-31');
    setOfferRemarks(
      cand.joiningDetails?.offerRemarks ||
      'Appointment subject to UGC/AICTE minimum qualifications verification and relieving order submission.'
    );
    setOfferLetterFile(
      cand.joiningDetails?.offerLetterFile ||
      `Appointment_Offer_${cand.fullName.replace(/\s+/g, '_')}.pdf`
    );
  };

  // TAB 5: Pending Governance Pipeline (Watchlist of Stage 1-3 pending clearances)
  const pendingPipeline = requests.filter(
    (r) =>
      r.status !== 'Rejected' &&
      (r.currentStage < 4 ||
        r.status === 'Request Submitted (Department)' ||
        r.status === 'Under Review (Dean Academic)' ||
        r.status === 'Approved by Dean Academic' ||
        r.status === 'Under Review (VC / Registrar)' ||
        r.status === 'Returned for Clarification') &&
      !allSanctioned.some((a) => a.requestId === r.requestId)
  );

  // Filter lists by search
  const filterBySearch = (items: IHiringRequest[]) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (r) =>
        r.requestId.toLowerCase().includes(q) ||
        r.postTitle.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q)
    );
  };

  const isReqClosedOrFulfilled = (req: IHiringRequest) => {
    return (
      req.status === 'Position Fulfilled (Recruitment Completed)' ||
      req.status === 'Joined & Request Closed' ||
      req.status === 'Applications Closed (Intake Stopped)' ||
      req.status === 'Hiring On Hold'
    );
  };

  const activeIntakeJobsCount = activePostedJobs.filter((r) => !isReqClosedOrFulfilled(r)).length;
  const closedOrFulfilledCount = activePostedJobs.filter((r) => isReqClosedOrFulfilled(r)).length;

  const filteredPostedJobs = activePostedJobs.filter((r) => {
    if (postedIntakeFilter === 'active') return !isReqClosedOrFulfilled(r);
    if (postedIntakeFilter === 'closed') return isReqClosedOrFulfilled(r);
    return true;
  });

  const displayedApproved = filterBySearch(approvedForPosting);
  const displayedPosted = filterBySearch(filteredPostedJobs);

  const displayedArchivedJobs = archivedReqs.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchReq =
      r.requestId.toLowerCase().includes(q) ||
      r.postTitle.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q);
    const matchCand = (r.candidates || []).some(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.qualification.toLowerCase().includes(q)
    );
    return matchReq || matchCand;
  });

  // Group archived jobs by department folders
  const archivedByDepartment = displayedArchivedJobs.reduce<Record<string, IHiringRequest[]>>((acc, req) => {
    if (!acc[req.department]) acc[req.department] = [];
    acc[req.department].push(req);
    return acc;
  }, {});

  const toggleFolder = (dept: string) => {
    setOpenedFolders((prev) => ({
      ...prev,
      [dept]: !prev[dept]
    }));
  };

  const displayedInterviewJobs = interviewJobs.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchReq =
      r.requestId.toLowerCase().includes(q) ||
      r.postTitle.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q);
    const matchCand = (r.candidates || []).some(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.qualification.toLowerCase().includes(q)
    );
    return matchReq || matchCand;
  });

  const displayedShortlistedJobs = shortlistedJobs.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchReq =
      r.requestId.toLowerCase().includes(q) ||
      r.postTitle.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q);
    const matchCand = (r.candidates || []).some(
      (c) =>
        (c.status === 'Selected' || c.status === 'Offer Issued' || c.status === 'Joined') &&
        (c.fullName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.joiningDetails?.employeeId?.toLowerCase().includes(q) ||
          c.joiningDetails?.offerLetterRef?.toLowerCase().includes(q))
    );
    return matchReq || matchCand;
  });

  const displayedPending = filterBySearch(pendingPipeline);

  // --- ACTIONS ---

  // 1. Post Job
  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postingReq) return;
    if (selectedPlatforms.length === 0) {
      setErrorMsg('Please select at least one advertising platform/channel.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    setStatusMsg('');

    try {
      const res = await fetch(`/api/hr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'post_job',
          requestId: postingReq.requestId,
          channelNames: selectedPlatforms,
          cost: Number(adSpendBudget) || 0,
          urlOrRef: postingRemarks.trim(),
          expiryDate: adExpiry,
          actorName: 'HR Media & Advertising Cell'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record job posting');
      }

      setStatusMsg(
        `✓ ${postingReq.postTitle} published on ${selectedPlatforms.length} platform(s): ${selectedPlatforms.join(', ')}. Moved to "Active Posted Jobs".`
      );
      setPostingReq(null);
      setPostingRemarks('');
      setAdSpendBudget('');
      onRefresh();
      setActiveTab('posted');
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Upload Candidate Resume
  const handleUploadResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeReq) return;
    if (!candName.trim() || !candEmail.trim()) {
      setErrorMsg('Candidate Full Name and Email Address are required.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    setStatusMsg('');

    try {
      const res = await fetch(`/api/hr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upload_resume',
          requestId: resumeReq.requestId,
          fullName: candName.trim(),
          email: candEmail.trim(),
          phone: candPhone.trim(),
          qualification: candQual.trim() || 'Postgraduate / Ph.D.',
          experienceYears: Number(candExp) || 0,
          currentAffiliation: candAffiliation.trim(),
          resumeFileName: resumeFileName.trim() || (candName.trim() ? `${candName.trim().replace(/\s+/g, '_')}_CV.pdf` : 'Candidate_CV.pdf'),
          actorName: 'HR Talent Acquisition Desk'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload candidate resume');
      }

      setStatusMsg(`✓ Applicant ${candName} registered and CV added to talent pool for ${resumeReq.postTitle}.`);
      setResumeReq(null);
      setCandName('');
      setCandEmail('');
      setCandPhone('');
      setCandQual('');
      setCandAffiliation('');
      setResumeFile(null);
      setResumeFileName('');
      onRefresh();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Schedule Interview
  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingReq || !schedulingCand) return;
    if (panelMembersList.length === 0) {
      setErrorMsg('Please add at least one panel member / interviewer.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    setStatusMsg('');

    try {
      const res = await fetch(`/api/hr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'schedule_interview',
          requestId: schedulingReq.requestId,
          candidateId: schedulingCand.id,
          interviewerNames: panelMembersList,
          date: interviewDate,
          time: interviewTime,
          venue: interviewVenue,
          actorName: 'HR Selection Panel Coordinator'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to schedule interview');
      }

      setStatusMsg(
        `✓ Interview scheduled for ${schedulingCand.fullName} on ${interviewDate} at ${interviewTime} with ${panelMembersList.length} panelist(s). Moved to "Scheduled Interviews".`
      );
      setSchedulingReq(null);
      setSchedulingCand(null);
      setViewApplicantsReq(null);
      onRefresh();
      setActiveTab('interviews');
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3.2 Record Interview Completion & Score (Out of 10)
  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingReq || !evaluatingCand) return;
    setIsSubmitting(true);
    setErrorMsg('');
    setStatusMsg('');

    const validRatings = evaluatorEntries
      .map((e) => Number(e.rating))
      .filter((r) => !isNaN(r) && r >= 0);
    const avgScore = validRatings.length > 0
      ? Number((validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length).toFixed(1))
      : 0;

    try {
      const res = await fetch(`/api/hr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate_interview',
          requestId: evaluatingReq.requestId,
          candidateId: evaluatingCand.id,
          scores: {
            subjectKnowledge: avgScore,
            researchPublications: avgScore,
            teachingAptitude: avgScore,
            communication: avgScore,
            totalScore: avgScore
          },
          evaluatorRatings: evaluatorEntries.map((ev) => ({
            evaluatorName: ev.name.trim() || 'Panel Member',
            rating: Number(ev.rating) || 0
          })),
          ratingScorecardFile: scorecardFileName.trim() || undefined,
          panelRemarks: evalRemarks.trim() || `Interview evaluated with an overall score of ${avgScore}/10 across ${evaluatorEntries.length} panel member(s).`,
          recommendation: evalRecommendation,
          actorName: 'HR Selection Committee'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record interview evaluation');
      }

      if (evalDecision === 'shortlist') {
        await fetch(`/api/hr`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'shortlist_candidate',
            requestId: evaluatingReq.requestId,
            candidateId: evaluatingCand.id,
            actorName: 'HR Selection Committee',
            remarks: `Interview evaluated (${avgScore}/10 - ${evalRecommendation}) and candidate shortlisted for appointment.`
          })
        });
        setStatusMsg(
          `✓ ${evaluatingCand.fullName} evaluated (${avgScore}/10) and Shortlisted! Go to Tab 4 ("Shortlisted & Offer Letters") to issue the detailed offer letter.`
        );
      } else if (evalDecision === 'reject') {
        await fetch(`/api/hr`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reject_candidate',
            requestId: evaluatingReq.requestId,
            candidateId: evaluatingCand.id,
            actorName: 'HR Selection Committee',
            reason: `Interview evaluated (${avgScore}/10 - ${evalRecommendation}) and marked as Rejected.`
          })
        });
        setStatusMsg(`✓ Interview evaluated and candidate ${evaluatingCand.fullName} marked as Rejected.`);
      } else {
        setStatusMsg(
          `✓ Interview evaluated for ${evaluatingCand.fullName} with aggregate score ${avgScore}/10 (${evalRecommendation}). You can now click "Shortlist" or "Reject".`
        );
      }

      setEvaluatingReq(null);
      setEvaluatingCand(null);
      setEvalRemarks('');
      setScorecardFileName('');
      setScorecardFileSize('');
      setEvalDecision('interviewed');
      onRefresh();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3.3 Explicitly Shortlist Candidate
  const handleShortlistCandidate = async (req: IHiringRequest, cand: Candidate) => {
    setIsSubmitting(true);
    setErrorMsg('');
    setStatusMsg('');
    try {
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'shortlist_candidate',
          requestId: req.requestId,
          candidateId: cand.id,
          actorName: 'HR Selection Committee'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to shortlist candidate');
      }
      setStatusMsg(
        `✓ ${cand.fullName} has been Shortlisted! You can now issue the formal Offer Letter in Tab 4 ("Shortlisted & Offer Letters").`
      );
      onRefresh();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3.4 Explicitly Reject Candidate
  const handleRejectCandidate = async (req: IHiringRequest, cand: Candidate) => {
    setIsSubmitting(true);
    setErrorMsg('');
    setStatusMsg('');
    try {
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject_candidate',
          requestId: req.requestId,
          candidateId: cand.id,
          actorName: 'HR Selection Committee'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reject candidate');
      }
      setStatusMsg(`Candidate ${cand.fullName} has been marked as Rejected.`);
      onRefresh();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Issue Official Formal Offer Letter
  const handleIssueOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerReq || !offerCand) return;
    setIsSubmitting(true);
    setErrorMsg('');
    setStatusMsg('');

    try {
      const generatedRef = offerLetterRef.trim() || `GKU/EST/OFFER/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
      const res = await fetch(`/api/hr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'issue_offer',
          requestId: offerReq.requestId,
          candidateId: offerCand.id,
          offerLetterRef: generatedRef,
          offeredCtc: offeredCtc.trim() || offerReq.tentativeBudget,
          basicSalary: basicSalary.trim(),
          academicLevel: academicLevel.trim(),
          probationPeriod: probationPeriod.trim(),
          joiningDeadline,
          offerRemarks: offerRemarks.trim(),
          offerLetterFile,
          actorName: 'HR Selection Directorate'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to issue offer letter');
      }

      setStatusMsg(
        `✓ Official Formal University Offer Letter (${generatedRef}) released to ${offerCand.fullName} for ${offerReq.postTitle}. Moved to "Offer Letters & Joining".`
      );
      setOfferReq(null);
      setOfferCand(null);
      onRefresh();
      setActiveTab('offerLetters');
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4.5. Pre-Joining Document Verification Audit
  const handleVerifyDocs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docVerifyReq || !docVerifyCand) return;
    setIsSubmitting(true);
    setErrorMsg('');
    setStatusMsg('');

    try {
      const res = await fetch(`/api/hr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_documents',
          requestId: docVerifyReq.requestId,
          candidateId: docVerifyCand.id,
          documentVerification: {
            identityProof: docIdentityProof,
            degreesVerified: docDegreesVerified,
            experienceCertificates: docExperienceCertificates,
            policeVerification: docPoliceVerification,
            medicalFitness: docMedicalFitness,
            nocRelieving: docNocRelieving,
            verificationRemarks: docRemarks.trim()
          },
          verificationRemarks: docRemarks.trim(),
          actorName: 'HR Verification Officer'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record document verification');
      }

      setStatusMsg(
        `✓ Pre-joining document verification audit recorded for ${docVerifyCand.fullName}!`
      );
      setDocVerifyReq(null);
      setDocVerifyCand(null);
      onRefresh();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Complete Onboarding / Mark Joined & Formal Induction
  const handleMarkJoined = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardReq || !onboardCand) return;
    setIsSubmitting(true);
    setErrorMsg('');
    setStatusMsg('');

    try {
      const assignedEmpId = employeeId.trim() || `GKU-FAC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const res = await fetch(`/api/hr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'onboard_candidate',
          requestId: onboardReq.requestId,
          candidateId: onboardCand.id,
          employeeId: assignedEmpId,
          officialEmail: officialEmail.trim() || `${onboardCand.fullName.toLowerCase().replace(/[^a-z]/g, '')}@gku.ac.in`,
          reportingHead: reportingHead.trim() || `Dean, ${onboardReq.department}`,
          joiningDate,
          inductionChecklist: {
            idCardIssued: chkIdCard,
            itAccountCreated: chkItAccount,
            workloadAssigned: chkWorkload,
            bankAccountOpened: chkBankAccount
          },
          joiningRemarks: joiningRemarks.trim(),
          actorName: 'HR Onboarding Office'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete onboarding');
      }

      setStatusMsg(
        `✓ ${onboardCand.fullName} successfully joined and inducted with Permanent Employee ID: ${assignedEmpId}!`
      );
      setOnboardReq(null);
      setOnboardCand(null);
      setEmployeeId('');
      onRefresh();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Update Recruitment / Intake Status (Fulfill, Close Intake, Put on Hold, Reopen)
  const handleUpdateRecruitmentStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageStatusReq) return;
    setIsSubmitting(true);
    setErrorMsg('');
    setStatusMsg('');

    try {
      const res = await fetch(`/api/hr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_recruitment_status',
          requestId: manageStatusReq.requestId,
          newStatus: statusUpdateChoice,
          closureReason: statusUpdateReason.trim(),
          actorName: 'HR Selection Directorate'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update recruitment status');
      }

      setStatusMsg(
        `✓ Recruitment status for ${manageStatusReq.postTitle} (${manageStatusReq.requestId}) successfully updated to "${statusUpdateChoice}"!`
      );
      setManageStatusReq(null);
      setStatusUpdateReason('');
      onRefresh();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dedicated Full-Page University Offer Letter & Appointment Workbench
  if (offerReq && offerCand) {
    return (
      <OfferLetterWorkbench
        request={offerReq}
        candidate={offerCand}
        onBack={() => {
          setOfferReq(null);
          setOfferCand(null);
        }}
        onComplete={() => {
          setOfferReq(null);
          setOfferCand(null);
          setStatusMsg(
            `✓ Official University Appointment Offer letter successfully released to ${offerCand.fullName}! Candidate moved to Shortlisted & Offers stage.`
          );
          onRefresh();
          setActiveTab('offerLetters');
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Stats Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-800">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              HR Talent Acquisition & Recruitment Pipeline
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Execute stage-by-stage recruitment: Post to media &rarr; Intake resumes &rarr; Coordinate interviews & Score &rarr; Issue offers & onboarding.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-blue-950">
            Approved: <strong>{approvedForPosting.length}</strong>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl text-indigo-950">
            Active Posted: <strong>{activePostedJobs.length}</strong>
          </div>
          <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-amber-950">
            Interviews: <strong>{totalInterviewCandidates}</strong>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-emerald-950">
            Shortlisted &amp; Offers: <strong>{totalShortlistedCandidates}</strong>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveTab('archive');
              setSearchQuery('');
            }}
            className="bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-xl text-purple-950 font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            title="Open Recruitment Archive & Records Cabinet"
          >
            <FolderCheck className="w-3.5 h-3.5 text-purple-700" />
            <span>Archive Cabinet: <strong>{archivedReqs.length}</strong></span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {statusMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg('')} className="text-emerald-600 font-bold hover:text-emerald-800">
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-600 font-bold hover:text-rose-800">
            ✕
          </button>
        </div>
      )}

      {/* 5 Distinct Pipeline Tabs */}
      <div className="flex flex-wrap items-center border-b border-slate-200 text-xs font-bold gap-1 sm:gap-2">
        <button
          onClick={() => {
            setActiveTab('approved');
            setSearchQuery('');
          }}
          className={`py-3.5 px-4 border-b-2 transition flex items-center space-x-2 ${activeTab === 'approved'
            ? 'border-blue-600 text-blue-900 font-extrabold'
            : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <CheckCircle2 className={`w-4 h-4 ${activeTab === 'approved' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span>1. Approved for Posting ({approvedForPosting.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('posted');
            setSearchQuery('');
          }}
          className={`py-3.5 px-4 border-b-2 transition flex items-center space-x-2 ${activeTab === 'posted'
            ? 'border-indigo-600 text-indigo-900 font-extrabold'
            : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <Megaphone className={`w-4 h-4 ${activeTab === 'posted' ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span>2. Active Posted Jobs ({activePostedJobs.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('interviews');
            setSearchQuery('');
          }}
          className={`py-3.5 px-4 border-b-2 transition flex items-center space-x-2 ${activeTab === 'interviews'
            ? 'border-amber-600 text-amber-900 font-extrabold'
            : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <Calendar className={`w-4 h-4 ${activeTab === 'interviews' ? 'text-amber-600' : 'text-slate-400'}`} />
          <span>3. Scheduled Interviews ({totalInterviewCandidates})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('offerLetters');
            setSearchQuery('');
          }}
          className={`py-3.5 px-4 border-b-2 transition flex items-center space-x-2 ${activeTab === 'offerLetters'
            ? 'border-emerald-600 text-emerald-900 font-extrabold'
            : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <Award className={`w-4 h-4 ${activeTab === 'offerLetters' ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span>4. Shortlisted & Offer Letters ({totalShortlistedCandidates})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('pipeline');
            setSearchQuery('');
          }}
          className={`py-3.5 px-4 border-b-2 transition flex items-center space-x-2 ${activeTab === 'pipeline'
            ? 'border-slate-600 text-slate-900 font-extrabold'
            : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <Clock className={`w-4 h-4 ${activeTab === 'pipeline' ? 'text-slate-600' : 'text-slate-400'}`} />
          <span>5. Governance Pipeline ({pendingPipeline.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('archive');
            setSearchQuery('');
          }}
          className={`py-3.5 px-4 border-b-2 transition flex items-center space-x-2 ${activeTab === 'archive'
            ? 'border-purple-600 text-purple-900 font-extrabold'
            : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          <FolderCheck className={`w-4 h-4 ${activeTab === 'archive' ? 'text-purple-600' : 'text-slate-400'}`} />
          <span>6. Archives Cabinet ({archivedReqs.length})</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: APPROVED FOR HIRING (AWAITING MEDIA POSTING) */}
      {/* ============================================================== */}
      {activeTab === 'approved' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search approved jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
            <span className="text-[11px] text-blue-900 font-semibold bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              Full clearance verified (Dean Academic & VC Sanctioned) &bull; Ready for Media Ad Posting
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Requisition ID</th>
                  <th className="py-3.5 px-6">Department & Post Title</th>
                  <th className="py-3.5 px-6">Positions & Budget</th>
                  <th className="py-3.5 px-6">Governance Clearances</th>
                  <th className="py-3.5 px-6">Media Ad Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedApproved.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No approved jobs currently awaiting posting. Once VC sanctions a requisition, it appears here to post.
                    </td>
                  </tr>
                ) : (
                  displayedApproved.map((req) => (
                    <tr key={req.requestId} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6 font-mono font-bold text-blue-900">
                        {req.requestId}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-sm">{req.postTitle}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          {req.department} • {req.employmentType} ({req.postLevel})
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-800">{req.numberOfPositions} Position(s)</div>
                        <div className="text-slate-500 text-[11px]">{req.tentativeBudget}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-1.5 text-emerald-700 font-semibold text-[11px]">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Sanctioned by VC & Academic</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          Awaiting Media Posting
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => {
                            setPostingReq(req);
                            setSelectedPlatforms(['LinkedIn Jobs', 'Naukri.com', 'University Careers Website']);
                            setPostingRemarks('');
                          }}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs transition"
                        >
                          <Megaphone className="w-3.5 h-3.5" />
                          <span>Post Job to Media &rarr;</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: ACTIVE POSTED JOBS (CATEGORIZED ACCORDION BY REQUISITION) */}
      {/* ============================================================== */}
      {activeTab === 'posted' && (
        <div className="space-y-3">
          {/* Controls Bar with Intake Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search posted jobs, departments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPostedIntakeFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${postedIntakeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  All ({activePostedJobs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPostedIntakeFilter('active')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${postedIntakeFilter === 'active'
                    ? 'bg-white text-indigo-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Active Intake ({activeIntakeJobsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setPostedIntakeFilter('closed')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${postedIntakeFilter === 'closed'
                    ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  Closed / Fulfilled ({closedOrFulfilledCount})
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => toggleAllPosted(true)}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={() => toggleAllPosted(false)}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Archive Notice Banner */}
          {archivedReqs.length > 0 && (
            <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 min-w-0">
                <FolderCheck className="w-4 h-4 text-purple-700 shrink-0" />
                <span className="text-purple-950 font-medium truncate">
                  <strong>{archivedReqs.length} closed/fulfilled vacancies</strong> moved to the separate Archives Cabinet to keep this workspace uncluttered.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('archive');
                  setSearchQuery('');
                }}
                className="text-purple-800 hover:text-purple-950 font-bold underline cursor-pointer shrink-0 ml-2"
              >
                Open Cabinet &rarr;
              </button>
            </div>
          )}

          {displayedPosted.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400 shadow-2xs">
              <Megaphone className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <div className="font-semibold text-slate-700 text-sm">No Active Posted Jobs Found</div>
              <p className="text-slate-400 text-xs mt-0.5">
                Post an approved requisition in Tab 1 to start receiving candidates.
              </p>
            </div>
          ) : (
            displayedPosted.map((req) => {
              const candidates = req.candidates || [];
              const candCount = candidates.length;
              const isExpanded = isPostedExpanded(req.requestId);

              return (
                <div
                  key={req.requestId}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-2xs overflow-hidden transition"
                >
                  {/* Clean Clickable Requisition Header */}
                  <div
                    onClick={() => togglePostedExpand(req.requestId)}
                    className="p-3.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition select-none"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="text-slate-400 hover:text-slate-600">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-indigo-600" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                            {req.requestId}
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm truncate">{req.postTitle}</h3>
                          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                            • {req.department}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5 flex items-center space-x-2">
                          <span>{req.numberOfPositions} Position(s)</span>
                          <span>•</span>
                          <span>{req.tentativeBudget}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Status Badges */}
                      {req.status === 'Position Fulfilled (Recruitment Completed)' || req.status === 'Joined & Request Closed' ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Fulfilled ✓</span>
                        </span>
                      ) : req.status === 'Applications Closed (Intake Stopped)' ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 flex items-center space-x-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>Intake Closed</span>
                        </span>
                      ) : req.status === 'Hiring On Hold' ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center space-x-1">
                          <span>⏸ On Hold</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Active Intake</span>
                        </span>
                      )}

                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${candCount > 0
                          ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                          : 'bg-slate-100 text-slate-500'
                          }`}
                      >
                        {candCount} {candCount === 1 ? 'Applicant' : 'Applicants'}
                      </span>

                      {/* Manage Status Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setManageStatusReq(req);
                          setStatusUpdateChoice(
                            req.status === 'Position Fulfilled (Recruitment Completed)' ||
                              req.status === 'Applications Closed (Intake Stopped)' ||
                              req.status === 'Hiring On Hold'
                              ? req.status
                              : 'Position Fulfilled (Recruitment Completed)'
                          );
                          setStatusUpdateReason('');
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition flex items-center space-x-1 cursor-pointer shadow-2xs"
                        title="Close intake, mark fulfilled, or place on hold"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                        <span>Manage Status</span>
                      </button>

                      {/* Add Resume Button (Only if Intake Active) */}
                      {!isReqClosedOrFulfilled(req) ? (
                        <button
                          type="button"
                          onClick={() => {
                            setResumeReq(req);
                            setCandName('');
                            setCandEmail('');
                            setCandPhone('');
                            setCandQual('');
                            setCandAffiliation('');
                          }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>+ Add Resume</span>
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-400 rounded-lg text-xs font-medium border border-slate-200 cursor-not-allowed">
                          Intake Stopped
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Candidates Roster */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-3 space-y-2">
                      {candidates.length === 0 ? (
                        <div className="py-5 text-center text-slate-400 bg-white rounded-lg border border-slate-200 text-xs">
                          No applicants added yet. Click &ldquo;+ Add Resume&rdquo; above to register candidates.
                        </div>
                      ) : (
                        candidates.map((cand) => {
                          const isEvaluated = cand.status === 'Interviewed' || (cand.interviewDetails?.scores?.totalScore && cand.interviewDetails.scores.totalScore > 0);
                          const scoreFormatted = formatScore(cand.interviewDetails?.scores?.totalScore);

                          return (
                            <div
                              key={cand.id}
                              className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 hover:border-slate-300 transition"
                            >
                              {/* Candidate Info */}
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-bold text-slate-900 text-sm">{cand.fullName}</h4>
                                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                    {cand.qualification}
                                  </span>
                                  {cand.experienceYears > 0 && (
                                    <span className="text-[11px] text-slate-500">
                                      • {cand.experienceYears} Yrs Exp
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                                  <span>{cand.email}</span>
                                  <span>•</span>
                                  <span>{cand.phone}</span>
                                  {cand.currentAffiliation && (
                                    <>
                                      <span>•</span>
                                      <span className="text-slate-400">{cand.currentAffiliation}</span>
                                    </>
                                  )}
                                </div>
                                {cand.interviewDetails?.date && (
                                  <div className="text-[11px] text-slate-600 flex items-center space-x-1.5 pt-0.5">
                                    <span className="font-semibold text-amber-900">🗓️ {cand.interviewDetails.date}</span>
                                    {cand.interviewDetails.panelMembers && (
                                      <span className="text-slate-400">({cand.interviewDetails.panelMembers.slice(0, 2).join(', ')})</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Status & Action */}
                              <div className="flex items-center space-x-2 shrink-0">
                                {isEvaluated ? (
                                  <>
                                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                      <span>Score: {scoreFormatted}/10</span>
                                    </span>
                                    {cand.interviewDetails?.scorecardFile && (
                                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200" title={`Uploaded Scorecard: ${cand.interviewDetails.scorecardFile}`}>
                                        <FileText className="w-3 h-3 text-emerald-600" />
                                        <span className="truncate max-w-[100px]">{cand.interviewDetails.scorecardFile}</span>
                                      </span>
                                    )}
                                  </>
                                ) : cand.status === 'Interview Scheduled' ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                                    Scheduled
                                  </span>
                                ) : cand.status === 'Selected' ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    ✓ Shortlisted
                                  </span>
                                ) : cand.status === 'Joined' ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                    ✓ Joined
                                  </span>
                                ) : cand.status === 'Offer Issued' ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                                    Offer Issued
                                  </span>
                                ) : cand.status === 'Rejected' ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                    Rejected
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                    Applied
                                  </span>
                                )}

                                {/* Action Buttons */}
                                {cand.status === 'Applied' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSchedulingReq(req);
                                      setSchedulingCand(cand);
                                      setInterviewDate('2026-12-10');
                                      setInterviewTime('11:00 AM');
                                      setPanelMembersList(['Prof. Balwant Singh (Dean Academic)', 'Subject Expert Nominee']);
                                    }}
                                    className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                                  >
                                    Schedule Interview &rarr;
                                  </button>
                                )}

                                {cand.status === 'Interview Scheduled' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEvaluatingReq(req);
                                      setEvaluatingCand(cand);
                                      const existingPanel = cand.interviewDetails?.evaluatorRatings && cand.interviewDetails.evaluatorRatings.length > 0
                                        ? cand.interviewDetails.evaluatorRatings.map((ev, idx) => ({ id: `ev-${idx}`, name: ev.evaluatorName, rating: ev.rating }))
                                        : cand.interviewDetails?.panelMembers && cand.interviewDetails.panelMembers.length > 0
                                        ? cand.interviewDetails.panelMembers.map((name, idx) => ({ id: `ev-${idx}`, name, rating: 8.0 }))
                                        : [
                                            { id: 'ev-1', name: 'Dr. Harpreet Singh (Dean)', rating: 8.0 },
                                            { id: 'ev-2', name: 'Prof. Balwant Singh (Dean Academic)', rating: 8.0 },
                                            { id: 'ev-3', name: 'Subject Expert Nominee', rating: 8.0 }
                                          ];
                                      setEvaluatorEntries(existingPanel);
                                      setScorecardFileName(cand.interviewDetails?.scorecardFile || '');
                                      setScorecardFileSize('');
                                      setEvalRecommendation(cand.interviewDetails?.recommendation || 'Recommend');
                                      setEvalRemarks(cand.interviewDetails?.panelRemarks || '');
                                      setEvalDecision('interviewed');
                                    }}
                                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                                  >
                                    Score Candidate &rarr;
                                  </button>
                                )}

                                {cand.status === 'Interviewed' && (
                                  <div className="flex items-center space-x-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleShortlistCandidate(req, cand)}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                                    >
                                      ✓ Shortlist
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRejectCandidate(req, cand)}
                                      className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                                    >
                                      ✕ Reject
                                    </button>
                                  </div>
                                )}

                                {cand.status === 'Selected' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      openOfferModal(req, cand);
                                      setActiveTab('offerLetters');
                                    }}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                                  >
                                    Issue Offer &rarr;
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: SCHEDULED INTERVIEWS (CATEGORIZED ACCORDION BY REQUISITION) */}
      {/* ============================================================== */}
      {activeTab === 'interviews' && (
        <div className="space-y-3">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidates, panelists, posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => toggleAllInterview(true)}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={() => toggleAllInterview(false)}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          {displayedInterviewJobs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400 shadow-2xs">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <div className="font-semibold text-slate-700 text-sm">No Scheduled Interviews Found</div>
              <p className="text-slate-400 text-xs mt-0.5">
                Schedule interviews for applicants in Tab 2 to evaluate them here.
              </p>
            </div>
          ) : (
            displayedInterviewJobs.map((req) => {
              const interviewCands = (req.candidates || []).filter(
                (c) =>
                  c.status === 'Interview Scheduled' ||
                  c.status === 'Interviewed' ||
                  c.status === 'Selected' ||
                  (c.interviewDetails !== undefined && c.status !== 'Joined' && c.status !== 'Offer Issued')
              );
              const isExpanded = isInterviewExpanded(req.requestId);

              return (
                <div
                  key={req.requestId}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-2xs overflow-hidden transition"
                >
                  {/* Clean Clickable Header */}
                  <div
                    onClick={() => toggleInterviewExpand(req.requestId)}
                    className="p-3.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition select-none"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="text-slate-400 hover:text-slate-600">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-amber-600" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            {req.requestId}
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm truncate">{req.postTitle}</h3>
                          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                            • {req.department}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          {req.numberOfPositions} Position(s) • Budget: {req.tentativeBudget}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                        {interviewCands.length} in Interview Stage
                      </span>
                    </div>
                  </div>

                  {/* Expanded Interview Candidates Roster */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-3 space-y-2">
                      {interviewCands.map((candidate) => {
                        const isEvaluated = candidate.status === 'Interviewed' || (candidate.interviewDetails?.scores?.totalScore && candidate.interviewDetails.scores.totalScore > 0);
                        const scoreFormatted = formatScore(candidate.interviewDetails?.scores?.totalScore);

                        return (
                          <div
                            key={candidate.id}
                            className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 hover:border-slate-300 transition"
                          >
                            {/* Candidate & Interview Details */}
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-bold text-slate-900 text-sm">{candidate.fullName}</h4>
                                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                  {candidate.qualification}
                                </span>
                                {candidate.experienceYears > 0 && (
                                  <span className="text-[11px] text-slate-500">
                                    • {candidate.experienceYears} Yrs Exp
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                                <span>{candidate.email}</span>
                                <span>•</span>
                                <span>{candidate.phone}</span>
                              </div>
                              <div className="text-[11px] text-slate-600 flex items-center space-x-2 pt-0.5">
                                <span className="font-semibold text-amber-900">🗓️ {candidate.interviewDetails?.date || 'Scheduled'}</span>
                                {candidate.interviewDetails?.panelMembers && (
                                  <span className="text-slate-400">
                                    • Panel: {candidate.interviewDetails.panelMembers.join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Score & Selection Actions */}
                            <div className="flex items-center space-x-2 shrink-0">
                              {isEvaluated ? (
                                <>
                                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                    <span>Score: {scoreFormatted}/10</span>
                                  </span>
                                  {candidate.interviewDetails?.scorecardFile && (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200" title={`Uploaded Scorecard: ${candidate.interviewDetails.scorecardFile}`}>
                                      <FileText className="w-3 h-3 text-emerald-600" />
                                      <span className="truncate max-w-[100px]">{candidate.interviewDetails.scorecardFile}</span>
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                                  Awaiting Score
                                </span>
                              )}

                              {!isEvaluated ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEvaluatingReq(req);
                                    setEvaluatingCand(candidate);
                                    const existingPanel = candidate.interviewDetails?.evaluatorRatings && candidate.interviewDetails.evaluatorRatings.length > 0
                                      ? candidate.interviewDetails.evaluatorRatings.map((ev, idx) => ({ id: `ev-${idx}`, name: ev.evaluatorName, rating: ev.rating }))
                                      : candidate.interviewDetails?.panelMembers && candidate.interviewDetails.panelMembers.length > 0
                                      ? candidate.interviewDetails.panelMembers.map((name, idx) => ({ id: `ev-${idx}`, name, rating: 8.0 }))
                                      : [
                                          { id: 'ev-1', name: 'Dr. Harpreet Singh (Dean)', rating: 8.0 },
                                          { id: 'ev-2', name: 'Prof. Balwant Singh (Dean Academic)', rating: 8.0 },
                                          { id: 'ev-3', name: 'Subject Expert Nominee', rating: 8.0 }
                                        ];
                                    setEvaluatorEntries(existingPanel);
                                    setScorecardFileName(candidate.interviewDetails?.scorecardFile || '');
                                    setScorecardFileSize('');
                                    setEvalRecommendation(candidate.interviewDetails?.recommendation || 'Recommend');
                                    setEvalRemarks(candidate.interviewDetails?.panelRemarks || '');
                                    setEvalDecision('interviewed');
                                  }}
                                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                                >
                                  Score Candidate &rarr;
                                </button>
                              ) : candidate.status === 'Interviewed' ? (
                                <div className="flex items-center space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleShortlistCandidate(req, candidate)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                  >
                                    ✓ Shortlist Candidate
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectCandidate(req, candidate)}
                                    className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                                  >
                                    ✕ Reject
                                  </button>
                                </div>
                              ) : candidate.status === 'Selected' ? (
                                <div className="flex items-center space-x-2">
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    ✓ Shortlisted
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveTab('offerLetters');
                                      openOfferModal(req, candidate);
                                    }}
                                    className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
                                  >
                                    Issue Offer in Tab 4 &rarr;
                                  </button>
                                </div>
                              ) : candidate.status === 'Rejected' ? (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                  Rejected
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                  ✓ {candidate.status}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: SHORTLISTED CANDIDATES & FORMAL OFFER LETTERS DESK */}
      {/* ============================================================== */}
      {activeTab === 'offerLetters' && (
        <div className="space-y-3">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search shortlisted candidates, offer refs, employee codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => toggleAllOffer(true)}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={() => toggleAllOffer(false)}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          {displayedShortlistedJobs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400 shadow-2xs">
              <GraduationCap className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <div className="font-semibold text-slate-700 text-sm">No Shortlisted Candidates Found</div>
              <p className="text-slate-400 text-xs mt-0.5">
                Score candidate interviews in Tab 3 and click &ldquo;Shortlist Candidate&rdquo; to release detailed offer letters here.
              </p>
            </div>
          ) : (
            displayedShortlistedJobs.map((req) => {
              const shortlistedCands = (req.candidates || []).filter(
                (c) => c.status === 'Selected' || c.status === 'Offer Issued' || c.status === 'Joined'
              );
              const isExpanded = isOfferExpanded(req.requestId);

              return (
                <div
                  key={req.requestId}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-2xs overflow-hidden transition"
                >
                  {/* Clean Clickable Header */}
                  <div
                    onClick={() => toggleOfferExpand(req.requestId)}
                    className="p-3.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition select-none"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="text-slate-400 hover:text-slate-600">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-emerald-600" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            {req.requestId}
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm truncate">{req.postTitle}</h3>
                          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                            • {req.department}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          {req.numberOfPositions} Position(s) • Budget: {req.tentativeBudget}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {shortlistedCands.length} Shortlisted
                      </span>
                    </div>
                  </div>

                  {/* Expanded Shortlisted Candidates Roster */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-3 space-y-2">
                      {shortlistedCands.map((candidate) => {
                        const docs = candidate.joiningDetails?.documentVerification;
                        const verifiedCount = [
                          docs?.identityProof,
                          docs?.degreesVerified,
                          docs?.experienceCertificates,
                          docs?.policeVerification,
                          docs?.medicalFitness,
                          docs?.nocRelieving
                        ].filter(Boolean).length;
                        const scoreFormatted = formatScore(candidate.interviewDetails?.scores?.totalScore);

                        return (
                          <div
                            key={candidate.id}
                            className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 hover:border-slate-300 transition"
                          >
                            {/* Candidate & Score */}
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-bold text-slate-900 text-sm">{candidate.fullName}</h4>
                                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                  {candidate.qualification}
                                </span>
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  <span>{scoreFormatted}/10</span>
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                                <span>{candidate.email}</span>
                                <span>•</span>
                                <span>{candidate.phone}</span>
                              </div>

                              {/* Appointment / Verification meta */}
                              {candidate.status !== 'Selected' && candidate.joiningDetails && (
                                <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-2 pt-0.5">
                                  <span className="font-semibold text-emerald-900">
                                    Offered: {candidate.joiningDetails.offeredCtc}
                                  </span>
                                  <span>•</span>
                                  <span className="font-mono text-slate-500 text-[10px]">
                                    Ref: {candidate.joiningDetails.offerLetterRef}
                                  </span>
                                  <span>•</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDocVerifyReq(req);
                                      setDocVerifyCand(candidate);
                                      setDocIdentityProof(!!candidate.joiningDetails?.documentVerification?.identityProof);
                                      setDocDegreesVerified(!!candidate.joiningDetails?.documentVerification?.degreesVerified);
                                      setDocExperienceCertificates(!!candidate.joiningDetails?.documentVerification?.experienceCertificates);
                                      setDocPoliceVerification(!!candidate.joiningDetails?.documentVerification?.policeVerification);
                                      setDocMedicalFitness(candidate.joiningDetails?.documentVerification?.medicalFitness !== false);
                                      setDocNocRelieving(candidate.joiningDetails?.documentVerification?.nocRelieving !== false);
                                      setDocRemarks(candidate.joiningDetails?.documentVerification?.verificationRemarks || 'Originals verified against university compliance norms.');
                                    }}
                                    className="text-blue-700 hover:text-blue-900 font-semibold text-[10px] underline"
                                  >
                                    Verify Docs ({verifiedCount}/6)
                                  </button>
                                  {candidate.status === 'Joined' && (
                                    <>
                                      <span>•</span>
                                      <span className="text-emerald-800 font-semibold text-[10px]">
                                        EMP ID: {candidate.joiningDetails.employeeId}
                                      </span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Status & Actions */}
                            <div className="flex items-center space-x-2 shrink-0">
                              {candidate.status === 'Selected' ? (
                                <button
                                  type="button"
                                  onClick={() => openOfferModal(req, candidate)}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  <span>Issue Offer Letter &rarr;</span>
                                </button>
                              ) : candidate.status === 'Offer Issued' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOnboardReq(req);
                                    setOnboardCand(candidate);
                                    setEmployeeId(candidate.joiningDetails?.employeeId || `GKU-FAC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
                                    setOfficialEmail(candidate.joiningDetails?.officialEmail || `${candidate.fullName.toLowerCase().replace(/[^a-z]/g, '')}@gku.ac.in`);
                                    setReportingHead(`Dean, ${req.department}`);
                                    setJoiningDate(new Date().toISOString().split('T')[0]);
                                    setChkIdCard(true);
                                    setChkItAccount(true);
                                    setChkWorkload(true);
                                    setChkBankAccount(true);
                                    setJoiningRemarks('Induction completed. Smart identity card issued and reporting initiated.');
                                  }}
                                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Formal Induction & Join &rarr;</span>
                                </button>
                              ) : (
                                <span className="text-emerald-700 font-bold text-xs inline-flex items-center space-x-1">
                                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                                  <span>Joined & Inducted</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: PENDING GOVERNANCE PIPELINE (WATCHLIST) */}
      {/* ============================================================== */}
      {activeTab === 'pipeline' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search pending department applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 font-medium"
              />
            </div>
            <span className="text-[11px] text-slate-700 font-semibold bg-white border border-slate-200 px-3 py-1 rounded-full flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>HR Watchlist: Recruitment actions unlock once sanctioned by Dean Academic & VC/Registrar</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Requisition ID</th>
                  <th className="py-3.5 px-6">Department & Post</th>
                  <th className="py-3.5 px-6">Submitted By (Dean)</th>
                  <th className="py-3.5 px-6">Positions</th>
                  <th className="py-3.5 px-6">Current Approval Stage</th>
                  <th className="py-3.5 px-6 text-right">Review Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedPending.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No department requisitions currently pending governance clearance.
                    </td>
                  </tr>
                ) : (
                  displayedPending.map((req) => (
                    <tr key={req.requestId} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">
                        {req.requestId}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-sm">{req.postTitle}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          {req.department} • {req.employmentType} ({req.postLevel})
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-700">
                        <div className="font-semibold text-slate-900">{req.creator?.name || 'Department Dean'}</div>
                        <div className="text-slate-400 text-[11px]">{req.creator?.email || ''}</div>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800">
                        {req.numberOfPositions} Position(s)
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${req.status === 'Approved by Dean Academic'
                            ? 'bg-purple-50 text-purple-900 border-purple-200'
                            : req.status === 'Returned for Clarification'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-amber-50 text-amber-900 border-amber-200'
                            }`}
                        >
                          {req.status}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">
                          {req.currentStage === 1 && 'Stage 1: Department Submission'}
                          {req.currentStage === 2 && 'Stage 2: Under Dean Academic Scrutiny'}
                          {req.currentStage === 3 && 'Stage 3: Under VC / Registrar Sanction'}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => setTimelineReq(req)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                        >
                          🕒 View Timeline
                        </button>
                        <button
                          onClick={() => setJobDetailsReq(req)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition"
                        >
                          📄 View Job Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 6: ARCHIVES & FULFILLED REPOSITORIES (FOLDER SYSTEM) */}
      {/* ============================================================== */}
      {activeTab === 'archive' && (
        <div className="space-y-4">
          {/* Header Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <span>Recruitment Archives &amp; Records Cabinet</span>
                  <span className="text-[11px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                    {archivedReqs.length} Archived Drives
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Organized repository of closed job applications, fulfilled academic chairs, and historic faculty hiring records.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    const allOpen: Record<string, boolean> = {};
                    Object.keys(archivedByDepartment).forEach((dept) => {
                      allOpen[dept] = true;
                    });
                    setOpenedFolders(allOpen);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-purple-800 bg-white hover:bg-purple-50 rounded-md shadow-2xs border border-purple-200 transition cursor-pointer"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={() => setOpenedFolders({})}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-md transition cursor-pointer"
                >
                  Collapse All
                </button>
              </div>

              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search archived dossiers, departments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Department Folders Cabinet Grid */}
          {Object.keys(archivedByDepartment).length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-2xs">
              <FolderCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <div className="font-semibold text-slate-700 text-sm">No Archived Dossiers Found</div>
              <p className="text-slate-400 text-xs mt-0.5">
                When a recruitment drive is marked as &ldquo;Position Fulfilled&rdquo; or &ldquo;Applications Closed&rdquo;, it automatically moves here to keep your active workspace lean.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(archivedByDepartment).map(([dept, reqList]) => {
                const isFolderOpen = Boolean(openedFolders[dept]); // Closed by default

                return (
                  <div
                    key={dept}
                    className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden transition"
                  >
                    {/* Folder Header */}
                    <div
                      onClick={() => toggleFolder(dept)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition select-none bg-slate-50/40 border-b border-slate-100"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-purple-600">
                          {isFolderOpen ? (
                            <FolderOpen className="w-6 h-6 text-purple-700" />
                          ) : (
                            <Folder className="w-6 h-6 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-slate-900 text-sm">{dept}</h4>
                            <span className="text-[10px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                              {reqList.length} Archived {reqList.length === 1 ? 'Dossier' : 'Dossiers'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Faculty recruitment records &amp; completed appointment drives
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-purple-800 font-semibold hidden sm:inline">
                          {isFolderOpen ? 'Collapse Folder' : 'Open Folder'}
                        </span>
                        {isFolderOpen ? (
                          <ChevronUp className="w-4 h-4 text-purple-700" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Inside the Folder: Archived Requisition Cards */}
                    {isFolderOpen && (
                      <div className="p-4 bg-slate-50/50 space-y-3 border-t border-slate-100">
                        {reqList.map((req) => {
                          const joinedCandidates = (req.candidates || []).filter((c) => c.status === 'Joined');
                          const totalSpend = (req.promotionChannels || []).reduce((s, p) => s + (p.cost || 0), 0);

                          return (
                            <div
                              key={req.requestId}
                              className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 hover:border-slate-300 transition shadow-2xs"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono text-xs font-bold text-purple-900 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                                      {req.requestId}
                                    </span>
                                    <h5 className="font-bold text-slate-900 text-sm">{req.postTitle}</h5>
                                    {req.status === 'Position Fulfilled (Recruitment Completed)' || req.status === 'Joined & Request Closed' ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                                        ✓ Fulfilled
                                      </span>
                                    ) : req.status === 'Applications Closed (Intake Stopped)' ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                                        ⛔ Applications Closed
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                        ⏸ On Hold
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-slate-500 text-xs flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <span>{req.numberOfPositions} Position(s) Sanctioned</span>
                                    <span>&bull;</span>
                                    <span>Budget: {req.tentativeBudget}</span>
                                    {totalSpend > 0 && (
                                      <>
                                        <span>&bull;</span>
                                        <span>Media Ad Spend: ₹{totalSpend.toLocaleString()}</span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center space-x-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setTimelineReq(req)}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
                                  >
                                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                                    <span>View Audit Trail</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setJobDetailsReq(req)}
                                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-purple-600" />
                                    <span>Open Archived Dossier</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setManageStatusReq(req);
                                      setStatusUpdateChoice('In Process (HR - Recruitment)');
                                      setStatusUpdateReason('Re-opening position from archives for active intake.');
                                    }}
                                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
                                    title="Restore position to active posted jobs"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Re-Open / Restore</span>
                                  </button>
                                </div>
                              </div>

                              {/* Inducted / Appointed Faculty Row */}
                              {joinedCandidates.length > 0 && (
                                <div className="p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-1 text-xs">
                                  <div className="font-bold text-emerald-950 flex items-center space-x-1.5">
                                    <GraduationCap className="w-4 h-4 text-emerald-700" />
                                    <span>Appointed &amp; Inducted Faculty ({joinedCandidates.length}):</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2 pt-0.5">
                                    {joinedCandidates.map((cand) => (
                                      <div
                                        key={cand.id}
                                        className="bg-white border border-emerald-200 rounded px-2.5 py-1 text-[11px] text-emerald-900 font-semibold"
                                      >
                                        <strong>{cand.fullName}</strong> ({cand.qualification}) &bull;{' '}
                                        <span className="font-mono text-[10px] text-slate-500">
                                          ID: {cand.joiningDetails?.employeeId || 'Assigned'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Applications Closed Notice */}
                              {req.status === 'Applications Closed (Intake Stopped)' && (
                                <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-lg space-y-1 text-xs">
                                  <div className="font-bold text-amber-950 flex items-center space-x-1.5">
                                    <Ban className="w-3.5 h-3.5 text-amber-700" />
                                    <span>Applications Intake Halted &amp; Closed:</span>
                                  </div>
                                  <p className="text-[11px] text-amber-800">
                                    Candidate portal registration stopped. Requisition archived to prevent further submissions. Click &ldquo;Re-Open / Restore&rdquo; to resume active hiring.
                                  </p>
                                </div>
                              )}

                              {/* Hiring On Hold Notice */}
                              {req.status === 'Hiring On Hold' && (
                                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
                                  <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                                    <Clock className="w-3.5 h-3.5 text-slate-600" />
                                    <span>Recruitment Drive Paused (On Hold):</span>
                                  </div>
                                  <p className="text-[11px] text-slate-600">
                                    Drive temporarily frozen pending Syndicate roster review or departmental budget reallocation.
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: POST JOB TO PLATFORM */}
      {/* ============================================================== */}
      {postingReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  {postingReq.requestId}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Publish Job Posting: {postingReq.postTitle}
                </h3>
                <p className="text-xs text-slate-500">
                  {postingReq.department} &bull; Budget: {postingReq.tentativeBudget}
                </p>
              </div>
              <button
                onClick={() => setPostingReq(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePostJob} className="space-y-4 text-xs">
              {/* Checkbox Platform Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-bold text-slate-800 text-xs">
                    Select Advertising Platforms / Channels:
                    <span className="ml-2 font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 text-[11px]">
                      {selectedPlatforms.length} selected
                    </span>
                  </label>
                  <div className="flex items-center space-x-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setSelectedPlatforms(AVAILABLE_PLATFORMS.map(p => p.id))}
                      className="text-blue-700 hover:text-blue-800 font-bold underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedPlatforms([])}
                      className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50">
                  {AVAILABLE_PLATFORMS.map((platform) => {
                    const isChecked = selectedPlatforms.includes(platform.id);
                    return (
                      <label
                        key={platform.id}
                        className={`flex items-center space-x-2.5 p-2.5 rounded-lg border cursor-pointer select-none transition ${isChecked
                          ? 'bg-blue-50/80 border-blue-300 text-blue-950 font-semibold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPlatforms([...selectedPlatforms, platform.id]);
                            } else {
                              setSelectedPlatforms(selectedPlatforms.filter(id => id !== platform.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-base">{platform.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-xs font-bold">{platform.label}</div>
                          <div className="text-[10px] text-slate-400 font-normal truncate">{platform.tag}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {selectedPlatforms.length === 0 && (
                  <p className="text-rose-600 text-[11px] mt-1 font-semibold">
                    ⚠️ Please select at least one platform to publish this job posting.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ad Spend Budget (₹):
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={adSpendBudget}
                  onChange={(e) => setAdSpendBudget(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Remarks:
                </label>
                <textarea
                  rows={2}
                  value={postingRemarks}
                  onChange={(e) => setPostingRemarks(e.target.value)}
                  placeholder="Enter remarks, tracking notes, or job reference details..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Valid Till / Expiry Date:
                </label>
                <input
                  type="date"
                  value={adExpiry}
                  onChange={(e) => setAdExpiry(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPostingReq(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || selectedPlatforms.length === 0}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Publishing...' : `Publish to ${selectedPlatforms.length} Platform(s) & Move to Posted Jobs`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: UPLOAD CANDIDATE RESUME */}
      {/* ============================================================== */}
      {resumeReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                  {resumeReq.requestId}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Upload Resume for {resumeReq.postTitle}
                </h3>
                <p className="text-xs text-slate-500">
                  {resumeReq.department} &bull; Register candidate into the applicant pool
                </p>
              </div>
              <button
                onClick={() => setResumeReq(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadResume} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Candidate Full Name <span className="text-rose-600">*</span>:
                  </label>
                  <input
                    type="text"
                    value={candName}
                    onChange={(e) => setCandName(e.target.value)}
                    placeholder="e.g. Dr. Harpreet Kaur"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Number / Phone <span className="text-rose-600">*</span>:
                  </label>
                  <input
                    type="tel"
                    value={candPhone}
                    onChange={(e) => setCandPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-600">*</span>:
                </label>
                <input
                  type="email"
                  value={candEmail}
                  onChange={(e) => setCandEmail(e.target.value)}
                  placeholder="harpreet.k@example.com"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Highest Qualification:
                  </label>
                  <input
                    type="text"
                    value={candQual}
                    onChange={(e) => setCandQual(e.target.value)}
                    placeholder="e.g. Ph.D. in CSE"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Experience (Years):
                  </label>
                  <input
                    type="number"
                    value={candExp}
                    onChange={(e) => setCandExp(e.target.value)}
                    placeholder="e.g. 4"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Current Affiliation / University:
                </label>
                <input
                  type="text"
                  value={candAffiliation}
                  onChange={(e) => setCandAffiliation(e.target.value)}
                  placeholder="e.g. NIT Jalandhar / Independent Researcher"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Upload Candidate Resume / Curriculum Vitae (.pdf, .doc, .docx):
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-3 bg-slate-50 hover:bg-indigo-50/20 transition text-center cursor-pointer relative group">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setResumeFile(file);
                        setResumeFileName(file.name);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {resumeFileName ? (
                    <div className="flex items-center justify-between px-3 py-1.5 bg-white border border-indigo-200 rounded-lg">
                      <div className="flex items-center space-x-2 min-w-0">
                        <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-900 truncate">{resumeFileName}</span>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded shrink-0">
                          Ready to Upload
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setResumeFile(null);
                          setResumeFileName('');
                        }}
                        className="text-slate-400 hover:text-rose-600 text-xs font-bold ml-2 p-1 cursor-pointer"
                        title="Remove file"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 py-1">
                      <UploadCloud className="w-5 h-5 mx-auto text-indigo-600 group-hover:scale-110 transition" />
                      <div className="text-xs font-semibold text-slate-700">
                        Click to browse or drop candidate resume file
                      </div>
                      <p className="text-[10px] text-slate-400">PDF, DOC, DOCX up to 15MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResumeReq(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Uploading...' : 'Save & Register Resume'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DRAWER / MODAL: VIEW APPLICANTS FOR A JOB & SCHEDULE INTERVIEW */}
      {/* ============================================================== */}
      {viewApplicantsReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-indigo-50/30">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-900 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                  {viewApplicantsReq.requestId}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Applicant Pool: {viewApplicantsReq.postTitle}
                </h3>
                <p className="text-xs text-slate-500">
                  {viewApplicantsReq.department} &bull; {(viewApplicantsReq.candidates || []).length} Applicant(s) Registered
                </p>
              </div>
              <button
                onClick={() => setViewApplicantsReq(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-3">
              {!(viewApplicantsReq.candidates && viewApplicantsReq.candidates.length > 0) ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No applicants registered yet. Click &ldquo;+ Upload Resume&rdquo; on the job row to add candidates.
                </div>
              ) : (
                viewApplicantsReq.candidates.map((cand) => (
                  <div
                    key={cand.id}
                    className="p-4 bg-white border border-slate-200 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <strong className="text-slate-900 text-sm font-bold">{cand.fullName}</strong>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cand.status === 'Joined'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : cand.status === 'Offer Issued'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : cand.status === 'Interviewed'
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : cand.status === 'Interview Scheduled'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                        >
                          {cand.status}
                        </span>
                      </div>
                      <div className="text-slate-600 text-[11px] mt-0.5">
                        {cand.qualification} • {cand.experienceYears} Years Exp • {cand.currentAffiliation || 'Independent'}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        {cand.phone} • {cand.email} • File: {cand.resumeFileName}
                      </div>
                      {cand.interviewDetails && (
                        <div className="text-[11px] font-semibold text-blue-900 mt-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block">
                          🗓️ Interview: {cand.interviewDetails.date} with {cand.interviewDetails.panelMembers.join(', ')}
                        </div>
                      )}
                    </div>

                    <div>
                      {cand.status === 'Interview Scheduled' || cand.status === 'Interviewed' ? (
                        <button
                          onClick={() => {
                            setSchedulingReq(viewApplicantsReq);
                            setSchedulingCand(cand);
                            setPanelMembersList(cand.interviewDetails?.panelMembers || ['Prof. Balwant Singh (Dean Academic)', 'Subject Expert Nominee']);
                          }}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-bold transition border border-amber-200"
                        >
                          Reschedule Interview &rarr;
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSchedulingReq(viewApplicantsReq);
                            setSchedulingCand(cand);
                            setInterviewDate('2026-12-10');
                            setInterviewTime('11:00 AM');
                            setPanelMembersList(['Prof. Balwant Singh (Dean Academic)', 'Subject Expert Nominee']);
                          }}
                          className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center space-x-1"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Schedule Interview &rarr;</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setViewApplicantsReq(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: SCHEDULE INTERVIEW WITH INTERACTIVE PANEL MEMBERS ADDER */}
      {/* ============================================================== */}
      {schedulingReq && schedulingCand && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                  {schedulingReq.requestId}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Schedule Interview: {schedulingCand.fullName}
                </h3>
                <p className="text-xs text-slate-500">
                  For position: {schedulingReq.postTitle} ({schedulingReq.department})
                </p>
              </div>
              <button
                onClick={() => {
                  setSchedulingReq(null);
                  setSchedulingCand(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleInterview} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Interview Date <span className="text-rose-600">*</span>:
                  </label>
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Interview Time <span className="text-rose-600">*</span>:
                  </label>
                  <input
                    type="text"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    placeholder="e.g. 11:30 AM"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Interview Venue / Mode:
                </label>
                <input
                  type="text"
                  value={interviewVenue}
                  onChange={(e) => setInterviewVenue(e.target.value)}
                  placeholder="Board Room 1, Guru Kashi University or Online Link"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              {/* SELECTION PANEL MEMBERS ADDER (NOT COMMA SEPARATED) */}
              <div className="space-y-2.5 p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-blue-950 text-xs">
                    Selection Panel Members & Interviewers <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[11px] text-blue-700 font-semibold">
                    {panelMembersList.length} Member(s) Added
                  </span>
                </div>

                {/* Input with Add Button */}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={memberInput}
                    onChange={(e) => setMemberInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMember();
                      }
                    }}
                    placeholder="Enter member name and role..."
                    className="flex-1 p-2 bg-white border border-blue-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddMember()}
                    disabled={!memberInput.trim()}
                    className="px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shrink-0"
                  >
                    + Add Member
                  </button>
                </div>

                {/* Quick Add Suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-500">Quick suggestions:</span>
                  {[
                    'Prof. Balwant Singh (Dean Academic)',
                    'Prof. (Dr.) Gurinder Singh (VC Nominee)',
                    'Department HOD / Subject Expert',
                    'External University Nominee',
                    'Industry Specialist'
                  ].map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => handleAddMember(sugg)}
                      className="px-2 py-0.5 rounded-full bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-semibold transition"
                    >
                      + {sugg.split('(')[0].trim()}
                    </button>
                  ))}
                </div>

                {/* Added Members Chips List */}
                <div className="space-y-1.5 pt-2 border-t border-blue-200/60">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                    Confirmed Interview Panelists:
                  </span>
                  {panelMembersList.length === 0 ? (
                    <p className="text-[11px] text-rose-600 italic">
                      No panel members added yet. Add at least one member above.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {panelMembersList.map((member, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-white border border-blue-300 rounded-lg text-xs font-bold text-blue-950 shadow-2xs"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{member}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(idx)}
                            className="text-slate-400 hover:text-rose-600 font-bold ml-1 transition"
                            title="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setSchedulingReq(null);
                    setSchedulingCand(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || panelMembersList.length === 0}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Scheduling...' : 'Confirm & Move to Scheduled Interviews'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3.2: EVALUATE INTERVIEW & SCORE (OUT OF 10) */}
      {/* ============================================================== */}
      {/* 3. EVALUATION MODAL: STREAMLINED & PROFESSIONAL */}
      {/* ============================================================== */}
      {evaluatingReq && evaluatingCand && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Header with Candidate details & Close */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-mono text-[11px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {evaluatingReq.requestId}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {evaluatingReq.postTitle}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {evaluatingCand.fullName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEvaluatingReq(null);
                  setEvaluatingCand(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvaluation} className="space-y-3.5 text-xs">
              {/* Compact Inline Score Bar */}
              {(() => {
                const validRatings = evaluatorEntries
                  .map((e) => Number(e.rating))
                  .filter((r) => !isNaN(r) && r >= 0);
                const overallScore = validRatings.length > 0
                  ? (validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length).toFixed(1)
                  : '—';

                return (
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-600 font-semibold text-xs">Overall Score:</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        <span className="text-base font-black text-slate-900">{overallScore}</span>
                        <span className="text-slate-400 text-xs font-normal">/ 10</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-medium text-slate-500">
                        {evaluatorEntries.length} {evaluatorEntries.length === 1 ? 'Evaluator' : 'Evaluators'}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {evalRecommendation}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Panel Evaluator Rows */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">
                    Evaluator Ratings
                  </span>
                  <button
                    type="button"
                    onClick={handleAddEvaluator}
                    className="px-2.5 py-1 text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Evaluator</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                  {evaluatorEntries.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center space-x-2 bg-slate-50/70 hover:bg-slate-50 p-2 rounded-lg border border-slate-200 transition"
                    >
                      <input
                        type="text"
                        required
                        value={ev.name}
                        onChange={(e) => handleEvaluatorNameChange(ev.id, e.target.value)}
                        placeholder="Evaluator Name"
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          required
                          value={ev.rating}
                          onChange={(e) => handleEvaluatorRatingChange(ev.id, e.target.value)}
                          placeholder="Score"
                          className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <span className="text-[11px] font-semibold text-slate-400">/ 10</span>
                      </div>
                      {evaluatorEntries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEvaluator(ev.id)}
                          title="Remove"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Minimal Single-Line Scorecard Upload */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  Signed Scorecard Sheet <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                {!scorecardFileName ? (
                  <label className="border border-dashed border-slate-300 hover:border-blue-400 rounded-lg p-2.5 flex items-center justify-center space-x-2 cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs font-medium text-slate-600">
                      Upload Signed Scorecard (PDF or Image)
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={handleScorecardUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center space-x-2 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-emerald-950 text-xs truncate">{scorecardFileName}</span>
                      {scorecardFileSize && (
                        <span className="text-[10px] text-emerald-700 shrink-0">({scorecardFileSize})</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setScorecardFileName('');
                        setScorecardFileSize('');
                      }}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer shrink-0 ml-2"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Recommendation & Immediate Decision */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-800 text-xs mb-1">
                    Recommendation
                  </label>
                  <select
                    value={evalRecommendation}
                    onChange={(e) => setEvalRecommendation(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Strongly Recommend">Strongly Recommend</option>
                    <option value="Recommend">Recommend</option>
                    <option value="Waitlist">Waitlist</option>
                    <option value="Not Recommended">Not Recommended</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 text-xs mb-1">
                    Next Action
                  </label>
                  <select
                    value={evalDecision}
                    onChange={(e) => setEvalDecision(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="interviewed">Save Score</option>
                    <option value="shortlist">Save & Shortlist for Offer</option>
                    <option value="reject">Save & Reject Candidate</option>
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  Committee Remarks
                </label>
                <textarea
                  rows={2}
                  value={evalRemarks}
                  onChange={(e) => setEvalRemarks(e.target.value)}
                  placeholder="Observations or appointment notes..."
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEvaluatingReq(null);
                    setEvaluatingCand(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : 'Save Evaluation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: (Handled via Full-Page Dedicated OfferLetterWorkbench) */}
      {/* ============================================================== */}

      {/* ============================================================== */}
      {/* MODAL 5: PRE-JOINING DOCUMENT VERIFICATION DESK */}
      {/* ============================================================== */}
      {docVerifyReq && docVerifyCand && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  {docVerifyReq.requestId} &bull; Document Audit
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Document Verification Desk: {docVerifyCand.fullName}
                </h3>
                <p className="text-xs text-slate-500">
                  Selected for: {docVerifyReq.postTitle} &bull; Ref: {docVerifyCand.joiningDetails?.offerLetterRef || 'Offer Released'}
                </p>
              </div>
              <button
                onClick={() => {
                  setDocVerifyReq(null);
                  setDocVerifyCand(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleVerifyDocs} className="space-y-3.5 text-xs">
              <div className="space-y-2">
                <span className="font-bold text-slate-800 block text-xs">
                  Statutory Pre-Joining Documents Checklist
                </span>

                <div className="space-y-1.5">
                  {/* Item 1: Statutory Degrees */}
                  <label className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer select-none transition ${
                    docDegreesVerified ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}>
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={docDegreesVerified}
                        onChange={(e) => setDocDegreesVerified(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer shrink-0"
                      />
                      <span className="font-semibold text-xs truncate">Academic Degrees &amp; Ph.D. Certificates</span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">PhD_Degree_Cert.pdf</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        docDegreesVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {docDegreesVerified ? 'Verified ✓' : 'Pending'}
                      </span>
                    </div>
                  </label>

                  {/* Item 2: Government ID & Address */}
                  <label className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer select-none transition ${
                    docIdentityProof ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}>
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={docIdentityProof}
                        onChange={(e) => setDocIdentityProof(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer shrink-0"
                      />
                      <span className="font-semibold text-xs truncate">Government Photo ID (Aadhaar / Passport)</span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">Aadhaar_Card_Verified.pdf</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        docIdentityProof ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {docIdentityProof ? 'Verified ✓' : 'Pending'}
                      </span>
                    </div>
                  </label>

                  {/* Item 3: Relieving & Experience */}
                  <label className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer select-none transition ${
                    docExperienceCertificates ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}>
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={docExperienceCertificates}
                        onChange={(e) => setDocExperienceCertificates(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer shrink-0"
                      />
                      <span className="font-semibold text-xs truncate">Experience Certificates &amp; Relieving Order</span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">Relieving_Exp_Letter.pdf</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        docExperienceCertificates ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {docExperienceCertificates ? 'Verified ✓' : 'Pending'}
                      </span>
                    </div>
                  </label>

                  {/* Item 4: Medical Fitness */}
                  <label className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer select-none transition ${
                    docMedicalFitness ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}>
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={docMedicalFitness}
                        onChange={(e) => setDocMedicalFitness(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer shrink-0"
                      />
                      <span className="font-semibold text-xs truncate">Medical Fitness Certificate</span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">Medical_Fitness_Cert.pdf</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        docMedicalFitness ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {docMedicalFitness ? 'Verified ✓' : 'Pending'}
                      </span>
                    </div>
                  </label>

                  {/* Item 5: Police & Character Verification */}
                  <label className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer select-none transition ${
                    docPoliceVerification ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}>
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={docPoliceVerification}
                        onChange={(e) => setDocPoliceVerification(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer shrink-0"
                      />
                      <span className="font-semibold text-xs truncate">Character &amp; Police Verification Clearance</span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">Character_Clearance.pdf</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        docPoliceVerification ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {docPoliceVerification ? 'Verified ✓' : 'Pending'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Verification Remarks
                </label>
                <textarea
                  rows={2}
                  value={docRemarks}
                  onChange={(e) => setDocRemarks(e.target.value)}
                  placeholder="Record verification findings or clearance notes..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-normal text-slate-800 bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setDocVerifyReq(null);
                    setDocVerifyCand(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer flex items-center space-x-1.5 shadow-xs"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : 'Save Verification'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 6: FORMAL UNIVERSITY FACULTY JOINING & INDUCTION DESK */}
      {/* ============================================================== */}
      {onboardReq && onboardCand && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  {onboardReq.requestId} &bull; Final Faculty Joining
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Faculty Joining & Induction: {onboardCand.fullName}
                </h3>
                <p className="text-xs text-slate-500">
                  Appointment for: <strong className="text-slate-800">{onboardReq.postTitle}</strong> ({onboardReq.department})
                </p>
              </div>
              <button
                onClick={() => {
                  setOnboardReq(null);
                  setOnboardCand(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleMarkJoined} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assign Permanent Employee ID / Biometric Code *
                  </label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. GKU-FAC-2026-042"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official University Email Account
                  </label>
                  <input
                    type="email"
                    value={officialEmail}
                    onChange={(e) => setOfficialEmail(e.target.value)}
                    placeholder="e.g. harpreet.cse@gku.ac.in"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-medium text-slate-800 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Actual Date of Joining / Reporting *
                  </label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Reporting Authority / Department Head
                  </label>
                  <input
                    type="text"
                    value={reportingHead}
                    onChange={(e) => setReportingHead(e.target.value)}
                    placeholder={`Dean, ${onboardReq.department}`}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800 bg-white"
                  />
                </div>
              </div>

              {/* Induction Checklist */}
              <div>
                <span className="font-bold text-slate-800 block text-xs mb-2">
                  Institutional Orientation & Faculty Induction Checklist:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={chkIdCard}
                      onChange={(e) => setChkIdCard(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-800">Faculty Smart ID & Biometric Access Issued</span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={chkItAccount}
                      onChange={(e) => setChkItAccount(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-800">University ERP, LMS & WiFi Credentials Activated</span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={chkWorkload}
                      onChange={(e) => setChkWorkload(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-800">Department Timetable & Office Room Handed Over</span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={chkBankAccount}
                      onChange={(e) => setChkBankAccount(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-800">Salary Bank Account & Provident Fund Enrolled</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Final Joining Report & Orientation Notes:
                </label>
                <textarea
                  rows={2}
                  value={joiningRemarks}
                  onChange={(e) => setJoiningRemarks(e.target.value)}
                  placeholder="Record joining remarks, date of reporting to Dean, orientation completion..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-normal text-slate-800 bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setOnboardReq(null);
                    setOnboardCand(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Onboarding...' : 'Confirm Joining & Induct Faculty'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: MANAGE RECRUITMENT & INTAKE STATUS (Close/Fulfill/Hold) */}
      {/* ============================================================== */}
      {manageStatusReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {manageStatusReq.requestId}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Manage Recruitment &amp; Intake Status
                </h3>
                <p className="text-xs text-slate-500">
                  {manageStatusReq.postTitle} &bull; {manageStatusReq.department}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManageStatusReq(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateRecruitmentStatus} className="space-y-4 text-xs">
              {/* Current summary */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Current Status:</span>
                  <span className="font-bold text-slate-900">{manageStatusReq.status}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Positions Sanctioned:</span>
                  <span className="font-bold text-slate-900">{manageStatusReq.numberOfPositions} Position(s)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Candidates Joined:</span>
                  <span className="font-bold text-emerald-700">
                    {manageStatusReq.candidates?.filter((c) => c.status === 'Joined').length || 0} of {manageStatusReq.numberOfPositions} Joined
                  </span>
                </div>
              </div>

              {/* Status selection options */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-800">
                  Select Target Recruitment &amp; Intake Status:
                </label>

                {[
                  {
                    id: 'Position Fulfilled (Recruitment Completed)' as HiringStatus,
                    label: '✓ Mark Position Fulfilled (Recruitment Completed)',
                    desc: 'All openings filled and faculty joined. Successfully close recruitment.',
                    color: 'text-emerald-800 bg-emerald-50/70 border-emerald-300'
                  },
                  {
                    id: 'Applications Closed (Intake Stopped)' as HiringStatus,
                    label: '⛔ Close Job Applications (Intake Finished)',
                    desc: 'Application window expired or sufficient resumes received. Stop intake of new applications.',
                    color: 'text-amber-900 bg-amber-50/70 border-amber-300'
                  },
                  {
                    id: 'Hiring On Hold' as HiringStatus,
                    label: '⏸ Place Recruitment On Hold',
                    desc: 'Temporarily pause recruitment activities due to administrative or budget reassessment.',
                    color: 'text-slate-800 bg-slate-100 border-slate-300'
                  },
                  {
                    id: 'In Process (HR - Recruitment)' as HiringStatus,
                    label: '▶ Re-Open Active Application Intake',
                    desc: 'Resume active intake of candidate applications on portal.',
                    color: 'text-indigo-900 bg-indigo-50/70 border-indigo-300'
                  }
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition ${statusUpdateChoice === opt.id
                      ? opt.color + ' ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="recruitmentStatusChoice"
                      value={opt.id}
                      checked={statusUpdateChoice === opt.id}
                      onChange={() => setStatusUpdateChoice(opt.id)}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900">{opt.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Reason / Remarks textarea */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason / Administrative Remarks:
                </label>
                <textarea
                  rows={2}
                  value={statusUpdateReason}
                  onChange={(e) => setStatusUpdateReason(e.target.value)}
                  placeholder="e.g. Requirement fulfilled with appointment of selected faculty; closing public portal intake."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setManageStatusReq(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Updating...' : 'Update Status & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TIMELINE MODAL */}
      {timelineReq && (
        <TimelineModal
          isOpen={!!timelineReq}
          request={timelineReq}
          onClose={() => setTimelineReq(null)}
        />
      )}

      {/* JOB DETAILS MODAL */}
      {jobDetailsReq && (
        <JobDetailsModal
          isOpen={!!jobDetailsReq}
          request={jobDetailsReq}
          onClose={() => setJobDetailsReq(null)}
        />
      )}
    </div>
  );
}
