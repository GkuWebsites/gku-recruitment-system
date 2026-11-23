'use client';

import React, { useState } from 'react';
import { IHiringRequest, IClarificationThread } from '@/lib/types';
import { canUserViewThread } from '@/lib/clarificationPermissions';
import { X, CheckCircle2, Clock, MessageSquare, Users, Shield, Send } from 'lucide-react';

interface TimelineModalProps {
  request: IHiringRequest | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    name: string;
    email: string;
    designation: string;
    department?: string;
  } | null;
}

export function TimelineModal({ request, isOpen, onClose, currentUser }: TimelineModalProps) {
  const [activeTab, setActiveTab] = useState<'milestones' | 'conversations'>('milestones');

  if (!isOpen || !request) return null;

  const currentStage = request.currentStage || 1;

  // Filter threads that the current user has permission to view
  const visibleThreads: IClarificationThread[] = (request.clarificationThreads || []).filter((t) =>
    canUserViewThread(t, currentUser, request)
  );

  // Decision states
  const daDecided = !!request.deanAcademicApproval?.decision;
  const vcDecided = !!request.vcRegistrarApproval?.decision;
  const hrActed = currentStage >= 4 && (request.promotionChannels?.length > 0 || request.status === 'In Process (HR - Recruitment)');
  const interviewActed = currentStage >= 5 && request.candidates?.some((c) => c.interviewDetails);
  const joinedActed = request.status === 'Joined & Request Closed';

  const steps = [
    // Stage 1: Department Submission
    {
      num: 1,
      name: 'Department Requisition Submission',
      role: 'Dean / Department',
      status: 'Submitted',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      actionBy: request.creator?.name || 'Department Dean',
      date: request.createdAt
        ? new Date(request.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })
        : '—',
      remark: request.justification || 'Submitted for academic scrutiny.'
    },

    // Stage 2: Academic Scrutiny (Dean Academic)
    {
      num: 2,
      name: 'Dean Academic Scrutiny',
      role: 'Dean Academic',
      status: daDecided ? request.deanAcademicApproval!.decision : 'Awaiting',
      badgeColor: daDecided
        ? request.deanAcademicApproval!.decision === 'Approved'
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : request.deanAcademicApproval!.decision === 'Rejected'
          ? 'bg-rose-50 text-rose-800 border-rose-200'
          : 'bg-amber-50 text-amber-800 border-amber-200'
        : 'bg-slate-100 text-slate-500 border-slate-200',
      actionBy: daDecided
        ? request.deanAcademicApproval?.decidedBy || 'Dean Academic'
        : '—',
      date: daDecided && request.deanAcademicApproval?.decidedAt
        ? new Date(request.deanAcademicApproval.decidedAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })
        : '—',
      remark: daDecided
        ? request.deanAcademicApproval?.remarks || 'Approved without additional remarks.'
        : 'Awaiting'
    },

    // Stage 3: Administrative Sanction (VC / Registrar)
    {
      num: 3,
      name: 'VC / Registrar Administrative Sanction',
      role: 'VC / Registrar',
      status: vcDecided ? request.vcRegistrarApproval!.decision : 'Awaiting',
      badgeColor: vcDecided
        ? request.vcRegistrarApproval!.decision === 'Approved'
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : request.vcRegistrarApproval!.decision === 'Rejected'
          ? 'bg-rose-50 text-rose-800 border-rose-200'
          : 'bg-amber-50 text-amber-800 border-amber-200'
        : 'bg-slate-100 text-slate-500 border-slate-200',
      actionBy: vcDecided
        ? request.vcRegistrarApproval?.decidedBy || 'VC / Registrar'
        : '—',
      date: vcDecided && request.vcRegistrarApproval?.decidedAt
        ? new Date(request.vcRegistrarApproval.decidedAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })
        : '—',
      remark: vcDecided
        ? request.vcRegistrarApproval?.remarks || 'Sanction granted.'
        : 'Awaiting'
    },

    // Stage 4: HR Job Sourcing & Ad Spend
    {
      num: 4,
      name: 'HR Job Sourcing & Advertising',
      role: 'HR Department',
      status: hrActed ? 'In Recruitment' : 'Awaiting',
      badgeColor: hrActed
        ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
        : 'bg-slate-100 text-slate-500 border-slate-200',
      actionBy: hrActed ? 'HR Recruitment Cell' : '—',
      date: hrActed ? 'Active' : '—',
      remark: hrActed
        ? request.promotionChannels?.length
          ? `Posted on: ${request.promotionChannels.map((p) => p.channelName).join(', ')}`
          : 'Job postings active.'
        : 'Awaiting'
    },

    // Stage 5: Selection Panel & Interviews
    {
      num: 5,
      name: 'Interviews & Panel Evaluation',
      role: 'Selection Committee',
      status: interviewActed ? 'Interview Conducted' : 'Awaiting',
      badgeColor: interviewActed
        ? 'bg-teal-50 text-teal-800 border-teal-200'
        : 'bg-slate-100 text-slate-500 border-slate-200',
      actionBy: interviewActed ? 'Selection Panel' : '—',
      date: interviewActed ? 'Completed' : '—',
      remark: interviewActed
        ? 'Interview scores and recommendation evaluated by committee.'
        : 'Awaiting'
    },

    // Stage 6: Formal Joining
    {
      num: 6,
      name: 'Offer Letter & Onboarding',
      role: 'Registrar Office & HR',
      status: joinedActed ? 'Joined & Closed' : 'Awaiting',
      badgeColor: joinedActed
        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
        : 'bg-slate-100 text-slate-500 border-slate-200',
      actionBy: joinedActed ? 'HR Onboarding' : '—',
      date: joinedActed ? 'Completed' : '—',
      remark: joinedActed ? 'Candidate verified and joined university.' : 'Awaiting'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in-50 duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-white">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {request.requestId}
              </span>
              <span className="text-xs font-semibold text-slate-500">{request.department}</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              Workflow Timeline & Communication Trail
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Current Status: <strong className="text-blue-700">{request.status}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center space-x-3 px-6 border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('milestones')}
            className={`py-3 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'milestones'
                ? 'border-blue-600 text-blue-800 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Governance Milestones</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('conversations')}
            className={`py-3 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'conversations'
                ? 'border-blue-600 text-blue-800 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Clarification Conversations</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-extrabold">
              {visibleThreads.length}
            </span>
          </button>
        </div>

        {/* TAB 1: GOVERNANCE MILESTONES */}
        {activeTab === 'milestones' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {steps.map((step) => {
                const isAwaiting = step.status === 'Awaiting';

                return (
                  <div key={step.num} className="relative">
                    {/* Step Dot */}
                    <div
                      className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition ${
                        !isAwaiting
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-slate-300 text-slate-400'
                      }`}
                    >
                      {!isAwaiting ? '✓' : step.num}
                    </div>

                    {/* Step Card */}
                    <div
                      className={`p-3.5 rounded-xl border transition ${
                        !isAwaiting
                          ? 'bg-slate-50/70 border-slate-200/90'
                          : 'bg-white border-slate-200/60 opacity-60'
                      }`}
                    >
                      {/* Header: Stage Name & Status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-bold text-slate-900">
                          Stage {step.num}: {step.name}
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${step.badgeColor}`}
                        >
                          {step.status}
                        </span>
                      </div>

                      {/* Action By & Date (Only if given) */}
                      {!isAwaiting && (
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-2">
                          <span>Action by: <strong className="text-slate-700">{step.actionBy}</strong></span>
                          {step.date !== '—' && (
                            <>
                              <span>•</span>
                              <span>{step.date}</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Remark */}
                      <div className="mt-2 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Remark:
                        </span>
                        <p
                          className={`leading-relaxed ${
                            isAwaiting ? 'text-slate-400 italic font-medium' : 'text-slate-700 font-medium'
                          }`}
                        >
                          {step.remark}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: PERMISSION-AWARE CLARIFICATION CONVERSATIONS */}
        {activeTab === 'conversations' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {visibleThreads.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <div className="font-bold text-slate-700 text-xs">No Clarification Conversations</div>
                <p className="text-[11px] text-slate-400 mt-1">
                  No clarification questions have been raised, or conversations are private to other roles.
                </p>
              </div>
            ) : (
              visibleThreads.map((thread) => (
                <div
                  key={thread.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs"
                >
                  {/* Thread Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{thread.subject}</h4>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Initiated by <strong className="text-slate-700">{thread.creatorName}</strong> ({thread.creatorRole})
                        &nbsp;&bull;&nbsp;
                        Target: <strong className="text-blue-700">{thread.primaryRecipientRole}</strong>
                      </div>
                    </div>

                    {/* CC list */}
                    {thread.ccRecipients?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 text-[10px]">
                        <span className="font-bold text-slate-400">CC:</span>
                        {thread.ccRecipients.map((cc) => (
                          <span
                            key={cc.email}
                            className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200"
                          >
                            {cc.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message Stream */}
                  <div className="space-y-2.5 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    {thread.messages.map((msg, i) => (
                      <div key={msg.id || i} className="text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                          <span className="font-bold text-slate-800">
                            {msg.senderName} ({msg.senderRole})
                          </span>
                          <span>
                            {new Date(msg.timestamp).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200/80 leading-relaxed font-normal">
                          {msg.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-mono text-slate-400">{request.requestId}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
