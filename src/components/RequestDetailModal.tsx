'use client';

import React, { useState, useEffect } from 'react';
import { IHiringRequest, UserRole } from '@/lib/types';
import { POST_LEVELS } from '@/lib/constants';
import {
  X,
  History,
  Edit2,
  Lock,
  Briefcase
} from 'lucide-react';

interface RequestDetailModalProps {
  request: IHiringRequest | null;
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onActionComplete: () => void;
}

export function RequestDetailModal({
  request,
  isOpen,
  onClose,
  currentRole,
  onActionComplete
}: RequestDetailModalProps) {
  // Edit mode state for Department / Dean
  const [isDeanEditing, setIsDeanEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(request?.postTitle || '');
  const [editPostLevel, setEditPostLevel] = useState(request?.postLevel || 'Assistant Professor');
  const [editPositions, setEditPositions] = useState(request?.numberOfPositions || 1);
  const [editBudget, setEditBudget] = useState(request?.tentativeBudget || '');
  const [editJustification, setEditJustification] = useState(request?.justification || '');
  const [editQualifications, setEditQualifications] = useState(request?.requiredQualifications || '');
  const [editExperience, setEditExperience] = useState(request?.experienceRequired || '2 - 5 Years');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccessMsg, setEditSuccessMsg] = useState('');

  // Sync state when request changes
  useEffect(() => {
    if (request) {
      setEditTitle(request.postTitle || '');
      setEditPostLevel(request.postLevel || 'Assistant Professor');
      setEditPositions(request.numberOfPositions || 1);
      setEditBudget(request.tentativeBudget || '');
      setEditJustification(request.justification || '');
      setEditQualifications(request.requiredQualifications || '');
      setEditExperience(request.experienceRequired || '2 - 5 Years');
      setIsDeanEditing(false);
      setEditError('');
      setEditSuccessMsg('');
    }
  }, [request]);

  if (!isOpen || !request) return null;

  const isReviewedByDeanAcademic =
    (request.currentStage || 1) >= 3 ||
    request.status === 'Approved by Dean Academic' ||
    request.status === 'Approved by VC / Registrar' ||
    request.status === 'Rejected' ||
    (request.deanAcademicApproval && request.deanAcademicApproval.decision === 'Approved');

  const canDeanEdit = (currentRole === 'Department / Dean') && !isReviewedByDeanAcademic;

  const handleSaveDeanEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editJustification.trim() || !editQualifications.trim()) {
      setEditError('Please complete post title, workload justification, and qualifications.');
      return;
    }
    setIsSavingEdit(true);
    setEditError('');
    try {
      const res = await fetch(`/api/requests/${request.requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postTitle: editTitle.trim(),
          postLevel: editPostLevel,
          numberOfPositions: Number(editPositions),
          tentativeBudget: editBudget.trim(),
          justification: editJustification.trim(),
          requiredQualifications: editQualifications.trim(),
          experienceRequired: editExperience.trim()
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save changes');
      }
      setEditSuccessMsg('✓ Requisition details updated successfully.');
      setIsDeanEditing(false);
      onActionComplete();
    } catch (err: unknown) {
      setEditError((err as Error).message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        
        {/* Header - Simple & Clean */}
        <div className="px-7 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div className="space-y-1 flex-1 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                {request.requestId}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {request.department}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-600">
                {request.employmentType} ({request.postLevel})
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {request.postTitle}
            </h2>

            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 pt-0.5">
              <span>Openings: <strong className="text-slate-800">{request.numberOfPositions} Position(s)</strong></span>
              <span>•</span>
              <span>Package: <strong className="text-slate-800">{request.tentativeBudget}</strong></span>
              <span>•</span>
              <span>Status: <strong className="text-blue-700">{request.status}</strong></span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {canDeanEdit && (
              <button
                type="button"
                onClick={() => setIsDeanEditing(!isDeanEditing)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isDeanEditing ? 'Cancel' : 'Edit Details'}</span>
              </button>
            )}

            {currentRole === 'Department / Dean' && isReviewedByDeanAcademic && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[11px] font-semibold">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Locked</span>
              </span>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body: Job Details + Simple Timeline */}
        <div className="p-7 overflow-y-auto flex-1 space-y-6">
          
          {/* Notifications */}
          {editSuccessMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between">
              <span>{editSuccessMsg}</span>
              <button onClick={() => setEditSuccessMsg('')} className="text-emerald-600 font-bold">✕</button>
            </div>
          )}

          {editError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
              {editError}
            </div>
          )}

          {/* EDIT FORM (Only when Department Dean clicks Edit) */}
          {isDeanEditing ? (
            <form onSubmit={handleSaveDeanEdit} className="bg-slate-50/70 p-4 rounded-xl border border-blue-200 space-y-3.5 text-xs">
              <div className="font-bold text-blue-900 text-xs uppercase tracking-wider pb-1.5 border-b border-slate-200">
                Edit Job Specifications
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Post Title / Specialization *
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Designation Level *
                  </label>
                  <select
                    value={editPostLevel}
                    onChange={(e) => setEditPostLevel(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 bg-white"
                  >
                    {POST_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Number of Openings *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={editPositions}
                    onChange={(e) => setEditPositions(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold text-slate-800 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Budgeted Salary Package
                  </label>
                  <input
                    type="text"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Workforce Need & Teaching Load Justification *
                </label>
                <textarea
                  rows={2}
                  value={editJustification}
                  onChange={(e) => setEditJustification(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-normal text-slate-800 bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Statutory Qualifications (UGC / AICTE) *
                  </label>
                  <textarea
                    rows={2}
                    value={editQualifications}
                    onChange={(e) => setEditQualifications(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-normal text-slate-800 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Experience Criteria
                  </label>
                  <input
                    type="text"
                    value={editExperience}
                    onChange={(e) => setEditExperience(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 bg-white"
                  />
                </div>
              </div>

              <div className="pt-1 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsDeanEditing(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition disabled:opacity-50"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            /* SIMPLE JOB DETAILS */
            <div className="space-y-4">
              {/* 4 Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Department</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{request.department}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Cadre & Level</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{request.employmentType} ({request.postLevel})</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Positions</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{request.numberOfPositions} Position(s)</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Budgeted Salary</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{request.tentativeBudget}</span>
                </div>
              </div>

              {/* Justification Box */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Workforce Need & Teaching Load Justification
                </h4>
                <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-normal">
                  {request.justification || '—'}
                </div>
              </div>

              {/* Qualifications & Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Statutory Qualifications (UGC / AICTE)
                  </h4>
                  <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-normal">
                    {request.requiredQualifications || '—'}
                  </div>
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Experience Criteria
                  </h4>
                  <div className="bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-normal">
                    {request.experienceRequired || '—'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VERY SIMPLE & CLEAN TIMELINE */}
          <div className="pt-5 border-t border-slate-200 space-y-3.5">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Recruitment Timeline & History
              </h4>
            </div>

            <div className="relative pl-6 space-y-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              
              {/* Event 1: Requirement Submitted */}
              <div className="relative flex items-start space-x-3">
                <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">
                  ✓
                </div>
                <div className="flex-1 bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-0.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">1. Job Requirement Submitted</span>
                    <span className="text-[11px] text-slate-400 font-medium">{formatDate(request.createdAt)}</span>
                  </div>
                  <div className="text-slate-600">
                    Submitted by <strong className="text-slate-800">{request.creator?.name || 'Department Dean'}</strong> ({request.department})
                  </div>
                </div>
              </div>

              {/* Event 2: Dean Academic Scrutiny */}
              {request.deanAcademicApproval ? (
                <div className="relative flex items-start space-x-3">
                  <div className={`absolute -left-6 mt-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
                    request.deanAcademicApproval.decision === 'Approved' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}>
                    {request.deanAcademicApproval.decision === 'Approved' ? '✓' : '✕'}
                  </div>
                  <div className="flex-1 bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        2. Dean Academic Scrutiny:{' '}
                        <span className={request.deanAcademicApproval.decision === 'Approved' ? 'text-emerald-700' : 'text-rose-700'}>
                          {request.deanAcademicApproval.decision === 'Approved' ? 'Approved & Cleared ✓' : 'Rejected'}
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">{formatDate(request.deanAcademicApproval.decidedAt)}</span>
                    </div>
                    <div className="text-slate-600">
                      Reviewed by <strong className="text-slate-800">{request.deanAcademicApproval.decidedBy}</strong>
                    </div>
                    {request.deanAcademicApproval.remarks && (
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80 text-slate-700 italic">
                        &ldquo;{request.deanAcademicApproval.remarks}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative flex items-start space-x-3">
                  <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-amber-400 text-white flex items-center justify-center text-[9px] font-bold">
                    •
                  </div>
                  <div className="flex-1 bg-amber-50/50 p-3 rounded-xl border border-amber-200/80 text-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950">2. Dean Academic Scrutiny</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md">
                        Under Review / Clarification
                      </span>
                    </div>
                    <div className="text-slate-600">
                      Workload norms and statutory qualifications under verification by Dean Academic.
                    </div>
                  </div>
                </div>
              )}

              {/* Event 3: VC / Registrar Sanction */}
              {request.vcRegistrarApproval ? (
                <div className="relative flex items-start space-x-3">
                  <div className={`absolute -left-6 mt-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
                    request.vcRegistrarApproval.decision === 'Approved' ? 'bg-purple-600' : 'bg-rose-500'
                  }`}>
                    {request.vcRegistrarApproval.decision === 'Approved' ? '✓' : '✕'}
                  </div>
                  <div className="flex-1 bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        3. VC / Registrar Sanction:{' '}
                        <span className={request.vcRegistrarApproval.decision === 'Approved' ? 'text-purple-700' : 'text-rose-700'}>
                          {request.vcRegistrarApproval.decision === 'Approved' ? 'Sanction Accorded ✓' : 'Rejected'}
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">{formatDate(request.vcRegistrarApproval.decidedAt)}</span>
                    </div>
                    <div className="text-slate-600">
                      Authority: <strong className="text-slate-800">{request.vcRegistrarApproval.decidedBy}</strong>
                    </div>
                    {request.vcRegistrarApproval.remarks && (
                      <div className="bg-purple-50/60 p-2 rounded-lg border border-purple-200/60 text-purple-950 italic">
                        &ldquo;{request.vcRegistrarApproval.remarks}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
              ) : (request.deanAcademicApproval?.decision === 'Approved' || (request.currentStage || 1) >= 3) ? (
                <div className="relative flex items-start space-x-3">
                  <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-purple-500 text-white flex items-center justify-center text-[9px] font-bold">
                    •
                  </div>
                  <div className="flex-1 bg-purple-50/50 p-3 rounded-xl border border-purple-200/80 text-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-950">3. VC / Registrar Executive Sanction</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-900 rounded-md">
                        Awaiting Sanction
                      </span>
                    </div>
                    <div className="text-slate-600">
                      Dispatched to VC / Registrar desk following Academic Clearance.
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Event 4: HR Cell Status (if VC approved) */}
              {request.vcRegistrarApproval?.decision === 'Approved' && (
                <div className="relative flex items-start space-x-3">
                  <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
                    ✓
                  </div>
                  <div className="flex-1 bg-blue-50/40 p-3 rounded-xl border border-blue-200/80 text-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-950">4. HR Recruitment Cell</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-900 rounded-md">
                        Active for Hiring
                      </span>
                    </div>
                    <div className="text-slate-600">
                      Sanction accorded. Released to HR Recruitment Cell for advertisement release and candidate applications.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-mono text-slate-400 font-semibold">{request.requestId}</span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
