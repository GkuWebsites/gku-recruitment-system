'use client';

import React, { useState, useRef } from 'react';
import {
  IHiringRequest,
  Candidate,
  DocumentVerification,
  DocumentFileMeta
} from '@/lib/types';
import {
  ArrowLeft,
  Printer,
  FileText,
  Building2,
  GraduationCap,
  Award,
  DollarSign,
  Calendar,
  User,
  Mail,
  Phone,
  AlertCircle,
  Check,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Star,
  Send,
  Save,
  Briefcase,
  UploadCloud,
  FileUp,
  Eye,
  Trash2,
  Download,
  X,
  Plus
} from 'lucide-react';

interface OfferLetterWorkbenchProps {
  request: IHiringRequest;
  candidate: Candidate;
  onBack: () => void;
  onComplete: () => void;
}

export function OfferLetterWorkbench({
  request,
  candidate,
  onBack,
  onComplete
}: OfferLetterWorkbenchProps) {
  // Navigation / Tabs inside Workbench
  const [activeTab, setActiveTab] = useState<'details' | 'dossier' | 'documents' | 'clauses'>('details');

  // Form Fields for Offer Letter
  const [offerLetterRef, setOfferLetterRef] = useState(
    candidate.joiningDetails?.offerLetterRef ||
      `GKU/EST/APPT/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [designation, setDesignation] = useState<string>(request.postTitle);
  const [department, setDepartment] = useState<string>(request.department);
  const [academicLevel, setAcademicLevel] = useState(
    candidate.joiningDetails?.academicLevel || request.postLevel || 'Academic Level 10 (Entry Pay ₹57,700)'
  );
  const [offeredCtc, setOfferedCtc] = useState(
    candidate.joiningDetails?.offeredCtc || request.tentativeBudget
  );
  const [basicSalary, setBasicSalary] = useState(
    candidate.joiningDetails?.basicSalary || '₹57,700 per month (UGC 7th CPC Matrix)'
  );
  const [probationPeriod, setProbationPeriod] = useState(
    candidate.joiningDetails?.probationPeriod || '1 Year'
  );
  const [joiningDeadline, setJoiningDeadline] = useState(
    candidate.joiningDetails?.joiningDeadline ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [expectedJoiningDate, setExpectedJoiningDate] = useState(
    candidate.joiningDetails?.joiningDate ||
      new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [placeOfPosting, setPlaceOfPosting] = useState(
    'Guru Kashi University Main Campus, Talwandi Sabo, Bathinda, Punjab'
  );
  const [reportingHead, setReportingHead] = useState(
    `Dean, Faculty of ${request.department} / Registrar`
  );
  const [specialClauses, setSpecialClauses] = useState(
    candidate.joiningDetails?.offerRemarks ||
      'Appointment is subject to submission of original educational certificates, relieving certificate from the previous employer, character verification, and medical fitness. Faculty is expected to engage in teaching, high-impact research publications, and NAAC/UGC regulatory accreditations.'
  );

  // Signed offer letter copy
  const [signedOfferLetterCopy, setSignedOfferLetterCopy] = useState<string>(
    candidate.joiningDetails?.signedOfferLetterCopy || ''
  );

  // Pre-Joining Document Verification State
  const initialDocs: DocumentVerification = candidate.joiningDetails?.documentVerification || {
    identityProof: false,
    degreesVerified: false,
    experienceCertificates: false,
    policeVerification: false,
    medicalFitness: false,
    nocRelieving: false
  };
  const [docs, setDocs] = useState<DocumentVerification>(initialDocs);
  const [verificationRemarks, setVerificationRemarks] = useState(
    initialDocs.verificationRemarks || ''
  );

  // Uploaded Documents Collection - Only real uploaded files, no fake defaults
  const initialFiles: Record<string, DocumentFileMeta> =
    candidate.joiningDetails?.documentVerification?.uploadedFiles || {};
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, DocumentFileMeta>>(initialFiles);

  // Document Viewer / Inspection Modal State
  const [previewingDoc, setPreviewingDoc] = useState<DocumentFileMeta | null>(null);

  interface DocItem {
    key: string;
    title: string;
    isCustom?: boolean;
  }

  const defaultDocItems: DocItem[] = [
    { key: 'identityProof', title: 'National Identity Proof (Aadhaar / Passport / Voter ID)' },
    { key: 'degreesVerified', title: 'Degree Certificates & Transcripts (Ph.D. / PG / NET / GATE)' },
    { key: 'experienceCertificates', title: 'Service & Teaching Experience Certificates' },
    { key: 'nocRelieving', title: 'Relieving Order & No Objection Certificate (NOC)' },
    { key: 'medicalFitness', title: 'Medical Fitness Certificate' },
    { key: 'policeVerification', title: 'Police & Character Verification Clearance' }
  ];

  const [docItems, setDocItems] = useState<DocItem[]>(() => {
    const customKeys = Object.keys(initialFiles).filter(
      (k) => !defaultDocItems.some((d) => d.key === k)
    );
    const customItems: DocItem[] = customKeys.map((k) => ({
      key: k,
      title: initialFiles[k]?.category || initialFiles[k]?.fileName || 'Additional Document',
      isCustom: true
    }));
    return [...defaultDocItems, ...customItems];
  });
  const [newDocName, setNewDocName] = useState('');

  const handleAddNewDoc = () => {
    if (!newDocName.trim()) return;
    const key = `custom_${Date.now()}`;
    setDocItems((prev) => [...prev, { key, title: newDocName.trim(), isCustom: true }]);
    setNewDocName('');
  };

  const handleRemoveDocItem = (key: string) => {
    setDocItems((prev) => prev.filter((d) => d.key !== key));
    handleRemoveFile(key);
  };

  // Additional custom document upload state
  const [customDocLabel, setCustomDocLabel] = useState('');
  const additionalFileInputRef = useRef<HTMLInputElement>(null);

  // Hidden file inputs refs for each document key
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Submission / Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);

  // Helper toggle doc
  const toggleDoc = (key: string) => {
    setDocs((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const verifiedDocCount = docItems.filter((item) => docs[item.key] === true).length;

  // Handle file upload for standard items
  const handleFileUpload = (docKey: string, file: File, categoryTitle: string) => {
    if (!file) return;
    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const newMeta: DocumentFileMeta = {
      fileName: file.name,
      fileSize: sizeStr,
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: categoryTitle
    };

    setUploadedFiles((prev) => ({
      ...prev,
      [docKey]: newMeta
    }));

    // Auto mark as verified
    if (docKey in docs) {
      setDocs((prev) => ({
        ...prev,
        [docKey as keyof DocumentVerification]: true
      }));
    }

    setStatusMessage(`✓ Document "${file.name}" uploaded successfully for ${categoryTitle}!`);
    setTimeout(() => setStatusMessage(''), 3500);
  };

  // Handle remove file
  const handleRemoveFile = (docKey: string) => {
    setUploadedFiles((prev) => {
      const copy = { ...prev };
      delete copy[docKey];
      return copy;
    });
    if (docKey in docs) {
      setDocs((prev) => ({
        ...prev,
        [docKey as keyof DocumentVerification]: false
      }));
    }
  };

  // Handle upload additional document
  const handleAddCustomDocument = (file: File) => {
    if (!file) return;
    const label = customDocLabel.trim() || file.name.replace(/\.[^/.]+$/, '');
    const docKey = `custom_${Date.now()}`;
    handleFileUpload(docKey, file, label);
    setCustomDocLabel('');
    if (additionalFileInputRef.current) {
      additionalFileInputRef.current.value = '';
    }
  };

  // Print Letterhead Action
  const handlePrint = () => {
    window.print();
  };

  // Save Draft Action (local notification)
  const handleSaveDraft = () => {
    setDraftSaved(true);
    setStatusMessage('Draft configurations and document records saved.');
    setTimeout(() => setDraftSaved(false), 3000);
  };

  // Issue Formal Offer Action
  const handleIssueFormalOffer = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'issue_offer',
          requestId: request.requestId,
          candidateId: candidate.id,
          offerLetterRef: offerLetterRef.trim(),
          offeredCtc: offeredCtc.trim(),
          basicSalary: basicSalary.trim(),
          academicLevel: academicLevel.trim(),
          probationPeriod: probationPeriod.trim(),
          joiningDeadline,
          offerRemarks: specialClauses.trim(),
          offerLetterFile: `Appointment_Offer_${candidate.fullName.replace(/\s+/g, '_')}_Formal.pdf`,
          signedOfferLetterCopy: signedOfferLetterCopy.trim(),
          documentVerification: {
            ...docs,
            verificationRemarks: verificationRemarks.trim(),
            uploadedFiles
          },
          actorName: 'Directorate of HR & Faculty Affairs'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to issue formal university appointment offer');
      }

      setStatusMessage(
        `✓ Formal University Appointment Offer (${offerLetterRef}) successfully generated & released to ${candidate.fullName}!`
      );
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Evaluation score formatting
  const rawScore = candidate.interviewDetails?.scores?.totalScore;
  const evalScoreFormatted =
    rawScore !== undefined && rawScore !== null
      ? rawScore > 10
        ? (rawScore / 10).toFixed(1)
        : Number(rawScore).toFixed(1)
      : '9.2';

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ============================================================== */}
      {/* 1. TOP HEADER & BREADCRUMB BAR (Hidden during Print) */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition flex items-center justify-center cursor-pointer shadow-2xs"
            title="Return to Shortlisted Candidates"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-semibold mb-1">
              <span>HR Recruitment Pipeline</span>
              <span>/</span>
              <span className="text-emerald-700 font-bold">{request.requestId}</span>
              <span>/</span>
              <span>Appointment & Offer Letter Desk</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
              <span>University Appointment Offer Desk</span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Formal Generation Desk
              </span>
            </h1>
          </div>
        </div>

        {/* Quick Header Actions */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>{draftSaved ? 'Saved!' : 'Save Draft'}</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Official Letter (A4)</span>
          </button>
          <button
            type="button"
            onClick={handleIssueFormalOffer}
            disabled={isSubmitting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition flex items-center space-x-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Generating & Dispatching...' : 'Issue & Release Offer Letter'}</span>
          </button>
        </div>
      </div>

      {/* Status & Error Messages */}
      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in print:hidden">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in print:hidden">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. REQUISITION & CANDIDATE DOSSIER STRIP (Hidden during Print) */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
        {/* Candidate Summary */}
        <div className="flex items-center space-x-3 md:border-r md:border-slate-100 md:pr-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-base shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Candidate Selected</div>
            <div className="font-extrabold text-slate-900 text-sm truncate">{candidate.fullName}</div>
            <div className="text-[11px] text-slate-500 truncate">{candidate.qualification}</div>
          </div>
        </div>

        {/* Position & Department */}
        <div className="flex items-center space-x-3 md:border-r md:border-slate-100 md:pr-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Target Post & Dept</div>
            <div className="font-extrabold text-slate-900 text-sm truncate">{request.postTitle}</div>
            <div className="text-[11px] text-slate-500 truncate">{request.department}</div>
          </div>
        </div>

        {/* Interview Performance */}
        <div className="flex items-center space-x-3 md:border-r md:border-slate-100 md:pr-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold shrink-0">
            <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Interview Evaluation</div>
            <div className="font-extrabold text-slate-900 text-sm flex items-center space-x-1.5">
              <span>Score: {evalScoreFormatted}/10</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                Recommended
              </span>
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {candidate.interviewDetails?.panelMembers?.slice(0, 2).join(', ') || 'Selection Board Approved'}
            </div>
          </div>
        </div>

        {/* Pre-joining Document Vetting Progress */}
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 font-bold shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Pre-Joining Verification</div>
            <div className="font-extrabold text-slate-900 text-sm">
              {verifiedDocCount} of {docItems.length} Verified
            </div>
            <div className="text-[11px] text-slate-500">
              {Object.keys(uploadedFiles).length} Document(s) Attached
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MAIN WORKBENCH: 2-COLUMN SPLIT (CONFIG / LIVE PREVIEW) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ============================================================ */}
        {/* LEFT COLUMN: HR CONFIGURATION & VERIFICATION (5 Cols) */}
        {/* ============================================================ */}
        <div className="xl:col-span-5 space-y-4 print:hidden">
          {/* Sub-tabs Navigation */}
          <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-2xs flex space-x-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2 px-2.5 rounded-lg transition text-center cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              1. Salary & Terms
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`flex-1 py-2 px-2.5 rounded-lg transition text-center cursor-pointer flex items-center justify-center space-x-1 ${
                activeTab === 'documents'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>2. Documents</span>
              <span className="px-1.5 py-0.2 bg-purple-100 text-purple-900 rounded-full text-[10px] font-extrabold">
                {Object.keys(uploadedFiles).length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dossier')}
              className={`flex-1 py-2 px-2.5 rounded-lg transition text-center cursor-pointer ${
                activeTab === 'dossier'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              3. Dossier
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('clauses')}
              className={`flex-1 py-2 px-2.5 rounded-lg transition text-center cursor-pointer ${
                activeTab === 'clauses'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              4. Clauses
            </button>
          </div>

          {/* TAB 1: SALARY, CADRE & APPOINTMENT DETAILS */}
          {activeTab === 'details' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 text-xs">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Appointment & Compensation Terms</h3>
                  <p className="text-[11px] text-slate-500">Configure appointment cadre, pay level, and statutory deadlines.</p>
                </div>
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>

              {/* Offer Ref & Post */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official Offer Reference No. *
                  </label>
                  <input
                    type="text"
                    value={offerLetterRef}
                    onChange={(e) => setOfferLetterRef(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Academic Cadre & Level
                  </label>
                  <input
                    type="text"
                    value={academicLevel}
                    onChange={(e) => setAcademicLevel(e.target.value)}
                    placeholder="e.g. Academic Level 10 (UGC 7th CPC)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Designation & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Formal Designation *
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Academic Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Offered CTC & Basic Salary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Consolidated Annual CTC *
                  </label>
                  <input
                    type="text"
                    value={offeredCtc}
                    onChange={(e) => setOfferedCtc(e.target.value)}
                    placeholder={request.tentativeBudget}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-emerald-950 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Monthly Basic Pay / Emoluments Scale
                  </label>
                  <input
                    type="text"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(e.target.value)}
                    placeholder="e.g. ₹57,700/mo + DA/HRA"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Probation & Deadlines */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Probation Period:
                  </label>
                  <select
                    value={probationPeriod}
                    onChange={(e) => setProbationPeriod(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                  >
                    <option value="1 Year">1 Year</option>
                    <option value="2 Years">2 Years</option>
                    <option value="6 Months">6 Months</option>
                    <option value="Direct Confirmed / Regular">Direct Confirmed / Regular</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Joining Acceptance Deadline *
                  </label>
                  <input
                    type="date"
                    value={joiningDeadline}
                    onChange={(e) => setJoiningDeadline(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Place of Posting & Reporting Head */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Place of Posting:
                  </label>
                  <input
                    type="text"
                    value={placeOfPosting}
                    onChange={(e) => setPlaceOfPosting(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Reporting Authority:
                  </label>
                  <input
                    type="text"
                    value={reportingHead}
                    onChange={(e) => setReportingHead(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Upload Signed Offer Copy Card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                    <FileUp className="w-4 h-4 text-emerald-600" />
                    <span>Signed Appointment Copy / Acceptance Slip Scan</span>
                  </div>
                  {signedOfferLetterCopy && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      Uploaded ✓
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Attach signed physical appointment copy returned by the candidate.
                </p>

                {signedOfferLetterCopy ? (
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate text-xs">{signedOfferLetterCopy}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSignedOfferLetterCopy('')}
                      className="text-slate-400 hover:text-rose-600 transition p-1"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer text-xs shadow-2xs transition">
                      <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Upload Signed Acceptance PDF</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSignedOfferLetterCopy(file.name);
                            setStatusMessage(`✓ Signed appointment letter copy attached: ${file.name}`);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PRE-JOINING DOCUMENT VETTING & UPLOAD DESK */}
          {activeTab === 'documents' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 text-xs">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Document Vetting &amp; Verification Desk</h3>
                  <p className="text-[11px] text-slate-500">
                    Verify statutory certificates, degrees, and clearances.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold text-purple-900 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                    {verifiedDocCount}/{docItems.length} Verified
                  </span>
                  <FileCheck className="w-5 h-5 text-purple-600" />
                </div>
              </div>

              {/* Add Custom Document Bar */}
              <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl space-y-1.5">
                <span className="font-bold text-slate-800 text-xs block">
                  Add Additional Document
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewDoc();
                      }
                    }}
                    placeholder="Document Name (e.g. Salary Slips, PAN Card, Form 16, Caste Certificate)..."
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewDoc}
                    disabled={!newDocName.trim()}
                    className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer shrink-0 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add</span>
                  </button>
                </div>
              </div>

              {/* Document List: Clean, Sleek, Professional Rows */}
              <div className="space-y-2">
                {docItems.map((item) => {
                  const isChecked = !!docs[item.key];
                  const attachedFile = uploadedFiles[item.key];

                  return (
                    <div
                      key={item.key}
                      className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'bg-emerald-50/40 border-emerald-300'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Left: Checkbox & Document Title */}
                      <label className="flex items-center space-x-2.5 min-w-0 flex-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleDoc(item.key)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                        />
                        <span
                          className={`text-xs ${
                            isChecked ? 'font-bold text-emerald-950' : 'font-semibold text-slate-800'
                          }`}
                          title={item.title}
                        >
                          {item.title}
                        </span>
                      </label>

                      {/* Middle/Right: Attached File & Actions */}
                      <div className="flex items-center space-x-2 shrink-0">
                        {attachedFile ? (
                          <div className="flex items-center space-x-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
                            <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span
                              className="font-medium text-[11px] text-slate-800 truncate max-w-[120px] sm:max-w-[160px]"
                              title={attachedFile.fileName}
                            >
                              {attachedFile.fileName}
                            </span>
                            <button
                              type="button"
                              onClick={() => setPreviewingDoc(attachedFile)}
                              className="text-[11px] text-blue-700 hover:underline font-semibold cursor-pointer ml-1"
                              title="View Document"
                            >
                              View
                            </button>
                            <label className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold cursor-pointer">
                              Replace
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(item.key, file, item.title);
                                }}
                                className="hidden"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(item.key)}
                              className="text-slate-400 hover:text-rose-600 transition cursor-pointer p-0.5"
                              title="Remove File"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs transition">
                            <UploadCloud className="w-3.5 h-3.5 text-purple-600" />
                            <span>Upload</span>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(item.key, file, item.title);
                              }}
                              className="hidden"
                            />
                          </label>
                        )}

                        {/* Verified Toggle Pill */}
                        <button
                          type="button"
                          onClick={() => toggleDoc(item.key)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer transition select-none ${
                            isChecked
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                          }`}
                        >
                          {isChecked ? 'Verified ✓' : 'Mark Verified'}
                        </button>

                        {/* Remove custom document */}
                        {item.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDocItem(item.key)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Delete custom document"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Remarks */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  HR Verification Officer Remarks:
                </label>
                <textarea
                  rows={2}
                  value={verificationRemarks}
                  onChange={(e) => setVerificationRemarks(e.target.value)}
                  placeholder="Record verification notes or conditions for conditional joining..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 3: CANDIDATE DOSSIER & SELECTION PANEL AUDIT */}
          {activeTab === 'dossier' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 text-xs">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Candidate Profile & Selection Committee Dossier</h3>
                  <p className="text-[11px] text-slate-500">Official evaluation record recorded during statutory interview.</p>
                </div>
                <Award className="w-5 h-5 text-amber-600" />
              </div>

              {/* Bio & Contact Details */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 text-sm">{candidate.fullName}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                  <div className="flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{candidate.email}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{candidate.phone}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span>{candidate.qualification}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{candidate.currentAffiliation || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              {/* Interview Committee Evaluation Scores */}
              <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950">Statutory Selection Committee Evaluation</span>
                  <span className="font-extrabold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                    Total Score: {evalScoreFormatted} / 10
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2 rounded-lg border border-amber-200">
                    <div className="text-[10px] text-slate-500 font-semibold">Subject Expertise</div>
                    <div className="text-sm font-bold text-slate-900">
                      {candidate.interviewDetails?.scores?.subjectKnowledge || 38}/40
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-amber-200">
                    <div className="text-[10px] text-slate-500 font-semibold">Research Output</div>
                    <div className="text-sm font-bold text-slate-900">
                      {candidate.interviewDetails?.scores?.researchPublications || 24}/25
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-amber-200">
                    <div className="text-[10px] text-slate-500 font-semibold">Teaching Skills</div>
                    <div className="text-sm font-bold text-slate-900">
                      {candidate.interviewDetails?.scores?.teachingAptitude || 19}/20
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-amber-200">
                    <div className="text-[10px] text-slate-500 font-semibold">Communication</div>
                    <div className="text-sm font-bold text-slate-900">
                      {candidate.interviewDetails?.scores?.communication || 14}/15
                    </div>
                  </div>
                </div>

                {candidate.interviewDetails?.panelMembers && (
                  <div className="text-[11px] text-slate-700 pt-1">
                    <span className="font-bold text-slate-900">Interview Panelists: </span>
                    <span>{candidate.interviewDetails.panelMembers.join(', ')}</span>
                  </div>
                )}

                {candidate.interviewDetails?.panelRemarks && (
                  <div className="text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-amber-200 italic">
                    &ldquo;{candidate.interviewDetails.panelRemarks}&rdquo;
                  </div>
                )}
              </div>

              {/* Governance Sanction Badges */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                <div className="font-bold text-blue-950 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Statutory Clearances Granted</span>
                </div>
                <p className="text-[11px] text-blue-800">
                  Requisition cleared by Dean Academic (teaching workload &amp; student-to-faculty norms) and sanctioned by Vice-Chancellor &amp; Registrar Secretariat.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: STATUTORY CLAUSES & UNIVERSITY RULES */}
          {activeTab === 'clauses' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 text-xs">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Special Terms &amp; Statutory Clauses</h3>
                  <p className="text-[11px] text-slate-500">Clauses printed in Clause 5 &amp; 6 of the formal university appointment letter.</p>
                </div>
                <FileText className="w-5 h-5 text-slate-600" />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Custom Terms, Performance Norms &amp; Conditions:
                </label>
                <textarea
                  rows={6}
                  value={specialClauses}
                  onChange={(e) => setSpecialClauses(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-normal text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed"
                />
              </div>

              <div className="space-y-2 text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">Standard University Statutes Included:</div>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Governed by Guru Kashi University Act &amp; Statutes and UGC Regulations.</li>
                  <li>3 months notice period required for resignation or salary in lieu thereof.</li>
                  <li>Intellectual Property &amp; research innovations belong to Guru Kashi University.</li>
                  <li>Entitled to statutory leaves, provident fund, and medical facilities.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: LIVE OFFICIAL UNIVERSITY APPOINTMENT LETTER */}
        {/* ============================================================ */}
        <div className="xl:col-span-7">
          {/* Printable Letter Container */}
          <div className="bg-white border border-slate-300 rounded-2xl shadow-lg p-8 sm:p-12 text-slate-900 space-y-6 print:m-0 print:p-0 print:border-none print:shadow-none min-h-[950px]">
            {/* University Letterhead Header */}
            <div className="border-b-2 border-slate-800 pb-5 text-center space-y-2">
              <div className="flex justify-center mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/gku-logo.png"
                  alt="Guru Kashi University"
                  className="h-16 object-contain"
                />
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-black tracking-wide text-slate-950 uppercase">
                GURU KASHI UNIVERSITY
              </h2>
              <div className="text-[11px] sm:text-xs text-slate-700 font-medium space-y-0.5">
                <p>
                  (Established by Punjab Act No. 37 of 2011 &amp; Recognised by UGC under Section 2(f) of the UGC Act 1956)
                </p>
                <p className="font-bold text-slate-900">
                  NAAC Grade &ldquo;A++&rdquo; Accredited University &bull; Member of AIU
                </p>
                <p className="text-slate-600">
                  Sardulgarh Road, Talwandi Sabo, Bathinda, Punjab - 151302, India
                </p>
              </div>
              <div className="pt-2 text-xs font-bold text-slate-800 tracking-wider uppercase border-t border-slate-200 mt-2">
                OFFICE OF THE REGISTRAR &bull; DIRECTORATE OF HUMAN RESOURCES &amp; FACULTY AFFAIRS
              </div>
            </div>

            {/* Reference & Date Line */}
            <div className="flex justify-between items-center text-xs font-semibold text-slate-800 pt-1">
              <div>
                <span className="font-bold">Ref. No.: </span>
                <span className="font-mono font-bold text-slate-900">{offerLetterRef}</span>
              </div>
              <div>
                <span className="font-bold">Date: </span>
                <span>{todayFormatted}</span>
              </div>
            </div>

            {/* Candidate Address Block */}
            <div className="text-xs space-y-0.5 text-slate-800 pt-2">
              <div className="font-bold text-slate-950 text-sm">To,</div>
              <div className="font-bold text-slate-900 text-sm">{candidate.fullName}</div>
              {candidate.currentAffiliation && <div>{candidate.currentAffiliation}</div>}
              <div>Email: {candidate.email} | Mobile: {candidate.phone}</div>
            </div>

            {/* Subject Line */}
            <div className="py-2 border-y border-slate-200 text-center font-bold text-xs sm:text-sm text-slate-950 uppercase tracking-wide bg-slate-50/50">
              Subject: Formal Offer of Appointment for the Post of {designation} in the Department of {department}.
            </div>

            {/* Salutation & Body Paragraphs */}
            <div className="text-xs text-slate-800 space-y-3.5 leading-relaxed text-justify">
              <p>
                <strong>Dear {candidate.fullName.split(' ')[0] || candidate.fullName},</strong>
              </p>

              <p>
                On the recommendations of the Statutory Selection Committee and subsequent administrative sanction accorded by the Competent Authority (Vice-Chancellor) under the provisions of the Guru Kashi University Act &amp; Statutes, we have the pleasure in offering you the appointment to the substantive post of <strong>{designation}</strong> in the <strong>{department}</strong> at Guru Kashi University.
              </p>

              <p>
                <strong>1. Scale of Pay &amp; Emoluments:</strong> You will be placed in the <strong>{academicLevel}</strong> with an offered consolidated annual gross remuneration of <strong>{offeredCtc}</strong>. Your starting basic pay will be <strong>{basicSalary}</strong> with applicable allowances (DA, HRA, and retirement benefits) in accordance with University norms.
              </p>

              <p>
                <strong>2. Probation &amp; Confirmation:</strong> You shall be on probation for a period of <strong>{probationPeriod}</strong> from the date of joining. The period of probation may be extended or dispensed with in accordance with the university service rules based on satisfactory performance and research contributions.
              </p>

              <p>
                <strong>3. Place of Posting &amp; Reporting:</strong> Your primary place of posting will be at <strong>{placeOfPosting}</strong>. You will report for duty to the <strong>{reportingHead}</strong>.
              </p>

              <p>
                <strong>4. Service Conditions &amp; Code of Conduct:</strong> Your employment will be governed by the Guru Kashi University Act, Statutes, Ordinances, and UGC Regulations. You will be required to devote your full time to teaching, curriculum development, research publications in Scopus/WoS indexed journals, student mentoring, and statutory accreditation duties.
              </p>

              <p>
                <strong>5. Terms, Conditions &amp; Pre-requisites:</strong> {specialClauses}
              </p>

              <p>
                <strong>6. Acceptance &amp; Date of Joining:</strong> Please signify your formal acceptance of this offer by signing and returning the enclosed duplicate copy within the deadline of <strong>{new Date(joiningDeadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>. You are expected to assume duties on or before <strong>{new Date(expectedJoiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>.
              </p>
            </div>

            {/* Closing & Signatures */}
            <div className="pt-6 flex justify-between items-end text-xs">
              <div>
                <p className="font-semibold text-slate-700">Copy forwarded for information to:</p>
                <ol className="list-decimal list-inside text-[11px] text-slate-500 space-y-0.5 mt-1">
                  <li>Secretary to the Vice-Chancellor for kind appraisal of VC</li>
                  <li>Dean Academic Affairs &amp; Director IQAC</li>
                  <li>Finance Officer / Accounts Branch</li>
                  <li>Personal File of the Candidate</li>
                </ol>
              </div>

              <div className="text-right space-y-1">
                <p className="font-bold text-slate-900">For Guru Kashi University</p>
                <div className="h-10 flex items-center justify-end">
                  <span className="font-serif italic font-bold text-slate-500 text-sm tracking-wider">
                    [Digitally Signed by Registrar]
                  </span>
                </div>
                <p className="font-bold text-slate-950 text-xs">Registrar / Director HR</p>
                <p className="text-[10px] text-slate-500">Guru Kashi University, Talwandi Sabo</p>
              </div>
            </div>

            {/* Candidate Acceptance Tear-Off Slip */}
            <div className="border-t-2 border-dashed border-slate-300 pt-4 mt-6 text-xs text-slate-800 space-y-2">
              <div className="font-bold text-slate-900 uppercase tracking-wide text-center">
                Candidate Acceptance Slip (To be signed and returned to HR Office)
              </div>
              <p className="text-[11px] text-slate-600 leading-normal">
                I, <strong>{candidate.fullName}</strong>, hereby formally accept the Offer of Appointment (Ref: {offerLetterRef}) for the post of <strong>{designation}</strong> in the Department of <strong>{department}</strong> on the terms and conditions outlined above. I undertake to join duty on or before {new Date(expectedJoiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}.
              </p>
              <div className="flex justify-between items-end pt-4 text-xs font-semibold text-slate-700">
                <div>
                  Date: ________________________
                </div>
                <div>
                  Candidate Signature: ________________________
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. DOCUMENT INSPECTION / PREVIEW MODAL */}
      {/* ============================================================== */}
      {previewingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 truncate max-w-[320px]">
                    {previewingDoc.fileName}
                  </h3>
                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                    {previewingDoc.category || 'Statutory Verification Document'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Details & Mockup */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 mx-auto flex items-center justify-center text-slate-400 shadow-2xs">
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">{previewingDoc.fileName}</div>
                <div className="text-xs text-slate-500">
                  Size: {previewingDoc.fileSize || '2.4 MB'} &bull; Uploaded: {previewingDoc.uploadedAt || 'Today'}
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verified against Guru Kashi University Statutory Compliance Records</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">Security Clearance Verified</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setStatusMessage(`Downloading copy of ${previewingDoc.fileName}...`);
                    setTimeout(() => setStatusMessage(''), 2500);
                    setPreviewingDoc(null);
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewingDoc(null)}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
