'use client';

import React, { useState } from 'react';
import { IHiringRequest } from '@/lib/types';
import {
  GraduationCap,
  CheckCircle2,
  Clock,
  Search,
  AlertCircle,
  HelpCircle,
  XCircle,
  Check,
  Send,
  Ban,
  FileCheck2,
  MessageSquare,
  Building2,
  Calendar,
  Eye,
  CheckCheck,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

import { ClarificationThreadChat } from '../ClarificationThreadChat';

interface DeanAcademicModuleProps {
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

type DeanAcademicTab = 'pending' | 'clarifications' | 'forwarded_vc' | 'sanctioned';

export function DeanAcademicModule({
  requests,
  onSelectRequest,
  onRefresh,
  currentUser
}: DeanAcademicModuleProps) {
  const [activeTab, setActiveTab] = useState<DeanAcademicTab>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReqForAction, setSelectedReqForAction] = useState<IHiringRequest | null>(null);
  const [showRejectionsHistory, setShowRejectionsHistory] = useState(false);

  // Decision Form State
  const [selectedDecision, setSelectedDecision] = useState<'approve' | 'query' | 'reject'>('approve');
  const [approvalRemark, setApprovalRemark] = useState('');
  const [queryMessage, setQueryMessage] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [modalError, setModalError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Helpers to analyze clarification state
  const hasClarificationDialogue = (r: IHiringRequest) => {
    return (
      r.status === 'Returned for Clarification' ||
      r.deanAcademicApproval?.decision === 'Clarification' ||
      Boolean(r.comments?.some((c) => c.category === 'Query' || c.category === 'Clarification'))
    );
  };

  const isClarificationAnswered = (r: IHiringRequest) => {
    if (r.status === 'Under Review (Dean Academic)') return true;
    if (r.comments && r.comments.length > 0) {
      const last = r.comments[r.comments.length - 1];
      if (last.authorRole === 'Department / Dean' || last.category === 'Clarification') {
        return true;
      }
    }
    return false;
  };

  const getLatestDepartmentReply = (r: IHiringRequest) => {
    if (!r.comments || r.comments.length === 0) return null;
    const deptReplies = r.comments.filter(
      (c) => c.authorRole === 'Department / Dean' || c.category === 'Clarification'
    );
    return deptReplies.length > 0 ? deptReplies[deptReplies.length - 1] : null;
  };

  const getLatestDeanAcademicQuery = (r: IHiringRequest) => {
    if (r.comments && r.comments.length > 0) {
      const queries = r.comments.filter(
        (c) => c.authorRole === 'Dean Academic' || c.authorRole === 'VC / Registrar' || c.category === 'Query'
      );
      if (queries.length > 0) {
        return queries[queries.length - 1];
      }
    }
    if (r.vcRegistrarApproval?.decision === 'Clarification' && r.vcRegistrarApproval.remarks) {
      return {
        authorName: r.vcRegistrarApproval.decidedBy || 'VC / Registrar',
        text: r.vcRegistrarApproval.remarks,
        timestamp: r.vcRegistrarApproval.decidedAt || ''
      };
    }
    if (r.deanAcademicApproval?.decision === 'Clarification' && r.deanAcademicApproval.remarks) {
      return {
        authorName: r.deanAcademicApproval.decidedBy || 'Dean Academic',
        text: r.deanAcademicApproval.remarks,
        timestamp: r.deanAcademicApproval.decidedAt || ''
      };
    }
    return null;
  };

  // 1. Fresh Pending Scrutiny Queue: Fresh incoming department requisitions with no queries raised yet
  const freshPendingQueue = requests.filter((r) => {
    if (r.status === 'Rejected') return false;
    if (r.deanAcademicApproval?.decision === 'Approved' || r.deanAcademicApproval?.decision === 'Rejected') return false;
    if (r.currentStage >= 3) return false;
    if (hasClarificationDialogue(r)) return false;

    return r.currentStage <= 2 || r.status === 'Request Submitted (Department)';
  });

  // 2. Clarification Queue: Active in-query requisitions (Responded by department OR Awaiting response)
  const clarificationQueue = requests.filter((r) => {
    if (r.status === 'Rejected') return false;
    if (r.deanAcademicApproval?.decision === 'Approved' || r.deanAcademicApproval?.decision === 'Rejected') return false;
    if (r.currentStage >= 3) return false;

    return hasClarificationDialogue(r);
  });

  // 3. Cleared & Forwarded to VC: Approved by Dean Academic and waiting for VC / Registrar administrative sanction
  const forwardedToVCQueue = requests.filter((r) => {
    if (r.status === 'Rejected') return false;
    return (
      r.deanAcademicApproval?.decision === 'Approved' &&
      (!r.vcRegistrarApproval?.decision || r.currentStage === 3 || r.status === 'Under Review (VC / Registrar)')
    );
  });

  // 4. Sanctioned & Approved: Cleared by both Dean Academic and VC / Registrar
  const sanctionedQueue = requests.filter((r) => {
    return (
      r.deanAcademicApproval?.decision === 'Approved' &&
      (r.vcRegistrarApproval?.decision === 'Approved' || r.currentStage >= 4)
    );
  });

  // Rejections history
  const rejectedQueue = requests.filter(
    (r) => r.status === 'Rejected' || r.deanAcademicApproval?.decision === 'Rejected'
  );

  // Sub-counts
  const answeredClarificationsCount = clarificationQueue.filter(isClarificationAnswered).length;

  // Active list determination
  let baseList: IHiringRequest[] = [];
  if (activeTab === 'pending') {
    baseList = freshPendingQueue;
  } else if (activeTab === 'clarifications') {
    baseList = clarificationQueue;
  } else if (activeTab === 'forwarded_vc') {
    baseList = forwardedToVCQueue;
  } else if (activeTab === 'sanctioned') {
    baseList = showRejectionsHistory ? rejectedQueue : sanctionedQueue;
  }

  const displayedList = baseList.filter((r) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.requestId.toLowerCase().includes(q) ||
        r.postTitle.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.creator?.name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openScrutinyModal = (req: IHiringRequest) => {
    setSelectedReqForAction(req);
    setSelectedDecision('approve');
    setApprovalRemark(
      `Academic workload, student-to-faculty norms, and regulatory compliance verified for ${req.department}. Approved.`
    );
    setQueryMessage('');
    setRejectionReason('');
    setModalError('');
  };

  const handleScrutinySubmit = async () => {
    if (!selectedReqForAction) return;
    setModalError('');

    let actionType: 'approve' | 'query' | 'reject' = 'approve';
    let remarksToSend = '';

    if (selectedDecision === 'approve') {
      actionType = 'approve';
      remarksToSend =
        approvalRemark.trim() ||
        `Academic workload verified for ${selectedReqForAction.postTitle} in ${selectedReqForAction.department}. Approved.`;
    } else if (selectedDecision === 'query') {
      actionType = 'query';
      if (!queryMessage.trim()) {
        setModalError('Please enter the clarification / query message for the department dean.');
        return;
      }
      remarksToSend = queryMessage.trim();
    } else if (selectedDecision === 'reject') {
      actionType = 'reject';
      if (!rejectionReason.trim()) {
        setModalError('Please provide a reason / justification for rejecting the academic requirement.');
        return;
      }
      remarksToSend = rejectionReason.trim();
    }

    setIsProcessing(true);
    try {
      if (selectedDecision === 'query') {
        const res = await fetch(`/api/requests/${selectedReqForAction.requestId}/clarifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_thread',
            subject: 'Academic Workload & Teaching Norms Scrutiny',
            creatorName: currentUser?.name || 'Prof. Balwant Singh (Dean Academic)',
            creatorRole: 'Dean Academic',
            creatorEmail: currentUser?.email || 'deanacademic@gurukashiuniv.edu.in',
            primaryRecipientRole: 'Department / Dean',
            primaryRecipientEmail: selectedReqForAction.creator.email,
            primaryRecipientName: selectedReqForAction.creator.name,
            ccRecipients: [],
            messageText: remarksToSend
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to dispatch clarification thread');
        }
      } else {
        const res = await fetch(`/api/dean-academic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId: selectedReqForAction.requestId,
            action: actionType,
            actorName: currentUser?.name || 'Prof. Balwant Singh (Dean Academic)',
            remarks: remarksToSend
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to process academic review');
        }
      }

      setActionSuccessMsg(
        selectedDecision === 'approve'
          ? '✓ Academic clearance granted. Requisition forwarded to VC / Registrar for administrative sanction.'
          : selectedDecision === 'query'
          ? '? Clarification request dispatched to Department Dean.'
          : '✕ Requisition rejected at Academic Scrutiny.'
      );

      setSelectedReqForAction(null);
      onRefresh();
    } catch (err: unknown) {
      setModalError((err as Error).message || 'Failed to process academic review.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-800">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Dean Academic Scrutiny Desk
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review workforce requirements, verify teaching credit hours, and manage departmental clarifications.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-semibold">
          <div className="flex items-center space-x-2 bg-amber-50/70 border border-amber-200 px-3.5 py-1.5 rounded-xl text-amber-950">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>
              Fresh Initial: <strong className="font-bold">{freshPendingQueue.length}</strong>
            </span>
          </div>
          <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-xl text-blue-950">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>
              Clarifications: <strong className="font-bold">{clarificationQueue.length}</strong>
              {answeredClarificationsCount > 0 && (
                <span className="ml-1 text-[11px] text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded font-bold">
                  {answeredClarificationsCount} Answered
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg('')}
            className="text-emerald-600 font-bold hover:text-emerald-800 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 4 Dedicated Tabs */}
      <div className="flex flex-wrap items-center space-x-2 sm:space-x-4 border-b border-slate-200 text-xs font-bold">
        {/* Tab 1: Pending Scrutiny Queue */}
        <button
          onClick={() => {
            setActiveTab('pending');
            setShowRejectionsHistory(false);
          }}
          className={`py-3.5 px-4 border-b-2 transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'pending'
              ? 'border-amber-600 text-amber-900 bg-amber-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-600" />
          <span>1. Pending Scrutiny Queue</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900">
            {freshPendingQueue.length}
          </span>
        </button>

        {/* Tab 2: Clarification Queue */}
        <button
          onClick={() => {
            setActiveTab('clarifications');
            setShowRejectionsHistory(false);
          }}
          className={`py-3.5 px-4 border-b-2 transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'clarifications'
              ? 'border-blue-600 text-blue-900 bg-blue-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span>2. Clarification Queue</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-900">
            {clarificationQueue.length}
          </span>
          {answeredClarificationsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              {answeredClarificationsCount} New Reply
            </span>
          )}
        </button>

        {/* Tab 3: Cleared & Forwarded to VC */}
        <button
          onClick={() => {
            setActiveTab('forwarded_vc');
            setShowRejectionsHistory(false);
          }}
          className={`py-3.5 px-4 border-b-2 transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'forwarded_vc'
              ? 'border-purple-600 text-purple-900 bg-purple-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-4 h-4 text-purple-600" />
          <span>3. Forwarded to VC / Registrar</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-900">
            {forwardedToVCQueue.length}
          </span>
        </button>

        {/* Tab 4: Approved & Sanctioned */}
        <button
          onClick={() => {
            setActiveTab('sanctioned');
          }}
          className={`py-3.5 px-4 border-b-2 transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'sanctioned'
              ? 'border-emerald-600 text-emerald-900 bg-emerald-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>4. Approved / Sanctioned</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900">
            {sanctionedQueue.length}
          </span>
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Search & Sub-Filter Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, department, post, or applicant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>

          {activeTab === 'sanctioned' && (
            <div className="flex items-center space-x-2 text-xs">
              <button
                type="button"
                onClick={() => setShowRejectionsHistory(false)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  !showRejectionsHistory
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Sanctioned Active ({sanctionedQueue.length})
              </button>
              <button
                type="button"
                onClick={() => setShowRejectionsHistory(true)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  showRejectionsHistory
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Rejections History ({rejectedQueue.length})
              </button>
            </div>
          )}

          <div className="text-xs text-slate-500 font-medium">
            {activeTab === 'pending' && 'Fresh department submissions awaiting initial scrutiny.'}
            {activeTab === 'clarifications' && 'Track department responses to academic queries and decide next actions.'}
            {activeTab === 'forwarded_vc' && 'Cleared by Dean Academic and submitted to VC / Registrar for sanction.'}
            {activeTab === 'sanctioned' && (showRejectionsHistory ? 'Academic rejections archive.' : 'Sanctioned by VC and routed to HR for recruitment.')}
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: PENDING SCRUTINY QUEUE */}
        {/* ======================================================== */}
        {activeTab === 'pending' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Requisition ID</th>
                  <th className="py-3.5 px-6">Department & Post</th>
                  <th className="py-3.5 px-6">Workforce & Teaching Load Justification</th>
                  <th className="py-3.5 px-6">Positions</th>
                  <th className="py-3.5 px-6">Review Status</th>
                  <th className="py-3.5 px-6 text-right">Academic Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <div className="font-bold text-slate-700">No Fresh Requisitions Pending Scrutiny</div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        All incoming department requests have been processed or are in clarification.
                      </p>
                    </td>
                  </tr>
                ) : (
                  displayedList.map((req) => (
                    <tr
                      key={req.requestId}
                      className="hover:bg-slate-50/70 transition cursor-pointer"
                      onClick={() => onSelectRequest(req)}
                    >
                      <td className="py-4 px-6 font-mono font-bold text-amber-900">
                        {req.requestId}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-sm">{req.postTitle}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          {req.department} • {req.employmentType} ({req.postLevel})
                        </div>
                      </td>
                      <td className="py-4 px-6 max-w-xs truncate text-slate-600">
                        {req.justification}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800">
                        {req.numberOfPositions} Position(s)
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          {req.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => openScrutinyModal(req)}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                        >
                          Scrutiny Desk &rarr;
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: CLARIFICATION QUEUE (IN-QUERY & RESPONSES) */}
        {/* ======================================================== */}
        {activeTab === 'clarifications' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Requisition ID</th>
                  <th className="py-3.5 px-6">Department & Post</th>
                  <th className="py-3.5 px-6">Clarification Dialogue (Query & Reply)</th>
                  <th className="py-3.5 px-6">Clarification Status</th>
                  <th className="py-3.5 px-6 text-right">Academic Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <CheckCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                      <div className="font-bold text-slate-700">No Active Clarification Queries</div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        There are no requisitions currently returned for clarification or awaiting review.
                      </p>
                    </td>
                  </tr>
                ) : (
                  displayedList.map((req) => {
                    const answered = isClarificationAnswered(req);
                    const latestReply = getLatestDepartmentReply(req);
                    const latestQuery = getLatestDeanAcademicQuery(req);

                    return (
                      <tr
                        key={req.requestId}
                        className={`transition cursor-pointer ${
                          answered ? 'bg-blue-50/20 hover:bg-blue-50/40' : 'hover:bg-slate-50/70'
                        }`}
                        onClick={() => openScrutinyModal(req)}
                      >
                        <td className="py-4 px-6 font-mono font-bold text-blue-900 align-top">
                          {req.requestId}
                        </td>

                        <td className="py-4 px-6 align-top">
                          <div className="font-bold text-slate-900 text-sm">{req.postTitle}</div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            {req.department} • {req.numberOfPositions} Position(s)
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-1">
                            Budget: {req.tentativeBudget}
                          </div>
                        </td>

                        {/* Clarification Dialogue Summary */}
                        <td className="py-4 px-6 max-w-md space-y-2 align-top">
                          {/* Query Asked (Dean Academic or VC / Registrar) */}
                          {latestQuery && (
                            <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-950">
                              <div className="flex items-center space-x-1 font-bold text-amber-900 text-[10px] uppercase mb-0.5">
                                <HelpCircle className="w-3 h-3 text-amber-600" />
                                <span>
                                  {req.vcRegistrarApproval?.decision === 'Clarification' || latestQuery.authorName?.includes('VC')
                                    ? 'VC / Registrar Query:'
                                    : 'Dean Academic Query:'}
                                </span>
                              </div>
                              <p className="line-clamp-2 italic text-slate-700">&ldquo;{latestQuery.text}&rdquo;</p>
                            </div>
                          )}

                          {/* Department Dean's Response */}
                          {latestReply ? (
                            <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-[11px] text-emerald-950">
                              <div className="flex items-center space-x-1 font-bold text-emerald-900 text-[10px] uppercase mb-0.5">
                                <CheckCheck className="w-3 h-3 text-emerald-600" />
                                <span>Department Clarification Submitted:</span>
                              </div>
                              <p className="line-clamp-2 font-medium text-slate-800">
                                {latestReply.text}
                              </p>
                              <div className="text-[10px] text-emerald-700 mt-1">
                                By {latestReply.authorName} • {new Date(latestReply.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 italic">
                              Awaiting department dean workload clarification response...
                            </div>
                          )}
                        </td>

                        {/* Clarification Status Badge */}
                        <td className="py-4 px-6 align-top">
                          {answered ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                                <span>Clarification Answered</span>
                              </span>
                              <div className="text-[10px] font-semibold text-emerald-700">
                                Ready for Scrutiny Decision
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pending Dept. Reply</span>
                              </span>
                              <div className="text-[10px] text-slate-400">
                                Returned for clarification
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Action Button */}
                        <td className="py-4 px-6 text-right align-top" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => openScrutinyModal(req)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center space-x-1.5 ml-auto ${
                              answered
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                            }`}
                          >
                            <span>{answered ? 'Review & Decide' : 'View / Amend Query'}</span>
                            <span>&rarr;</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: CLEARED & FORWARDED TO VC / REGISTRAR */}
        {/* ======================================================== */}
        {activeTab === 'forwarded_vc' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Requisition ID</th>
                  <th className="py-3.5 px-6">Department & Post</th>
                  <th className="py-3.5 px-6">Dean Academic Clearance Remarks</th>
                  <th className="py-3.5 px-6">VC / Registrar Status</th>
                  <th className="py-3.5 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <Send className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <div className="font-bold text-slate-700">No Requisitions Awaiting VC Sanction</div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Cleared requisitions will show here while awaiting VC / Registrar sanction.
                      </p>
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
                          {req.department} • {req.numberOfPositions} Position(s)
                        </div>
                      </td>
                      <td className="py-4 px-6 max-w-sm">
                        <div className="text-emerald-900 font-medium bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                          &ldquo;{req.deanAcademicApproval?.remarks || 'Academic workload cleared.'}&rdquo;
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Decided By: {req.deanAcademicApproval?.decidedBy || 'Dean Academic'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-900 border border-purple-200">
                          {req.status === 'Under Review (VC / Registrar)' ? 'Under VC Review' : req.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onSelectRequest(req)}
                          className="text-purple-700 hover:text-purple-900 font-bold text-xs cursor-pointer"
                        >
                          View Clearance &rarr;
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: SANCTIONED & ACTIVE PIPELINE */}
        {/* ======================================================== */}
        {activeTab === 'sanctioned' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Requisition ID</th>
                  <th className="py-3.5 px-6">Department & Post</th>
                  <th className="py-3.5 px-6">Dual Clearance Trail</th>
                  <th className="py-3.5 px-6">Recruitment Milestone</th>
                  <th className="py-3.5 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <div className="font-bold text-slate-700">
                        {showRejectionsHistory ? 'No Rejections Found' : 'No Sanctioned Requisitions Yet'}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {showRejectionsHistory
                          ? 'No requisitions have been rejected at academic or administrative stage.'
                          : 'Requisitions will appear here once sanctioned by the Vice Chancellor / Registrar.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  displayedList.map((req) => (
                    <tr
                      key={req.requestId}
                      className="hover:bg-slate-50/70 transition cursor-pointer"
                      onClick={() => onSelectRequest(req)}
                    >
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">
                        {req.requestId}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-sm">{req.postTitle}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          {req.department} • {req.numberOfPositions} Position(s)
                        </div>
                      </td>
                      <td className="py-4 px-6 space-y-1">
                        <div className="flex items-center space-x-1.5 text-[11px] text-emerald-800 font-semibold">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Academic Clearance: Approved</span>
                        </div>
                        {req.vcRegistrarApproval?.decision && (
                          <div
                            className={`flex items-center space-x-1.5 text-[11px] font-semibold ${
                              req.vcRegistrarApproval.decision === 'Approved'
                                ? 'text-purple-800'
                                : 'text-rose-700'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>VC Sanction: {req.vcRegistrarApproval.decision}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            req.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onSelectRequest(req)}
                          className="text-blue-700 hover:text-blue-900 font-bold text-xs cursor-pointer"
                        >
                          View Details &rarr;
                        </button>
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
      {/* STRUCTURED ACADEMIC SCRUTINY & CLARIFICATION MODAL */}
      {/* ======================================================== */}
      {selectedReqForAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                  {selectedReqForAction.requestId}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Academic Scrutiny: {selectedReqForAction.postTitle}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedReqForAction.department} • {selectedReqForAction.numberOfPositions} Position(s) • Package: {selectedReqForAction.tentativeBudget}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReqForAction(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>


            {/* Department's Original Justification & Qualifications */}
            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <strong className="block text-slate-700 font-semibold mb-1">
                  Department Workload & Faculty Deficit Justification:
                </strong>
                <p className="text-slate-800 leading-relaxed font-normal bg-white p-2.5 rounded-lg border border-slate-100">
                  {selectedReqForAction.justification}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <strong className="block text-slate-700 font-semibold mb-1">
                    Statutory Qualifications:
                  </strong>
                  <p className="text-slate-800 font-normal bg-white p-2 rounded-lg border border-slate-100">
                    {selectedReqForAction.requiredQualifications}
                  </p>
                </div>
                <div>
                  <strong className="block text-slate-700 font-semibold mb-1">
                    Experience Criteria:
                  </strong>
                  <p className="text-slate-800 font-normal bg-white p-2 rounded-lg border border-slate-100">
                    {selectedReqForAction.experienceRequired}
                  </p>
                </div>
              </div>
            </div>

            {/* Inline Error Banner */}
            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Section 1: Decision Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Academic Scrutiny Decision
              </label>
              <div className="grid grid-cols-3 gap-3">
                {/* 1. Approve */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDecision('approve');
                    setModalError('');
                  }}
                  className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                    selectedDecision === 'approve'
                      ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-bold text-xs text-emerald-900">
                    <CheckCircle2 className={`w-4 h-4 ${selectedDecision === 'approve' ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <span>Approve Clearance</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Verify & forward to VC
                  </p>
                </button>

                {/* 2. Query */}
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
                    <span>Seek Clarification</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Ask more questions
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
                    <span>Reject Requirement</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Decline academic approval
                  </p>
                </button>
              </div>
            </div>

            {/* Section 2: Dynamic Form based on Selection */}
            {selectedDecision === 'approve' && (
              <div className="space-y-2 bg-emerald-50/40 p-4 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-emerald-950">
                    Academic Scrutiny & Teaching Load Clearance Remarks
                  </label>
                  <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded">
                    Action: Forward to VC / Registrar
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Confirm credit-hour workload audit, faculty-student ratio deficit, and UGC/AICTE compliance.
                </p>
                <textarea
                  rows={3}
                  value={approvalRemark}
                  onChange={(e) => setApprovalRemark(e.target.value)}
                  placeholder="State workload verification findings, student-to-faculty norms compliance..."
                  className="w-full p-3 text-xs bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            )}

            {selectedDecision === 'query' && (
              <div className="space-y-2 bg-amber-50/40 p-4 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-amber-950">
                    Clarification Query / Additional Question to Department Dean <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[11px] text-amber-800 font-semibold bg-amber-100/80 px-2 py-0.5 rounded">
                    Action: Return to Department
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Specify what teaching load data, student enrollment figures, or justification details are missing.
                </p>
                <textarea
                  rows={3}
                  value={queryMessage}
                  onChange={(e) => {
                    setQueryMessage(e.target.value);
                    if (modalError) setModalError('');
                  }}
                  placeholder="Specify clarification points or additional questions for the Department Dean..."
                  className="w-full p-3 text-xs bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            )}

            {selectedDecision === 'reject' && (
              <div className="space-y-2 bg-rose-50/40 p-4 rounded-xl border border-rose-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-rose-950">
                    Academic Rejection Rationale <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[11px] text-rose-800 font-semibold bg-rose-100/80 px-2 py-0.5 rounded">
                    Action: Close as Rejected
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Provide grounds for rejecting the hiring requisition (e.g., adequate existing teaching load, no ratio deficit).
                </p>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (modalError) setModalError('');
                  }}
                  placeholder="Enter specific reasons for rejecting the faculty requirement..."
                  className="w-full p-3 text-xs bg-white border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            )}

            {/* Footer with Tailored Submit Button */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReqForAction(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                Cancel
              </button>

              <div>
                {selectedDecision === 'approve' && (
                  <button
                    type="button"
                    onClick={handleScrutinySubmit}
                    disabled={isProcessing}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    <span>{isProcessing ? 'Processing Clearance...' : 'Grant Clearance & Forward to VC'}</span>
                  </button>
                )}

                {selectedDecision === 'query' && (
                  <button
                    type="button"
                    onClick={handleScrutinySubmit}
                    disabled={isProcessing || !queryMessage.trim()}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isProcessing ? 'Sending Query...' : 'Send Query to Department'}</span>
                  </button>
                )}

                {selectedDecision === 'reject' && (
                  <button
                    type="button"
                    onClick={handleScrutinySubmit}
                    disabled={isProcessing || !rejectionReason.trim()}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
                  >
                    <Ban className="w-4 h-4" />
                    <span>{isProcessing ? 'Rejecting...' : 'Confirm Academic Rejection'}</span>
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
