'use client';

import React, { useState, useRef } from 'react';
import {
  IHiringRequest,
  Candidate
} from '@/lib/types';
import {
  ArrowLeft,
  Printer,
  FileText,
  Building2,
  DollarSign,
  Calendar,
  Mail,
  AlertCircle,
  Check,
  Send,
  Save,
  UploadCloud,
  FileUp,
  Eye,
  Trash2,
  X,
  Edit3,
  RotateCcw,
  Paperclip,
  CheckCircle2,
  FileCheck,
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
  // Mode: 1 = Generate Interactive Letterhead, 2 = Upload Pre-Signed PDF
  const [offerMode, setOfferMode] = useState<'generate' | 'upload'>('generate');

  // Inline Direct Letter Editing Mode
  const [isEditMode, setIsEditMode] = useState(false);

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

  // Uploaded Pre-Prepared PDF state (Mode 2)
  const [uploadedPdfFile, setUploadedPdfFile] = useState<File | null>(null);
  const [uploadedPdfFileName, setUploadedPdfFileName] = useState<string>(
    candidate.joiningDetails?.offerLetterFile || ''
  );
  const [uploadedPdfBase64, setUploadedPdfBase64] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable Letter Content Sections
  const [letterUniversityStatutory, setLetterUniversityStatutory] = useState(
    '(Established by Punjab Act No. 37 of 2011 & Recognised by UGC under Section 2(f) of the UGC Act 1956)'
  );
  const [letterUniversityNaac, setLetterUniversityNaac] = useState(
    'NAAC Grade "A++" Accredited University • Member of AIU'
  );
  const [letterOfficeTitle, setLetterOfficeTitle] = useState(
    'OFFICE OF THE REGISTRAR • DIRECTORATE OF HUMAN RESOURCES & FACULTY AFFAIRS'
  );
  const [letterUniversitySub, setLetterUniversitySub] = useState(
    'Sardulgarh Road, Talwandi Sabo, Bathinda, Punjab - 151302, India'
  );
  const [letterDate, setLetterDate] = useState(
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  );
  const [letterRecipientPrefix, setLetterRecipientPrefix] = useState('To,');
  const [letterRecipientName, setLetterRecipientName] = useState(candidate.fullName);
  const [letterRecipientAffiliation, setLetterRecipientAffiliation] = useState(
    candidate.currentAffiliation || ''
  );
  const [letterRecipientContact, setLetterRecipientContact] = useState(
    `Email: ${candidate.email} | Mobile: ${candidate.phone}`
  );
  const [letterSubject, setLetterSubject] = useState(
    `Subject: Formal Offer of Appointment for the Post of ${request.postTitle} in the Department of ${request.department}.`
  );
  const [letterSalutation, setLetterSalutation] = useState(
    `Dear ${candidate.fullName},`
  );
  const [letterIntro, setLetterIntro] = useState(
    `On the recommendations of the Statutory Selection Committee and subsequent administrative sanction accorded by the Competent Authority (Vice-Chancellor) under the provisions of the Guru Kashi University Act & Statutes, we have the pleasure in offering you the appointment to the substantive post of ${request.postTitle} in the ${request.department} at Guru Kashi University.`
  );
  const [letterClausePay, setLetterClausePay] = useState(
    `You will be placed in the ${academicLevel} with an offered consolidated annual gross remuneration of ${offeredCtc}. Your starting basic pay will be ${basicSalary} with applicable allowances (DA, HRA, and retirement benefits) in accordance with University norms.`
  );
  const [letterClauseProbation, setLetterClauseProbation] = useState(
    `You shall be on probation for a period of ${probationPeriod} from the date of joining. The period of probation may be extended or dispensed with in accordance with the university service rules based on satisfactory performance and research contributions.`
  );
  const [letterClausePosting, setLetterClausePosting] = useState(
    `Your primary place of posting will be at ${placeOfPosting}. You will report for duty to the ${reportingHead}.`
  );
  const [letterClauseConduct, setLetterClauseConduct] = useState(
    `Your employment will be governed by the Guru Kashi University Act, Statutes, Ordinances, and UGC Regulations. You will be required to devote your full time to teaching, curriculum development, research publications in Scopus/WoS indexed journals, student mentoring, and statutory accreditation duties.`
  );
  const [letterClauseSpecial, setLetterClauseSpecial] = useState(
    candidate.joiningDetails?.offerRemarks ||
      'Appointment is subject to submission of original educational certificates, relieving certificate from the previous employer, character verification, and medical fitness. Faculty is expected to engage in teaching, high-impact research publications, and NAAC/UGC regulatory accreditations.'
  );
  const [letterClauseAcceptance, setLetterClauseAcceptance] = useState(
    `Please signify your formal acceptance of this offer by signing and returning the duplicate copy within the deadline of ${new Date(joiningDeadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}. You are expected to assume duties on or before ${new Date(expectedJoiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}.`
  );
  const [letterCopyTo, setLetterCopyTo] = useState(
    '1. Secretary to the Vice-Chancellor for kind appraisal of VC\n2. Dean Academic Affairs & Director IQAC\n3. Finance Officer / Accounts Branch\n4. Personal File of the Candidate'
  );
  const [letterSignatoryName, setLetterSignatoryName] = useState('Registrar / Authorized Officer');
  const [letterSignatoryTitle, setLetterSignatoryTitle] = useState('Guru Kashi University, Talwandi Sabo');

  // Deletion and Custom Clause Management
  const [deletedSections, setDeletedSections] = useState<string[]>([]);
  const isDeleted = (key: string) => deletedSections.includes(key);

  const deleteSection = (key: string) => {
    setDeletedSections((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setStatusMessage('Section removed from offer letter.');
    setTimeout(() => setStatusMessage(''), 2000);
  };

  const restoreSection = (key: string) => {
    setDeletedSections((prev) => prev.filter((k) => k !== key));
    setStatusMessage('Section restored.');
    setTimeout(() => setStatusMessage(''), 2000);
  };

  const restoreAllSections = () => {
    setDeletedSections([]);
    setStatusMessage('All sections restored.');
    setTimeout(() => setStatusMessage(''), 2000);
  };

  interface CustomClause {
    id: string;
    title: string;
    content: string;
  }
  const [customClauses, setCustomClauses] = useState<CustomClause[]>([]);

  const handleAddCustomClause = () => {
    const newId = `clause_${Date.now()}`;
    const nextNum = 7 + customClauses.length;
    setCustomClauses((prev) => [
      ...prev,
      {
        id: newId,
        title: `${nextNum}. Special Condition / Covenant`,
        content: 'Specify any relocation, research grant, accommodation, or special departmental terms here.'
      }
    ]);
    setStatusMessage('New clause added. You can edit its title and text directly.');
    setTimeout(() => setStatusMessage(''), 2500);
  };

  const handleUpdateCustomClause = (id: string, field: 'title' | 'content', value: string) => {
    setCustomClauses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleDeleteCustomClause = (id: string) => {
    setCustomClauses((prev) => prev.filter((c) => c.id !== id));
    setStatusMessage('Clause deleted.');
    setTimeout(() => setStatusMessage(''), 2000);
  };

  // Section labels for easy restoration
  const sectionLabels: Record<string, string> = {
    headerStatutory: 'Statutory Act/UGC Subtitle',
    headerNaac: 'NAAC Accreditation Subtitle',
    headerAddress: 'Campus Address',
    headerDirectorate: 'Directorate / Issuing Office',
    refAndDate: 'Ref. No. & Date',
    topRecipient: 'Recipient Details',
    subject: 'Subject Line',
    salutation: 'Salutation',
    intro: 'Preamble / Selection Comm. Intro',
    pay: '1. Scale of Pay & Emoluments',
    probation: '2. Probation & Confirmation',
    posting: '3. Place of Posting',
    conduct: '4. Service Conditions & Conduct',
    special: '5. Special Terms & Prerequisites',
    acceptance: '6. Acceptance & Joining Deadline',
    copyTo: 'Copy Forwarded To List',
    signatory: 'Authorized Signatory Block'
  };

  // Save and Exit Inline Edit Mode ("blow button to update of save")
  const handleSaveAndExitEditMode = () => {
    setIsEditMode(false);
    setDraftSaved(true);
    setStatusMessage('✓ Offer Letter updated & saved successfully!');
    setTimeout(() => {
      setDraftSaved(false);
      setStatusMessage('');
    }, 3000);
  };

  // Reset to default template
  const handleResetTemplate = () => {
    setDeletedSections([]);
    setCustomClauses([]);
    setLetterUniversityStatutory('(Established by Punjab Act No. 37 of 2011 & Recognised by UGC under Section 2(f) of the UGC Act 1956)');
    setLetterUniversityNaac('NAAC Grade "A++" Accredited University • Member of AIU');
    setLetterOfficeTitle('OFFICE OF THE REGISTRAR • DIRECTORATE OF HUMAN RESOURCES & FACULTY AFFAIRS');
    setLetterUniversitySub('Sardulgarh Road, Talwandi Sabo, Bathinda, Punjab - 151302, India');
    setLetterDate(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }));
    setLetterRecipientPrefix('To,');
    setLetterRecipientName(candidate.fullName);
    setLetterRecipientAffiliation(candidate.currentAffiliation || '');
    setLetterRecipientContact(`Email: ${candidate.email} | Mobile: ${candidate.phone}`);
    setLetterSubject(`Subject: Formal Offer of Appointment for the Post of ${designation} in the Department of ${department}.`);
    setLetterSalutation(`Dear ${candidate.fullName},`);
    setLetterIntro(`On the recommendations of the Statutory Selection Committee and subsequent administrative sanction accorded by the Competent Authority (Vice-Chancellor) under the provisions of the Guru Kashi University Act & Statutes, we have the pleasure in offering you the appointment to the substantive post of ${designation} in the ${department} at Guru Kashi University.`);
    setLetterClausePay(`You will be placed in the ${academicLevel} with an offered consolidated annual gross remuneration of ${offeredCtc}. Your starting basic pay will be ${basicSalary} with applicable allowances (DA, HRA, and retirement benefits) in accordance with University norms.`);
    setLetterClauseProbation(`You shall be on probation for a period of ${probationPeriod} from the date of joining. The period of probation may be extended or dispensed with in accordance with the university service rules based on satisfactory performance and research contributions.`);
    setLetterClausePosting(`Your primary place of posting will be at ${placeOfPosting}. You will report for duty to the ${reportingHead}.`);
    setLetterClauseConduct(`Your employment will be governed by the Guru Kashi University Act, Statutes, Ordinances, and UGC Regulations. You will be required to devote your full time to teaching, curriculum development, research publications in Scopus/WoS indexed journals, student mentoring, and statutory accreditation duties.`);
    setLetterClauseSpecial('Appointment is subject to submission of original educational certificates, relieving certificate from the previous employer, character verification, and medical fitness. Faculty is expected to engage in teaching, high-impact research publications, and NAAC/UGC regulatory accreditations.');
    setLetterClauseAcceptance(`Please signify your formal acceptance of this offer by signing and returning the duplicate copy within the deadline of ${new Date(joiningDeadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}. You are expected to assume duties on or before ${new Date(expectedJoiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}.`);
    setLetterCopyTo('1. Secretary to the Vice-Chancellor for kind appraisal of VC\n2. Dean Academic Affairs & Director IQAC\n3. Finance Officer / Accounts Branch\n4. Personal File of the Candidate');
    setLetterSignatoryName('Registrar / Authorized Officer');
    setLetterSignatoryTitle('Guru Kashi University, Talwandi Sabo');
    setStatusMessage('Template reset to university standard format.');
    setTimeout(() => setStatusMessage(''), 2500);
  };

  // Email Dispatch & Multi-Desk State
  const [sendOfferEmail, setSendOfferEmail] = useState(true);
  const [attachOfferLetterPdf, setAttachOfferLetterPdf] = useState(true);
  const [selectedDesk, setSelectedDesk] = useState<'central_hr' | 'central_hrm' | 'custom'>('central_hr');
  const [senderEmail, setSenderEmail] = useState('hr@gku.ac.in');
  const [senderName, setSenderName] = useState('Directorate of HR & Faculty Affairs');
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [replyToEmail, setReplyToEmail] = useState('hr@gku.ac.in');
  const [ccEmails, setCcEmails] = useState('vc@gku.ac.in, registrar@gku.ac.in');
  const [domainError, setDomainError] = useState('');

  // UI state
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);

  // Validate custom domain strictly for @gku.ac.in
  const handleCustomEmailChange = (val: string) => {
    setCustomEmail(val);
    setDomainError('');
    if (val.trim() && !val.trim().toLowerCase().endsWith('@gku.ac.in')) {
      setDomainError('Only official institutional email addresses (@gku.ac.in) are permitted. External domains (e.g. @gmail.com) are blocked.');
    } else {
      setSenderEmail(val.trim());
      setReplyToEmail(val.trim());
    }
  };

  // Handle PDF upload in Mode 2
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please upload a valid PDF document (.pdf)');
      return;
    }

    setUploadedPdfFile(file);
    setUploadedPdfFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedPdfBase64(reader.result as string);
      setStatusMessage(`✓ Official Offer PDF "${file.name}" attached successfully!`);
      setTimeout(() => setStatusMessage(''), 3000);
    };
    reader.readAsDataURL(file);
  };

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  // Save Draft Action
  const handleSaveDraft = () => {
    setDraftSaved(true);
    setStatusMessage('Draft configurations and custom letter terms saved.');
    setTimeout(() => {
      setDraftSaved(false);
      setStatusMessage('');
    }, 2500);
  };

  // Issue Formal Offer Action
  const handleIssueFormalOffer = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    setStatusMessage('');

    if (selectedDesk === 'custom') {
      if (!customEmail.trim() || !customEmail.trim().toLowerCase().endsWith('@gku.ac.in')) {
        setErrorMessage('Please enter a valid official institutional email ending with @gku.ac.in');
        setIsSubmitting(false);
        return;
      }
    }

    if (offerMode === 'upload' && !uploadedPdfFileName) {
      setErrorMessage('Please upload the official signed appointment letter PDF before issuing.');
      setIsSubmitting(false);
      return;
    }

    try {
      const effectiveSender = selectedDesk === 'custom' ? customEmail.trim() : senderEmail;
      const effectiveName = selectedDesk === 'custom' ? (customName.trim() || 'Official University Desk') : senderName;

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
          offerRemarks: letterClauseSpecial.trim(),
          offerLetterFile: offerMode === 'upload' ? uploadedPdfFileName : `Appointment_Offer_${candidate.fullName.replace(/\s+/g, '_')}_Formal.pdf`,
          letterMode: offerMode,
          uploadedOfferFileName: uploadedPdfFileName,
          sendOfferEmail,
          attachOfferLetterPdf,
          pdfAttachmentBase64: uploadedPdfBase64 || undefined,
          pdfAttachmentFileName: uploadedPdfFileName || undefined,
          selectedDesk,
          senderEmail: effectiveSender,
          senderName: effectiveName,
          replyToEmail: replyToEmail || effectiveSender,
          ccList: ccEmails.split(',').map((s) => s.trim()).filter(Boolean),
          actorName: effectiveName
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to issue formal university appointment offer');
      }

      setStatusMessage(
        `✓ Formal University Appointment Offer (${offerLetterRef}) released to ${candidate.fullName}!${sendOfferEmail ? ' (Dispatched from ' + effectiveSender + ')' : ''}`
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

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ============================================================== */}
      {/* 1. TOP HEADER & BREADCRUMB BAR (Hidden during Print) */}
      {/* ============================================================== */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition flex items-center justify-center cursor-pointer shadow-2xs"
            title="Return to Shortlisted Candidates"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-semibold">
              <span>Recruitment</span>
              <span>/</span>
              <span className="text-emerald-700 font-bold">{request.requestId}</span>
              <span>/</span>
              <span>Appointment Offer Workbench</span>
            </div>
            <div className="flex items-center space-x-2.5 mt-0.5">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Official Appointment Offer Desk
              </h1>
              <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                {candidate.fullName} • {request.postTitle}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsPreviewModalOpen(true)}
            className="px-3 py-1.5 border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-purple-600" />
            <span>Preview Email</span>
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>{draftSaved ? 'Saved!' : 'Save Draft'}</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print A4</span>
          </button>
          <button
            type="button"
            onClick={handleIssueFormalOffer}
            disabled={isSubmitting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition flex items-center space-x-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Dispatching...' : 'Issue & Release Offer'}</span>
          </button>
        </div>
      </div>

      {/* Status & Error Alerts */}
      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in print:hidden">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in print:hidden">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. MODE SELECTOR (Generate Online vs Upload Pre-Signed PDF) */}
      {/* ============================================================== */}
      <div className="bg-slate-100 p-1 rounded-xl flex items-center max-w-md print:hidden text-xs font-bold border border-slate-200">
        <button
          type="button"
          onClick={() => setOfferMode('generate')}
          className={`flex-1 py-2 px-3 rounded-lg transition cursor-pointer flex items-center justify-center space-x-1.5 ${
            offerMode === 'generate'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Generate Formal Letterhead</span>
        </button>

        <button
          type="button"
          onClick={() => setOfferMode('upload')}
          className={`flex-1 py-2 px-3 rounded-lg transition cursor-pointer flex items-center justify-center space-x-1.5 ${
            offerMode === 'upload'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UploadCloud className="w-4 h-4 text-purple-600" />
          <span>Upload Pre-Signed PDF</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 3. MAIN WORKBENCH LAYOUT (2 COLUMNS) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================ */}
        {/* LEFT COLUMN: PARAMETERS & EMAIL ROUTING DRAWER */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 space-y-4 print:hidden text-xs">
          {/* Card: Core Appointment Parameters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Essential Appointment Terms</h3>
                <p className="text-[11px] text-slate-500">Cadre, pay scale, and statutory joining timeline.</p>
              </div>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Offer Ref No. *</label>
                <input
                  type="text"
                  value={offerLetterRef}
                  onChange={(e) => setOfferLetterRef(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Academic Cadre</label>
                <input
                  type="text"
                  value={academicLevel}
                  onChange={(e) => setAcademicLevel(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Offered CTC *</label>
                <input
                  type="text"
                  value={offeredCtc}
                  onChange={(e) => setOfferedCtc(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Basic Salary Matrix</label>
                <input
                  type="text"
                  value={basicSalary}
                  onChange={(e) => setBasicSalary(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Probation Period</label>
                <select
                  value={probationPeriod}
                  onChange={(e) => setProbationPeriod(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs cursor-pointer"
                >
                  <option value="1 Year">1 Year</option>
                  <option value="2 Years">2 Years</option>
                  <option value="6 Months">6 Months</option>
                  <option value="Direct Confirmed / Regular">Direct Confirmed / Regular</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Joining Deadline *</label>
                <input
                  type="date"
                  value={joiningDeadline}
                  onChange={(e) => setJoiningDeadline(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  required
                />
              </div>
            </div>
          </div>

          {/* Card: Mode 2 Upload Attachment Box */}
          {offerMode === 'upload' && (
            <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
                <div className="flex items-center space-x-1.5 font-bold text-purple-950 text-xs">
                  <UploadCloud className="w-4 h-4 text-purple-600" />
                  <span>Attach Official Signed PDF Letter</span>
                </div>
                {uploadedPdfFileName && (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    ✓ Attached
                  </span>
                )}
              </div>

              <p className="text-[11px] text-purple-900/80">
                If the appointment letter was signed physically on paper or pre-generated outside the portal, attach the scanned PDF here.
              </p>

              {uploadedPdfFileName ? (
                <div className="bg-white p-3 rounded-xl border border-purple-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-purple-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 truncate text-xs">{uploadedPdfFileName}</div>
                      <div className="text-[10px] text-slate-400">Official Appointment Attachment</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedPdfFile(null);
                      setUploadedPdfFileName('');
                      setUploadedPdfBase64('');
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-xl bg-white text-center cursor-pointer transition flex flex-col items-center justify-center space-y-1.5"
                  >
                    <FileUp className="w-6 h-6 text-purple-600" />
                    <span className="font-bold text-purple-950 text-xs">Click or Drag &amp; Drop Official PDF Letter</span>
                    <span className="text-[10px] text-slate-400">PDF document format only</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Card: Email Dispatch & Mailbox Desk (No Hardcoded Nancy!) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Outgoing Email Dispatch</h3>
              </div>
              <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={sendOfferEmail}
                  onChange={(e) => setSendOfferEmail(e.target.checked)}
                  className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />
                <span>Email Candidate</span>
              </label>
            </div>

            {sendOfferEmail && (
              <div className="space-y-3">
                {/* PDF Attachment Checkbox */}
                <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Paperclip className="w-4 h-4 text-blue-600" />
                    <label htmlFor="attachOfferLetterPdf" className="text-xs font-bold text-blue-950 cursor-pointer">
                      Attach Offer Letter PDF in Candidate Email
                    </label>
                  </div>
                  <input
                    type="checkbox"
                    id="attachOfferLetterPdf"
                    checked={attachOfferLetterPdf}
                    onChange={(e) => setAttachOfferLetterPdf(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5 text-xs">
                    Select University Dispatch Mailbox:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Desk 1: HR Directorate */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDesk('central_hr');
                        setSenderEmail('hr@gku.ac.in');
                        setSenderName('Directorate of HR & Faculty Affairs');
                        setReplyToEmail('hr@gku.ac.in');
                        setDomainError('');
                      }}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        selectedDesk === 'central_hr'
                          ? 'bg-emerald-50/50 border-emerald-600 ring-1 ring-emerald-500 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-slate-900 text-xs">🏢 HR Directorate</div>
                      <div className="font-mono text-[11px] text-slate-600 mt-0.5 truncate">hr@gku.ac.in</div>
                      <div className="text-[10px] text-slate-400 mt-1">General Faculty Desk</div>
                    </button>

                    {/* Desk 2: Recruitment Portal */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDesk('central_hrm');
                        setSenderEmail('hrm@gku.ac.in');
                        setSenderName('GKU Talent Acquisition Desk');
                        setReplyToEmail('hrm@gku.ac.in');
                        setDomainError('');
                      }}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        selectedDesk === 'central_hrm'
                          ? 'bg-blue-50/50 border-blue-600 ring-1 ring-blue-500 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-slate-900 text-xs">🌐 Portal Desk</div>
                      <div className="font-mono text-[11px] text-slate-600 mt-0.5 truncate">hrm@gku.ac.in</div>
                      <div className="text-[10px] text-slate-400 mt-1">Recruitment Desk</div>
                    </button>

                    {/* Desk 3: Custom Officer Mailbox */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDesk('custom');
                        setDomainError('');
                      }}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        selectedDesk === 'custom'
                          ? 'bg-purple-50/50 border-purple-600 ring-1 ring-purple-500 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-slate-900 text-xs">👤 Custom Officer</div>
                      <div className="font-mono text-[11px] text-purple-700 mt-0.5">@gku.ac.in Mailbox</div>
                      <div className="text-[10px] text-slate-400 mt-1">Officer Desk</div>
                    </button>
                  </div>
                </div>

                {/* Custom Officer Fields */}
                {selectedDesk === 'custom' && (
                  <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl space-y-2.5 animate-in fade-in">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-semibold text-slate-700 text-xs">
                          Officer Institutional Email: <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-1.5 py-0.2 rounded">
                          @gku.ac.in only
                        </span>
                      </div>
                      <input
                        type="email"
                        value={customEmail}
                        onChange={(e) => handleCustomEmailChange(e.target.value)}
                        placeholder="e.g. officer@gku.ac.in"
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                      {domainError && (
                        <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{domainError}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 text-xs">
                        Officer Name &amp; Designation:
                      </label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => {
                          setCustomName(e.target.value);
                          setSenderName(e.target.value.trim());
                        }}
                        placeholder="e.g. Dr. Harpreet Singh, Registrar"
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Candidate Routing & CC */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                      Candidate Reply-To:
                    </label>
                    <input
                      type="email"
                      value={replyToEmail}
                      onChange={(e) => setReplyToEmail(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                      CC Officials (comma-separated):
                    </label>
                    <input
                      type="text"
                      value={ccEmails}
                      onChange={(e) => setCcEmails(e.target.value)}
                      placeholder="vc@gku.ac.in, registrar@gku.ac.in"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-1 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Recipient: <strong className="font-mono text-slate-800">{candidate.email}</strong></span>
                  <button
                    type="button"
                    onClick={() => setIsPreviewModalOpen(true)}
                    className="text-blue-700 hover:text-blue-900 font-bold hover:underline cursor-pointer"
                  >
                    View email preview &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: 100% EDITABLE LIVE LETTERHEAD / PDF PREVIEW */}
        {/* ============================================================ */}
        <div className="lg:col-span-7">
          {offerMode === 'generate' ? (
            /* MODE 1: OFFICIAL A4 LETTERHEAD (WITH INLINE EDITING) */
            <div className="bg-white border border-slate-300 rounded-2xl shadow-lg p-6 sm:p-10 text-slate-900 space-y-5 print:m-0 print:p-0 print:border-none print:shadow-none print:min-h-0 min-h-[900px]">
              {/* Toolbar above letter */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-700">Official A4 Letterhead</span>
                  <span className="text-[10px] text-slate-400 font-mono">210mm × 297mm</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                      isEditMode
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditMode ? 'Editing Mode (Active)' : 'Edit Letter Directly'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetTemplate}
                    className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition cursor-pointer"
                    title="Reset to standard university clauses"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {isEditMode && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-medium flex items-center space-x-2 print:hidden">
                  <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Inline Edit Mode is active. Click and edit any section, paragraph, or clause directly in the document below.</span>
                </div>
              )}

              {/* University Letterhead Header */}
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1.5">
                <div className="flex justify-center mb-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/gku-logo.png"
                    alt="Guru Kashi University"
                    className="h-14 object-contain"
                  />
                </div>
                <h2 className="text-xl font-serif font-black tracking-wide text-slate-950 uppercase">
                  GURU KASHI UNIVERSITY
                </h2>

                {/* Statutory Act Subtitle */}
                {!isDeleted('headerStatutory') && (
                  <div>
                    {isEditMode ? (
                      <div className="flex items-center justify-between p-1 bg-amber-50/70 border border-amber-300 rounded-lg my-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mr-2 shrink-0">Statutory Line:</span>
                        <input
                          type="text"
                          value={letterUniversityStatutory}
                          onChange={(e) => setLetterUniversityStatutory(e.target.value)}
                          className="flex-1 text-center text-[11px] p-0.5 bg-white border border-amber-300 rounded text-slate-800 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => deleteSection('headerStatutory')}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded flex items-center space-x-1 cursor-pointer ml-2 shrink-0"
                          title="Delete Statutory line"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-700 font-medium">{letterUniversityStatutory}</p>
                    )}
                  </div>
                )}

                {/* NAAC Accreditation Subtitle */}
                {!isDeleted('headerNaac') && (
                  <div>
                    {isEditMode ? (
                      <div className="flex items-center justify-between p-1 bg-amber-50/70 border border-amber-300 rounded-lg my-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mr-2 shrink-0">NAAC Grade:</span>
                        <input
                          type="text"
                          value={letterUniversityNaac}
                          onChange={(e) => setLetterUniversityNaac(e.target.value)}
                          className="flex-1 text-center text-[11px] p-0.5 bg-white border border-amber-300 rounded font-bold text-slate-900 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => deleteSection('headerNaac')}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded flex items-center space-x-1 cursor-pointer ml-2 shrink-0"
                          title="Delete NAAC line"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] font-bold text-slate-900">{letterUniversityNaac}</p>
                    )}
                  </div>
                )}

                {/* Campus Address Line */}
                {!isDeleted('headerAddress') && (
                  <div>
                    {isEditMode ? (
                      <div className="flex items-center justify-between p-1 bg-amber-50/70 border border-amber-300 rounded-lg my-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mr-2 shrink-0">Campus Address:</span>
                        <input
                          type="text"
                          value={letterUniversitySub}
                          onChange={(e) => setLetterUniversitySub(e.target.value)}
                          className="flex-1 text-center text-[11px] p-0.5 bg-white border border-amber-300 rounded text-slate-800 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => deleteSection('headerAddress')}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded flex items-center space-x-1 cursor-pointer ml-2 shrink-0"
                          title="Delete Address line"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-600">{letterUniversitySub}</p>
                    )}
                  </div>
                )}

                {/* Directorate / Office Title */}
                {!isDeleted('headerDirectorate') && (
                  <div className="pt-1.5 text-xs font-bold text-slate-800 tracking-wider uppercase border-t border-slate-200 mt-2">
                    {isEditMode ? (
                      <div className="flex items-center justify-between p-1 bg-amber-50/70 border border-amber-300 rounded-lg">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mr-2 shrink-0">Directorate / Office:</span>
                        <input
                          type="text"
                          value={letterOfficeTitle}
                          onChange={(e) => setLetterOfficeTitle(e.target.value)}
                          className="flex-1 text-center font-bold text-xs p-0.5 bg-white border border-amber-300 rounded text-slate-900 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => deleteSection('headerDirectorate')}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded flex items-center space-x-1 cursor-pointer ml-2 shrink-0"
                          title="Delete Directorate line"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    ) : (
                      letterOfficeTitle
                    )}
                  </div>
                )}
              </div>

              {/* Ref No & Date */}
              {!isDeleted('refAndDate') && (
                <div className="flex justify-between items-center text-xs font-semibold text-slate-800 pt-1">
                  {isEditMode ? (
                    <div className="w-full flex items-center justify-between p-1.5 bg-amber-50/70 border border-amber-300 rounded-lg">
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Ref. No.:</span>
                        <input
                          type="text"
                          value={offerLetterRef}
                          onChange={(e) => setOfferLetterRef(e.target.value)}
                          className="font-mono font-bold text-xs p-0.5 bg-white border border-amber-300 rounded text-slate-900 w-52 outline-none"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Date:</span>
                        <input
                          type="text"
                          value={letterDate}
                          onChange={(e) => setLetterDate(e.target.value)}
                          className="font-bold text-xs p-0.5 bg-white border border-amber-300 rounded text-slate-900 w-36 text-right outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteSection('refAndDate')}
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded flex items-center space-x-1 cursor-pointer shrink-0"
                        title="Delete Ref & Date"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="font-bold text-slate-900">Ref. No.: </span>
                        <span className="font-mono font-bold text-slate-900">{offerLetterRef}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">Date: </span>
                        <span>{letterDate}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Recipient Block */}
              {!isDeleted('topRecipient') && (
                <div className="text-xs space-y-1 text-slate-800 pt-1">
                  {isEditMode ? (
                    <div className="space-y-1.5 bg-amber-50/60 p-2.5 border border-amber-300 rounded-xl">
                      <div className="flex items-center justify-between pb-1 border-b border-amber-200">
                        <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">Candidate / Recipient Header</span>
                        <button
                          type="button"
                          onClick={() => deleteSection('topRecipient')}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded flex items-center space-x-1 cursor-pointer"
                          title="Delete this section"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Delete Section</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold block">Salutation Line</label>
                          <input
                            type="text"
                            value={letterRecipientPrefix}
                            onChange={(e) => setLetterRecipientPrefix(e.target.value)}
                            className="p-1 bg-white border border-amber-300 rounded w-full font-bold text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold block">Candidate Full Name</label>
                          <input
                            type="text"
                            value={letterRecipientName}
                            onChange={(e) => setLetterRecipientName(e.target.value)}
                            className="p-1 bg-white border border-amber-300 rounded w-full font-bold text-xs outline-none"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-500 font-bold block">Affiliation / Address Line</label>
                          <input
                            type="text"
                            value={letterRecipientAffiliation}
                            onChange={(e) => setLetterRecipientAffiliation(e.target.value)}
                            className="p-1 bg-white border border-amber-300 rounded w-full text-xs outline-none"
                            placeholder="e.g. Punjab Agricultural University (PAU), Ludhiana"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-500 font-bold block">Contact Details (Email &amp; Phone)</label>
                          <input
                            type="text"
                            value={letterRecipientContact}
                            onChange={(e) => setLetterRecipientContact(e.target.value)}
                            className="p-1 bg-white border border-amber-300 rounded w-full text-xs outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="font-bold text-slate-950 text-sm">{letterRecipientPrefix}</div>
                      <div className="font-bold text-slate-900 text-sm">{letterRecipientName}</div>
                      {letterRecipientAffiliation && <div>{letterRecipientAffiliation}</div>}
                      <div>{letterRecipientContact}</div>
                    </>
                  )}
                </div>
              )}

              {/* Subject Line */}
              {!isDeleted('subject') && (
                <div className="py-2 border-y border-slate-200 text-center font-bold text-xs sm:text-sm text-slate-950 uppercase tracking-wide bg-slate-50/50">
                  {isEditMode ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-[10px] font-bold text-amber-900">SUBJECT CLAUSE</span>
                        <button
                          type="button"
                          onClick={() => deleteSection('subject')}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded flex items-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={letterSubject}
                        onChange={(e) => setLetterSubject(e.target.value)}
                        className="w-full text-center font-bold p-1 bg-white border border-amber-300 rounded text-xs sm:text-sm outline-none"
                      />
                    </div>
                  ) : (
                    letterSubject
                  )}
                </div>
              )}

              {/* Salutation */}
              {!isDeleted('salutation') && (
                <div className="text-xs font-bold text-slate-900">
                  {isEditMode ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={letterSalutation}
                        onChange={(e) => setLetterSalutation(e.target.value)}
                        className="font-bold p-1 bg-white border border-amber-300 rounded flex-1 outline-none text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => deleteSection('salutation')}
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded flex items-center space-x-1 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  ) : (
                    letterSalutation
                  )}
                </div>
              )}

              {/* Body Paragraphs */}
              <div className="text-xs text-slate-800 space-y-3 leading-relaxed text-justify">
                {/* Intro */}
                {!isDeleted('intro') && (
                  <div className="relative group">
                    {isEditMode ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between pb-1">
                          <span className="text-[10px] font-bold text-amber-900">PREAMBLE &amp; SELECTION COMMITTEE SANCTION</span>
                          <button
                            type="button"
                            onClick={() => deleteSection('intro')}
                            className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded flex items-center space-x-1 cursor-pointer"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                            <span>Delete Section</span>
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          value={letterIntro}
                          onChange={(e) => setLetterIntro(e.target.value)}
                          className="w-full p-2 bg-white border border-amber-300 rounded text-xs outline-none"
                        />
                      </div>
                    ) : (
                      <p>{letterIntro}</p>
                    )}
                  </div>
                )}

                {/* 1. Scale of Pay */}
                {!isDeleted('pay') && (
                  <div>
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900">1. Scale of Pay &amp; Emoluments: </strong>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => deleteSection('pay')}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded flex items-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Delete Section</span>
                        </button>
                      )}
                    </div>
                    {isEditMode ? (
                      <textarea
                        rows={2}
                        value={letterClausePay}
                        onChange={(e) => setLetterClausePay(e.target.value)}
                        className="w-full p-2 bg-white border border-amber-300 rounded text-xs outline-none mt-1"
                      />
                    ) : (
                      <span>{letterClausePay}</span>
                    )}
                  </div>
                )}

                {/* 2. Probation */}
                {!isDeleted('probation') && (
                  <div>
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900">2. Probation &amp; Confirmation: </strong>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => deleteSection('probation')}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded flex items-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Delete Section</span>
                        </button>
                      )}
                    </div>
                    {isEditMode ? (
                      <textarea
                        rows={2}
                        value={letterClauseProbation}
                        onChange={(e) => setLetterClauseProbation(e.target.value)}
                        className="w-full p-2 bg-white border border-amber-300 rounded text-xs outline-none mt-1"
                      />
                    ) : (
                      <span>{letterClauseProbation}</span>
                    )}
                  </div>
                )}

                {/* 3. Posting */}
                {!isDeleted('posting') && (
                  <div>
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900">3. Place of Posting &amp; Reporting: </strong>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => deleteSection('posting')}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded flex items-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Delete Section</span>
                        </button>
                      )}
                    </div>
                    {isEditMode ? (
                      <textarea
                        rows={2}
                        value={letterClausePosting}
                        onChange={(e) => setLetterClausePosting(e.target.value)}
                        className="w-full p-2 bg-white border border-amber-300 rounded text-xs outline-none mt-1"
                      />
                    ) : (
                      <span>{letterClausePosting}</span>
                    )}
                  </div>
                )}

                {/* 4. Conduct */}
                {!isDeleted('conduct') && (
                  <div>
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900">4. Service Conditions &amp; Code of Conduct: </strong>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => deleteSection('conduct')}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded flex items-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Delete Section</span>
                        </button>
                      )}
                    </div>
                    {isEditMode ? (
                      <textarea
                        rows={3}
                        value={letterClauseConduct}
                        onChange={(e) => setLetterClauseConduct(e.target.value)}
                        className="w-full p-2 bg-white border border-amber-300 rounded text-xs outline-none mt-1"
                      />
                    ) : (
                      <span>{letterClauseConduct}</span>
                    )}
                  </div>
                )}

                {/* 5. Special Clauses */}
                {!isDeleted('special') && (
                  <div>
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900">5. Terms, Conditions &amp; Pre-requisites: </strong>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => deleteSection('special')}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded flex items-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Delete Section</span>
                        </button>
                      )}
                    </div>
                    {isEditMode ? (
                      <textarea
                        rows={3}
                        value={letterClauseSpecial}
                        onChange={(e) => setLetterClauseSpecial(e.target.value)}
                        className="w-full p-2 bg-white border border-amber-300 rounded text-xs outline-none mt-1"
                      />
                    ) : (
                      <span>{letterClauseSpecial}</span>
                    )}
                  </div>
                )}

                {/* 6. Acceptance */}
                {!isDeleted('acceptance') && (
                  <div>
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900">6. Acceptance &amp; Date of Joining: </strong>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => deleteSection('acceptance')}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded flex items-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Delete Section</span>
                        </button>
                      )}
                    </div>
                    {isEditMode ? (
                      <textarea
                        rows={2}
                        value={letterClauseAcceptance}
                        onChange={(e) => setLetterClauseAcceptance(e.target.value)}
                        className="w-full p-2 bg-white border border-amber-300 rounded text-xs outline-none mt-1"
                      />
                    ) : (
                      <span>{letterClauseAcceptance}</span>
                    )}
                  </div>
                )}

                {/* User-Added Custom Clauses */}
                {customClauses.map((clause) => (
                  <div key={clause.id} className="p-2.5 bg-blue-50/50 border border-blue-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={clause.title}
                          onChange={(e) => handleUpdateCustomClause(clause.id, 'title', e.target.value)}
                          className="font-bold text-xs p-1 bg-white border border-blue-300 rounded flex-1 mr-2 outline-none"
                        />
                      ) : (
                        <strong className="text-slate-900">{clause.title}: </strong>
                      )}
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomClause(clause.id)}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded flex items-center space-x-1 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                    {isEditMode ? (
                      <textarea
                        rows={2}
                        value={clause.content}
                        onChange={(e) => handleUpdateCustomClause(clause.id, 'content', e.target.value)}
                        className="w-full p-2 bg-white border border-blue-300 rounded text-xs outline-none"
                      />
                    ) : (
                      <span>{clause.content}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Deleted Sections Restoration Drawer */}
              {isEditMode && deletedSections.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1.5 print:hidden">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-900 flex items-center space-x-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Deleted Sections ({deletedSections.length}):</span>
                    </span>
                    <button
                      type="button"
                      onClick={restoreAllSections}
                      className="text-[11px] font-bold text-rose-700 hover:underline cursor-pointer"
                    >
                      Restore All Sections
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {deletedSections.map((secId) => (
                      <button
                        key={secId}
                        type="button"
                        onClick={() => restoreSection(secId)}
                        className="px-2 py-1 bg-white border border-rose-300 hover:bg-rose-100 text-rose-800 text-[11px] font-medium rounded-lg flex items-center space-x-1 cursor-pointer transition shadow-2xs"
                      >
                        <span>+ Restore {sectionLabels[secId] || secId}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Closing Signatures & Copy To */}
              <div className="pt-6 flex justify-between items-end text-xs">
                {!isDeleted('copyTo') ? (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-slate-700">Copy forwarded for information to:</p>
                      {isEditMode && (
                        <button
                          type="button"
                          onClick={() => deleteSection('copyTo')}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded flex items-center space-x-1 ml-2 cursor-pointer"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                    {isEditMode ? (
                      <textarea
                        rows={4}
                        value={letterCopyTo}
                        onChange={(e) => setLetterCopyTo(e.target.value)}
                        className="w-64 p-1.5 bg-white border border-amber-300 rounded text-[11px] outline-none mt-1"
                      />
                    ) : (
                      <div className="text-[11px] text-slate-500 whitespace-pre-line mt-1">
                        {letterCopyTo}
                      </div>
                    )}
                  </div>
                ) : (
                  <div></div>
                )}

                {!isDeleted('signatory') ? (
                  <div className="text-right space-y-1">
                    <div className="h-10"></div>
                    {isEditMode ? (
                      <div className="space-y-1 text-right p-2.5 bg-amber-50/70 border border-amber-300 rounded-xl">
                        <div className="flex items-center justify-between pb-1 border-b border-amber-200">
                          <span className="text-[10px] font-bold text-amber-900 uppercase">Signatory Authority</span>
                          <button
                            type="button"
                            onClick={() => deleteSection('signatory')}
                            className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded flex items-center space-x-1 cursor-pointer"
                            title="Delete Signatory block"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                        <label className="text-[10px] text-slate-400 font-bold block">Signatory Name</label>
                        <input
                          type="text"
                          value={letterSignatoryName}
                          onChange={(e) => setLetterSignatoryName(e.target.value)}
                          className="font-bold text-right p-1 bg-white border border-amber-300 rounded text-xs outline-none w-52"
                        />
                        <label className="text-[10px] text-slate-400 font-bold block mt-1">Designation &amp; Campus</label>
                        <input
                          type="text"
                          value={letterSignatoryTitle}
                          onChange={(e) => setLetterSignatoryTitle(e.target.value)}
                          className="text-right p-1 bg-white border border-amber-300 rounded text-[11px] outline-none w-52 text-slate-500"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="font-bold text-slate-900 text-xs">{letterSignatoryName}</div>
                        <div className="text-[11px] text-slate-600">{letterSignatoryTitle}</div>
                      </>
                    )}
                  </div>
                ) : (
                  <div></div>
                )}
              </div>

              {/* Prominent Below/Bottom Button to Update or Save ("blow button to update of save") */}
              {isEditMode && (
                <div className="mt-8 pt-5 border-t-2 border-dashed border-amber-300 bg-linear-to-r from-amber-50 to-orange-50 p-4 sm:p-5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md print:hidden">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-amber-900">
                    <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-bold text-sm">Active Editing Session</p>
                      <p className="text-[11px] text-amber-800 font-normal">
                        Click &ldquo;Save &amp; Update Letter&rdquo; below to confirm your customized clauses and exit edit mode.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleAddCustomClause}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-600" />
                      <span>+ Add Clause</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetTemplate}
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                      title="Reset all clauses to standard template"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveAndExitEditMode}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center space-x-2 cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save &amp; Update Letter</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* MODE 2: UPLOADED PRE-SIGNED PDF PREVIEW */
            <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-8 text-center min-h-[600px] flex flex-col items-center justify-center space-y-4">
              {uploadedPdfFileName ? (
                <div className="max-w-md w-full space-y-4">
                  <div className="w-20 h-20 bg-purple-100 text-purple-700 rounded-3xl mx-auto flex items-center justify-center shadow-xs">
                    <FileCheck className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{uploadedPdfFileName}</h3>
                    <p className="text-xs text-slate-500 mt-1">Official Signed University Appointment PDF Document</p>
                    <span className="inline-block mt-2 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      ✓ Ready to Dispatch &amp; Attach to Candidate Email
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ref No.:</span>
                      <span className="font-bold text-slate-800">{offerLetterRef}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Recipient:</span>
                      <span className="text-slate-800">{candidate.fullName} ({candidate.email})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Post:</span>
                      <span className="text-slate-800">{request.postTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Package:</span>
                      <span className="text-emerald-700 font-bold">{offeredCtc}</span>
                    </div>
                  </div>

                  <div className="flex justify-center space-x-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition text-xs cursor-pointer"
                    >
                      Replace PDF
                    </button>
                    <button
                      type="button"
                      onClick={handleIssueFormalOffer}
                      disabled={isSubmitting}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition text-xs cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isSubmitting ? 'Dispatching...' : 'Release & Send Offer Now'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-w-sm space-y-3 text-slate-400">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto flex items-center justify-center">
                    <FileUp className="w-8 h-8 text-slate-400" />
                  </div>
                  <h4 className="font-bold text-slate-700 text-sm">No Document Uploaded Yet</h4>
                  <p className="text-xs">
                    Please use the upload box on the left to attach your signed university offer PDF. Once uploaded, its verification card will display here.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. LIVE EMAIL PREVIEW MODAL */}
      {/* ============================================================== */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Live Candidate Email Preview</h3>
                  <p className="text-[11px] text-slate-500">
                    Dispatched from <span className="font-mono text-blue-700 font-bold">{selectedDesk === 'custom' ? customEmail || 'officer@gku.ac.in' : senderEmail}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-100 border-b border-slate-200 text-xs space-y-1.5 font-mono">
              <div><strong className="text-slate-500">From:</strong> {selectedDesk === 'custom' ? customName || 'Official Desk' : senderName} &lt;{selectedDesk === 'custom' ? customEmail : senderEmail}&gt;</div>
              <div><strong className="text-slate-500">To:</strong> {candidate.fullName} &lt;{candidate.email}&gt;</div>
              {ccEmails.trim() && <div><strong className="text-slate-500">CC:</strong> {ccEmails}</div>}
              <div><strong className="text-slate-500">Reply-To:</strong> {replyToEmail || senderEmail}</div>
              <div><strong className="text-slate-500">Subject:</strong> Formal Appointment Offer: {request.postTitle} - Guru Kashi University [Ref: {offerLetterRef}]</div>
              {attachOfferLetterPdf && (
                <div className="text-emerald-700 font-bold flex items-center space-x-1 pt-1">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Attachment: {offerMode === 'upload' ? (uploadedPdfFileName || 'Signed_Offer_Letter.pdf') : `Formal_Offer_Letter_${candidate.fullName.replace(/\s+/g, '_')}.pdf`}</span>
                </div>
              )}
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] bg-slate-50">
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                {/* Email Header */}
                <div className="bg-[#0b1f3a] text-white p-6 text-center border-b-4 border-amber-400">
                  <h2 className="text-lg font-extrabold tracking-wide m-0">GURU KASHI UNIVERSITY</h2>
                  <p className="text-[11px] text-slate-300 mt-1">Sardulgarh Road, Talwandi Sabo, Bathinda, Punjab</p>
                  <span className="inline-block mt-2 bg-amber-400 text-slate-950 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                    NAAC A++ ACCREDITED UNIVERSITY
                  </span>
                </div>

                <div className="p-6 space-y-4 text-xs text-slate-800">
                  <p className="font-bold text-sm text-slate-900">Dear {candidate.fullName},</p>
                  <p className="text-slate-600">
                    On behalf of Guru Kashi University, we are pleased to offer you the formal appointment for the position of{' '}
                    <strong>{request.postTitle}</strong> in the <strong>{request.department}</strong>.
                  </p>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-semibold">Offer Reference:</span>
                      <span className="font-bold font-mono">{offerLetterRef}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-semibold">Post Title:</span>
                      <span className="font-bold">{request.postTitle}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-semibold">Department:</span>
                      <span className="font-bold">{request.department}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-semibold">Offered Package (CTC):</span>
                      <span className="font-bold text-emerald-700 text-sm">{offeredCtc}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-semibold">Reporting Head:</span>
                      <span className="font-medium">{reportingHead}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-semibold">Joining Deadline:</span>
                      <span className="font-bold text-rose-600">{joiningDeadline}</span>
                    </div>
                  </div>

                  {attachOfferLetterPdf && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center space-x-2 text-xs">
                      <Paperclip className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        The formal appointment offer letter document is attached to this email as a PDF.
                      </span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-200 text-xs">
                    <p className="text-slate-500">With Warm Regards,</p>
                    <p className="font-bold text-slate-900 mt-1">{selectedDesk === 'custom' ? customName || 'Authorized Officer' : senderName}</p>
                    <p className="text-slate-500 text-[11px]">Directorate of HR &amp; Executive Affairs</p>
                    <p className="text-blue-700 text-[11px] font-medium">Guru Kashi University, Punjab</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
