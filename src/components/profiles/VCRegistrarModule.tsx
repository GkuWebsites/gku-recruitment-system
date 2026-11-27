'use client';

import React, { useState } from 'react';
import { IHiringRequest, Candidate } from '@/lib/types';
import {
  CheckCircle2,
  Clock,
  Search,
  AlertCircle,
  Landmark,
  HelpCircle,
  XCircle,
  Check,
  Send,
  Ban,
  ShieldCheck,
  Users,
  MessageSquare,
  FileText,
  Download
} from 'lucide-react';

import { ClarificationThreadChat } from '../ClarificationThreadChat';
import { IClarificationRecipient } from '@/lib/types';

interface VCRegistrarModuleProps {
  requests: IHiringRequest[];
  onSelectRequest: (request: IHiringRequest) => void;
  onRefresh: () => void;
  currentUser?: {
    name: string;
    email: string;
    designation: string;
    department?: string;
  } | null;
}

type VCTab = 'pendingSanction' | 'inClarification' | 'sanctionedHistory' | 'cvApprovals';

export function VCRegistrarModule({
  requests,
  onSelectRequest,
  onRefresh,
  currentUser
}: VCRegistrarModuleProps) {
  const [activeTab, setActiveTab] = useState<VCTab>('pendingSanction');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReqForSanction, setSelectedReqForSanction] = useState<IHiringRequest | null>(null);

  // Decision Form State
  const [selectedDecision, setSelectedDecision] = useState<'approve' | 'query' | 'reject' | 'chat'>('approve');
  const [approvalRemark, setApprovalRemark] = useState('');
  const [queryMessage, setQueryMessage] = useState('');
  const [recipientChoice, setRecipientChoice] = useState<'Dean Academic' | 'Department / Dean' | 'Both'>('Dean Academic');
  const [rejectionReason, setRejectionReason] = useState('');
  const [modalError, setModalError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [openChatReqIds, setOpenChatReqIds] = useState<{ [reqId: string]: boolean }>({});

  // CV Review States
  const [reviewingCand, setReviewingCand] = useState<{ req: IHiringRequest; cand: Candidate } | null>(null);
  const [cvDecision, setCvDecision] = useState<'Approved' | 'Rejected'>('Approved');
  const [cvRemarks, setCvRemarks] = useState('');
  const [isSubmittingCv, setIsSubmittingCv] = useState(false);

  // Handle Review CV
  const handleReviewCv = async (req: IHiringRequest, cand: Candidate, decision: 'Approved' | 'Rejected', remarks?: string) => {
    setIsSubmittingCv(true);
    setModalError('');
    try {
      // Map designation to the exact role string stored in sentTo
      const designation = currentUser?.designation || 'Vice Chancellor';
      const reviewerRole =
        designation === 'Vice Chancellor' || designation === 'Vice-Chancellor'
          ? 'Vice-Chancellor (VC)'
          : designation === 'Registrar'
          ? 'Registrar'
          : designation;

      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review_cv',
          requestId: req.requestId,
          candidateId: cand.id,
          decision,
          remarks: remarks || (decision === 'Approved' ? 'CV Approved for interview assessment' : 'CV Rejected by Executive Authority'),
          reviewerRole,
          reviewerName: currentUser?.name || 'Executive Authority'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to review candidate CV');
      }
      setSuccessMsg(`✓ Candidate CV for ${cand.fullName} marked as ${decision}.`);
      setReviewingCand(null);
      setCvRemarks('');
      onRefresh();
    } catch (err: any) {
      setModalError(err.message || 'Error processing CV review');
    } finally {
      setIsSubmittingCv(false);
    }
  };

  const toggleReqChat = (reqId: string) => {
    setOpenChatReqIds((prev) => ({
      ...prev,
      [reqId]: !prev[reqId]
    }));
  };

  // Strict Rule: ONLY requisitions that have received Dean Academic Approval are visible here!
  const clearedByDean = requests.filter(
    (r) =>
      r.deanAcademicApproval?.decision === 'Approved' &&
      r.status !== 'Request Submitted (Department)'
  );

  // 1. Pending Sanction: Ready for VC decision (not currently in clarification hold)
  const pendingSanction = clearedByDean.filter(
    (r) =>
      r.status !== 'Rejected' &&
      r.status !== 'Returned for Clarification' &&
      r.vcRegistrarApproval?.decision !== 'Approved' &&
      r.vcRegistrarApproval?.decision !== 'Rejected' &&
      r.status !== 'In Process (HR - Recruitment)' &&
      (!r.clarificationThreads ||
        !r.clarificationThreads.some((t) => t.creatorRole === 'VC / Registrar' && t.status === 'Open')) &&
      (r.currentStage === 3 ||
        r.status === 'Approved by Dean Academic' ||
        r.status === 'Under Review (VC / Registrar)')
  );

  // 2. In-Clarification Queue: VC asked for clarification, or active clarification dialogue on requisition
  const inClarificationQueue = clearedByDean.filter(
    (r) =>
      r.status !== 'Rejected' &&
      r.status !== 'In Process (HR - Recruitment)' &&
      (r.status === 'Returned for Clarification' ||
        r.vcRegistrarApproval?.decision === 'Clarification' ||
        (r.clarificationThreads &&
          r.clarificationThreads.length > 0 &&
          r.vcRegistrarApproval?.decision !== 'Approved'))
  );

  // 3. Sanctioned History: Cleared by VC and released to HR
  const sanctionedHistory = clearedByDean.filter(
    (r) =>
      r.vcRegistrarApproval?.decision === 'Approved' ||
      r.currentStage >= 4 ||
      [
        'Approved by VC / Registrar',
        'In Process (HR - Recruitment)',
        'Interview & Selection Completed',
        'Joined & Request Closed'
      ].includes(r.status) ||
      (r.status === 'Rejected' && r.vcRegistrarApproval?.decision === 'Rejected')
  );

  // 4. CV Approvals Queue (Sent to VC / Registrar by HR)
  const cvApprovalCandidates: { request: IHiringRequest; candidate: Candidate }[] = [];
  const isOnlyVC = currentUser?.designation === 'Vice Chancellor' || currentUser?.designation === 'Vice-Chancellor';
  const isOnlyRegistrar = currentUser?.designation === 'Registrar';
  requests.forEach((req) => {
    if (req.candidates && req.candidates.length > 0) {
      req.candidates.forEach((cand) => {
        if (cand.cvApproval && Array.isArray(cand.cvApproval.sentTo)) {
          const matchesTarget = isOnlyVC
            ? cand.cvApproval.sentTo.some((t) => t.includes('VC') || t.includes('Vice-Chancellor'))
            : isOnlyRegistrar
            ? cand.cvApproval.sentTo.some((t) => t.includes('Registrar'))
            : cand.cvApproval.sentTo.some((t) => t.includes('VC') || t.includes('Registrar') || t.includes('Vice-Chancellor'));
          if (matchesTarget) {
            cvApprovalCandidates.push({ request: req, candidate: cand });
          }
        }
      });
    }
  });

  let baseList: IHiringRequest[] = [];
  if (activeTab === 'pendingSanction') baseList = pendingSanction;
  else if (activeTab === 'inClarification') baseList = inClarificationQueue;
  else baseList = sanctionedHistory;

  const displayedList = baseList.filter((r) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.requestId.toLowerCase().includes(q) ||
        r.postTitle.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openSanctionModal = (req: IHiringRequest) => {
    setSelectedReqForSanction(req);
    setSelectedDecision('approve');
    const officialTitle = currentUser?.designation || 'Vice Chancellor';
    const officialName = currentUser?.name || 'Executive Secretariat';
    setApprovalRemark(
      `Sanction accorded for ${req.numberOfPositions} position(s) of ${req.postTitle} as sanctioned by ${officialTitle} (${officialName}). Released to HR Recruitment Desk.`
    );
    setQueryMessage('');
    setRecipientChoice('Dean Academic');
    setRejectionReason('');
    setModalError('');
  };

  const handleSanctionSubmit = async () => {
    if (!selectedReqForSanction) return;
    setModalError('');

    let actionType: 'sanction' | 'query' | 'reject' = 'sanction';
    let remarksToSend = '';

    if (selectedDecision === 'approve') {
      actionType = 'sanction';
      remarksToSend =
        approvalRemark.trim() ||
        `Sanction accorded for ${selectedReqForSanction.numberOfPositions} position(s) of ${selectedReqForSanction.postTitle}.`;
    } else if (selectedDecision === 'query') {
      actionType = 'query';
      if (!queryMessage.trim()) {
        setModalError('Please enter the query / clarification message.');
        return;
      }
      remarksToSend = queryMessage.trim();
    } else if (selectedDecision === 'reject') {
      actionType = 'reject';
      if (!rejectionReason.trim()) {
        setModalError('Please provide a reason / justification for denying administrative sanction.');
        return;
      }
      remarksToSend = rejectionReason.trim();
    }

    setIsProcessing(true);
    try {
      const officialTitle = currentUser?.designation || 'Vice Chancellor';
      const officialName = currentUser?.name || 'Executive Secretariat';

      if (selectedDecision === 'query') {
        const res = await fetch(`/api/requests/${selectedReqForSanction.requestId}/clarifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_thread',
            subject: `${officialTitle} Official Query / Clarification`,
            creatorName: `${officialName} (${officialTitle})`,
            creatorRole: officialTitle === 'Registrar' ? 'Registrar' : 'VC / Registrar',
            creatorEmail: currentUser?.email || 'vc@gku.ac.in',
            primaryRecipientRole: recipientChoice,
            primaryRecipientEmail:
              recipientChoice === 'Department / Dean' || recipientChoice === 'Both'
                ? selectedReqForSanction.creator.email
                : undefined,
            primaryRecipientName:
              recipientChoice === 'Department / Dean' || recipientChoice === 'Both'
                ? selectedReqForSanction.creator.name
                : undefined,
            ccRecipients: [],
            messageText: remarksToSend
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to dispatch clarification thread');
        }
      } else {
        const res = await fetch(`/api/vc-registrar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId: selectedReqForSanction.requestId,
            action: actionType,
            actorName: `${officialName} (${officialTitle})`,
            actorRole: officialTitle,
            remarks: remarksToSend
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to process sanction action');
        }
      }

      const recipientLabel =
        recipientChoice === 'Department / Dean'
          ? 'Original Dean'
          : recipientChoice === 'Both'
          ? 'Both (Dean Academic & Dean)'
          : 'Dean Academic';

      setSuccessMsg(
        selectedDecision === 'approve'
          ? '✓ Administrative Sanction granted. Released to HR Recruitment Cell.'
          : selectedDecision === 'query'
          ? `? Clarification query thread dispatched to ${recipientLabel}.`
          : '✕ Administrative sanction denied.'
      );

      setSelectedReqForSanction(null);
      onRefresh();
    } catch (err: unknown) {
      setModalError((err as Error).message || 'An error occurred while saving the sanction decision.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-800">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {currentUser?.designation === 'Vice Chancellor'
                ? "Vice Chancellor's Executive Secretariat"
                : currentUser?.designation === 'Registrar'
                ? "Registrar's Office & Statutory Sanctions Desk"
                : 'VC & Registrar Administrative Sanction Desk'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentUser?.designation === 'Vice Chancellor'
                ? 'Executive authority, budget sanction, and statutory appointment approvals.'
                : currentUser?.designation === 'Registrar'
                ? 'University statutory administration, compliance verification, and appointment sanction.'
                : 'Statutory institutional approval, financial authorization, and executive clearance.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-semibold">
          <div className="flex items-center space-x-2 bg-purple-50/70 border border-purple-200 px-3.5 py-1.5 rounded-xl text-purple-950 font-medium">
            <span className="w-2 h-2 rounded-full bg-purple-600" />
            <span>
              Awaiting Sanction: <strong className="font-bold">{pendingSanction.length}</strong>
            </span>
          </div>
          <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-xl text-amber-950 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>
              In-Clarification: <strong className="font-bold">{inClarificationQueue.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg('')}
            className="text-emerald-600 font-bold hover:text-emerald-800 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center space-x-2 sm:space-x-4 border-b border-slate-200 text-xs font-bold">
        {/* Tab 1: Awaiting Sanction */}
        <button
          onClick={() => setActiveTab('pendingSanction')}
          className={`py-3.5 px-4 border-b-2 transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'pendingSanction'
              ? 'border-purple-700 text-purple-950 font-extrabold bg-purple-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-purple-700" />
          <span>1. Awaiting Sanction ({pendingSanction.length})</span>
        </button>

        {/* Tab 2: In-Clarification Queue */}
        <button
          onClick={() => setActiveTab('inClarification')}
          className={`py-3.5 px-4 border-b-2 transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'inClarification'
              ? 'border-amber-600 text-amber-900 font-extrabold bg-amber-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-amber-600" />
          <span>2. In-Clarification Queue ({inClarificationQueue.length})</span>
        </button>

        {/* Tab 3: Sanctioned History */}
        <button
          onClick={() => setActiveTab('sanctionedHistory')}
          className={`py-3.5 px-4 border-b-2 transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'sanctionedHistory'
              ? 'border-blue-600 text-blue-800 font-extrabold bg-blue-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          <span>3. Sanctioned & Released to HR ({sanctionedHistory.length})</span>
        </button>

        {/* Tab 4: Candidate CV Approvals */}
        <button
          onClick={() => setActiveTab('cvApprovals')}
          className={`py-3.5 px-4 border-b-2 transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'cvApprovals'
              ? 'border-indigo-600 text-indigo-900 font-extrabold bg-indigo-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>4. Candidate CV Approvals ({cvApprovalCandidates.length})</span>
        </button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Search & Scoping Note */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search cleared requisitions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            />
          </div>
          <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">
            🔒 Unapproved department drafts are withheld until Dean Academic clearance
          </span>
        </div>

        {/* Clarification Desk Tab or Standard Data Table */}
        {activeTab === 'cvApprovals' ? (
          <div className="p-6 space-y-4">
            {cvApprovalCandidates.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-300" />
                <div className="font-semibold text-slate-600">No Candidate CVs Pending Approval</div>
                <p className="text-[11px] text-slate-400">
                  When HR uploads candidate resumes and requests executive approval, they will appear here.
                </p>
              </div>
            ) : (
              cvApprovalCandidates.map(({ request: req, candidate: cand }) => {
                const userReview = cand.cvApproval?.reviews?.find(
                  (r) =>
                    r.reviewerRole === currentUser?.designation ||
                    (currentUser?.designation === 'Vice Chancellor' && r.reviewerRole.includes('VC')) ||
                    (currentUser?.designation === 'Registrar' && r.reviewerRole.includes('Registrar'))
                );

                return (
                  <div
                    key={`${req.requestId}-${cand.id}`}
                    className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-3.5 hover:border-slate-300 transition"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                            {req.requestId}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">{req.department}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs font-bold text-slate-800">{req.postTitle}</span>
                        </div>
                        <h4 className="text-base font-extrabold text-slate-900 mt-1">
                          {cand.fullName}
                        </h4>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {cand.qualification} • {cand.experienceYears} Years Exp • Affiliation: {cand.currentAffiliation || 'Independent'}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {cand.resumeFileName && (
                          <a
                            href={`/uploads/resumes/${cand.resumeFileName}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5 text-blue-600" />
                            <span>View CV ({cand.resumeFileName})</span>
                          </a>
                        )}

                        {cand.cvApproval && (
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              cand.cvApproval.status === 'Approved'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : cand.cvApproval.status === 'Rejected'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : 'bg-amber-50 text-amber-900 border-amber-300'
                            }`}
                          >
                            Status: {cand.cvApproval.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Review history */}
                    {cand.cvApproval?.reviews && cand.cvApproval.reviews.length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Recorded Leadership Reviews:
                        </span>
                        {cand.cvApproval.reviews.map((rev, rIdx) => (
                          <div key={rIdx} className="text-slate-700 flex items-center space-x-2">
                            <span className={rev.decision === 'Approved' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                              {rev.decision === 'Approved' ? '✓' : '✕'} {rev.reviewerRole} ({rev.reviewerName}): {rev.decision}
                            </span>
                            {rev.remarks && <span className="text-slate-500 italic">&ldquo;{rev.remarks}&rdquo;</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <div className="text-xs text-slate-500">
                        {userReview ? (
                          <span className="font-semibold text-purple-900">
                            Your verdict: <strong className={userReview.decision === 'Approved' ? 'text-emerald-700' : 'text-rose-700'}>{userReview.decision}</strong> ({userReview.remarks || 'No remarks'})
                          </span>
                        ) : (
                          <span className="text-amber-800 font-medium">
                            Awaiting your statutory executive decision.
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          disabled={isSubmittingCv}
                          onClick={() => handleReviewCv(req, cand, 'Rejected', 'Qualifications do not meet minimum department bar')}
                          className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                        >
                          ✕ Reject CV
                        </button>

                        <button
                          type="button"
                          disabled={isSubmittingCv}
                          onClick={() => handleReviewCv(req, cand, 'Approved', 'CV cleared for interview scheduling')}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                        >
                          ✓ Approve CV & Clear
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : activeTab === 'inClarification' ? (
          <div className="p-6 space-y-6">
            {displayedList.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <HelpCircle className="w-10 h-10 mx-auto text-amber-300 mb-2" />
                <div className="font-bold text-slate-700 text-sm">No Active Clarification Queries</div>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  There are currently no requisitions under clarification hold in the VC / Registrar desk.
                </p>
              </div>
            ) : (
              displayedList.map((req) => {
                const hasChat = Boolean(req.clarificationThreads && req.clarificationThreads.length > 0);
                const isChatOpen = Boolean(openChatReqIds[req.requestId]);

                return (
                  <div
                    key={req.requestId}
                    className="bg-white border border-slate-200 hover:border-amber-300/80 rounded-2xl p-5 shadow-xs space-y-4 transition"
                  >
                    {/* Requisition Banner & Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                            {req.requestId}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">{req.postTitle}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            In Clarification
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {req.department} • {req.numberOfPositions} Position(s) • Submitter: {req.creator.name}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2.5">
                        {/* ONLY show chat button if at least one chat exists */}
                        {hasChat && (
                          <button
                            type="button"
                            onClick={() => toggleReqChat(req.requestId)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                              isChatOpen
                                ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/60 shadow-xs'
                            }`}
                          >
                            <MessageSquare className={`w-3.5 h-3.5 ${isChatOpen ? 'text-amber-800' : 'text-slate-500'}`} />
                            <span>
                              {isChatOpen
                                ? 'Close Chat Box'
                                : `Open Clarification Chat (${req.clarificationThreads!.length})`}
                            </span>
                          </button>
                        )}

                        {/* Grant Executive Sanction Button */}
                        <button
                          type="button"
                          onClick={() => openSanctionModal(req)}
                          className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center space-x-1.5"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Grant Executive Sanction &rarr;</span>
                        </button>
                      </div>
                    </div>

                    {/* Expandable Clarification Thread Chat ONLY when clicked & when chat exists */}
                    {hasChat && isChatOpen && (
                      <div className="pt-3 border-t border-slate-100 animate-in fade-in duration-150">
                        <ClarificationThreadChat
                          request={req}
                          currentUser={currentUser}
                          onRefresh={onRefresh}
                          allowCreateThread={true}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Requisition ID</th>
                  <th className="py-3.5 px-6">Department & Post</th>
                  <th className="py-3.5 px-6">Positions</th>
                  <th className="py-3.5 px-6">Dean Academic Clearance Remarks</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      {activeTab === 'pendingSanction' && 'No requisitions currently awaiting administrative sanction.'}
                      {activeTab === 'sanctionedHistory' && 'No sanctioned requisitions found.'}
                    </td>
                  </tr>
                ) : (
                  displayedList.map((req) => (
                    <tr
                      key={req.requestId}
                      className="hover:bg-slate-50/70 transition cursor-pointer"
                      onClick={() => onSelectRequest(req)}
                    >
                      <td className="py-4 px-6 font-mono font-bold text-purple-900">
                        {req.requestId}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-sm">{req.postTitle}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          {req.department} • {req.employmentType} ({req.postLevel})
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800">
                        {req.numberOfPositions} Position(s)
                      </td>

                      {/* Column 5: Clearance Remarks */}
                      <td className="py-4 px-6 max-w-xs truncate text-slate-600">
                        {req.deanAcademicApproval ? (
                          <span className="text-emerald-700 font-medium">
                            ✓ {req.deanAcademicApproval.remarks}
                          </span>
                        ) : (
                          <span className="text-slate-400">Awaiting Clearance</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        {activeTab === 'pendingSanction' ? (
                          <button
                            type="button"
                            onClick={() => openSanctionModal(req)}
                            className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                          >
                            Sanction Desk &rarr;
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSelectRequest(req)}
                            className="text-purple-700 hover:text-purple-900 font-bold text-xs cursor-pointer"
                          >
                            View Details &rarr;
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* SECTION-BASED ADMINISTRATIVE SANCTION MODAL */}
      {/* ======================================================== */}
      {selectedReqForSanction && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                  {selectedReqForSanction.requestId}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {currentUser?.designation === 'Registrar'
                    ? "Registrar's Statutory Sanction: "
                    : currentUser?.designation === 'Vice Chancellor'
                    ? "Vice Chancellor's Executive Sanction: "
                    : "Administrative Sanction: "}
                  {selectedReqForSanction.postTitle}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs text-purple-800 font-semibold bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-lg">
                    Deciding Official: {currentUser?.name || 'Executive Officer'} ({currentUser?.designation || 'VC'})
                  </span>
                  <span className="text-xs text-slate-500">
                    • {selectedReqForSanction.department} • {selectedReqForSanction.numberOfPositions} Position(s)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReqForSanction(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Dean Academic Clearance Card */}
            {selectedReqForSanction.deanAcademicApproval && (
              <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-4 text-xs space-y-1">
                <div className="flex items-center space-x-1.5 text-emerald-900 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Academic Clearance Granted by Dean Academic</span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  Scrutinized by: <strong className="text-slate-800">{selectedReqForSanction.deanAcademicApproval.decidedBy}</strong>
                </div>
                <p className="text-slate-700 italic pt-1">
                  &ldquo;{selectedReqForSanction.deanAcademicApproval.remarks}&rdquo;
                </p>
              </div>
            )}

            {/* Department Workload Justification */}
            <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <strong className="block text-slate-700 font-semibold">
                Department Workload & Faculty Deficit Justification:
              </strong>
              <p className="text-slate-800 leading-relaxed font-normal bg-white p-2.5 rounded-lg border border-slate-100">
                {selectedReqForSanction.justification}
              </p>
            </div>

            {/* Inline Error Banner */}
            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Section 1: Decision Selection Cards */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Executive Action
              </label>
              <div className={`grid gap-2.5 ${selectedReqForSanction.clarificationThreads && selectedReqForSanction.clarificationThreads.length > 0 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
                {/* 1. Sanction */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDecision('approve');
                    setModalError('');
                  }}
                  className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                    selectedDecision === 'approve'
                      ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-bold text-xs text-purple-900">
                    <ShieldCheck className={`w-4 h-4 ${selectedDecision === 'approve' ? 'text-purple-700' : 'text-slate-400'}`} />
                    <span>Grant Sanction</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Forward to HR for hiring
                  </p>
                </button>

                {/* 2. Query / Clarification */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDecision('query');
                    setModalError('');
                  }}
                  className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                    selectedDecision === 'query'
                      ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-bold text-xs text-amber-900">
                    <HelpCircle className={`w-4 h-4 ${selectedDecision === 'query' ? 'text-amber-600' : 'text-slate-400'}`} />
                    <span>Clarification Query</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Ask Dean Academic or both
                  </p>
                </button>

                {/* 3. Reject */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDecision('reject');
                    setModalError('');
                  }}
                  className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                    selectedDecision === 'reject'
                      ? 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-bold text-xs text-rose-900">
                    <XCircle className={`w-4 h-4 ${selectedDecision === 'reject' ? 'text-rose-600' : 'text-slate-400'}`} />
                    <span>Deny / Reject</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Decline executive sanction
                  </p>
                </button>

                {/* 4. Clarification Chat (if conversation exists) */}
                {selectedReqForSanction.clarificationThreads && selectedReqForSanction.clarificationThreads.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDecision('chat');
                      setModalError('');
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                      selectedDecision === 'chat'
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 font-bold text-xs text-blue-900">
                      <MessageSquare className={`w-4 h-4 ${selectedDecision === 'chat' ? 'text-blue-700' : 'text-slate-400'}`} />
                      <span>Clarification Chat</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {selectedReqForSanction.clarificationThreads.length} Thread(s) active
                    </p>
                  </button>
                )}
              </div>
            </div>

            {/* Section 2: Dynamic Decision Section based on Selection */}
            {selectedDecision === 'approve' && (
              <div className="space-y-2 bg-purple-50/40 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-purple-950">
                    Executive & Budgetary Sanction Remarks
                  </label>
                  <div className="flex items-center space-x-2">
                    {selectedReqForSanction.clarificationThreads && selectedReqForSanction.clarificationThreads.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedDecision('chat')}
                        className="text-[11px] text-purple-700 font-bold bg-purple-100 hover:bg-purple-200 px-2.5 py-0.5 rounded-lg flex items-center space-x-1 cursor-pointer transition border border-purple-200"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>View Chat ({selectedReqForSanction.clarificationThreads.length})</span>
                      </button>
                    )}
                    <span className="text-[11px] text-purple-700 font-semibold bg-purple-100/70 px-2 py-0.5 rounded">
                      Action: Forward to HR Cell
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  State Syndicate / Executive Council resolution reference, sanctioned budget head, or specific hiring directives.
                </p>
                <textarea
                  rows={3}
                  value={approvalRemark}
                  onChange={(e) => setApprovalRemark(e.target.value)}
                  placeholder="e.g., Sanction accorded for post(s) as per university budget head and Syndicate resolution..."
                  className="w-full p-3 text-xs bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            )}

            {selectedDecision === 'query' && (
              <div className="space-y-4 bg-amber-50/40 p-4 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-amber-950">
                    Clarification Query from VC / Registrar <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[11px] text-amber-800 font-semibold bg-amber-100/80 px-2 py-0.5 rounded">
                    Action: Return for Clarification
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Select who should respond to this clarification query and specify the questions or information required.
                </p>

                {/* Primary Recipient Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Target Primary Recipient <span className="text-rose-600">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRecipientChoice('Dean Academic')}
                      className={`p-2.5 rounded-xl text-center text-xs font-bold border transition cursor-pointer ${
                        recipientChoice === 'Dean Academic'
                          ? 'border-amber-600 bg-amber-100 text-amber-950 shadow-xs ring-1 ring-amber-500/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Dean Academic
                      <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                        Academic Scrutiny
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRecipientChoice('Department / Dean')}
                      className={`p-2.5 rounded-xl text-center text-xs font-bold border transition cursor-pointer ${
                        recipientChoice === 'Department / Dean'
                          ? 'border-blue-600 bg-blue-100 text-blue-950 shadow-xs ring-1 ring-blue-500/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Dean
                      <span className="block text-[10px] font-normal text-slate-500 mt-0.5 truncate">
                        {selectedReqForSanction.creator.name}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRecipientChoice('Both')}
                      className={`p-2.5 rounded-xl text-center text-xs font-bold border transition cursor-pointer ${
                        recipientChoice === 'Both'
                          ? 'border-purple-600 bg-purple-100 text-purple-950 shadow-xs ring-1 ring-purple-500/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Both
                      <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                        Dean Academic & Dean
                      </span>
                    </button>
                  </div>
                </div>

                {/* Clarification Message */}
                <div>
                  <label className="block text-xs font-bold text-amber-950 mb-1">
                    Clarification Query Message <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={queryMessage}
                    onChange={(e) => {
                      setQueryMessage(e.target.value);
                      if (modalError) setModalError('');
                    }}
                    placeholder="Specify the clarification points or financial queries..."
                    className="w-full p-3 text-xs bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* Existing Clarification Conversations inside query mode ONLY */}
                {selectedReqForSanction.clarificationThreads && selectedReqForSanction.clarificationThreads.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-amber-200">
                    <div className="text-xs font-bold text-amber-950 flex items-center space-x-1.5">
                      <MessageSquare className="w-4 h-4 text-amber-700" />
                      <span>Existing Clarification Conversations on this Requisition</span>
                    </div>
                    <ClarificationThreadChat
                      request={selectedReqForSanction}
                      currentUser={currentUser}
                      onRefresh={onRefresh}
                      allowCreateThread={false}
                    />
                  </div>
                )}
              </div>
            )}

            {selectedDecision === 'chat' && (
              <div className="space-y-3 bg-blue-50/20 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-blue-700" />
                    <label className="text-xs font-bold text-slate-800">
                      Clarification Conversations & Dialogue History
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDecision('approve')}
                    className="text-[11px] font-bold text-purple-700 bg-purple-100/80 hover:bg-purple-200 px-3 py-1 rounded-lg flex items-center space-x-1 cursor-pointer transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Proceed to Sanction &rarr;</span>
                  </button>
                </div>
                <ClarificationThreadChat
                  request={selectedReqForSanction}
                  currentUser={currentUser}
                  onRefresh={onRefresh}
                  allowCreateThread={false}
                />
              </div>
            )}

            {selectedDecision === 'reject' && (
              <div className="space-y-2 bg-rose-50/40 p-4 rounded-xl border border-rose-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-rose-950">
                    Rejection Reason & Institutional Justification <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[11px] text-rose-800 font-semibold bg-rose-100/80 px-2 py-0.5 rounded">
                    Action: Close as Rejected
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Provide formal rationale for withholding administrative sanction (e.g., budgetary freeze, cadre restructuring).
                </p>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (modalError) setModalError('');
                  }}
                  placeholder="Enter specific grounds for denying administrative sanction..."
                  className="w-full p-3 text-xs bg-white border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            )}

            {/* Footer with Tailored Submit Button */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReqForSanction(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                Cancel
              </button>

              <div>
                {selectedDecision === 'approve' && (
                  <button
                    type="button"
                    onClick={handleSanctionSubmit}
                    disabled={isProcessing}
                    className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isProcessing ? 'Granting Sanction...' : 'Confirm & Grant Executive Sanction'}</span>
                  </button>
                )}

                {selectedDecision === 'query' && (
                  <button
                    type="button"
                    onClick={handleSanctionSubmit}
                    disabled={isProcessing || !queryMessage.trim()}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {isProcessing
                        ? 'Dispatching Thread...'
                        : `Dispatch Clarification Query to ${
                            recipientChoice === 'Department / Dean'
                              ? 'Dean'
                              : recipientChoice === 'Both'
                              ? 'Both'
                              : 'Dean Academic'
                          }`}
                    </span>
                  </button>
                )}

                {selectedDecision === 'chat' && (
                  <button
                    type="button"
                    onClick={() => setSelectedDecision('approve')}
                    className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Proceed to Grant Sanction &rarr;</span>
                  </button>
                )}

                {selectedDecision === 'reject' && (
                  <button
                    type="button"
                    onClick={handleSanctionSubmit}
                    disabled={isProcessing || !rejectionReason.trim()}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
                  >
                    <Ban className="w-4 h-4" />
                    <span>{isProcessing ? 'Rejecting...' : 'Confirm & Deny Sanction'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
