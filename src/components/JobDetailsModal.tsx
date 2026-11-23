'use client';

import React, { useState, useEffect } from 'react';
import { IHiringRequest } from '@/lib/types';
import { POST_LEVELS } from '@/lib/constants';
import {
  X,
  Edit2,
  Lock,
  Building2,
  Briefcase,
  GraduationCap,
  Award,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Clock
} from 'lucide-react';

interface JobDetailsModalProps {
  request: IHiringRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function JobDetailsModal({
  request,
  isOpen,
  onClose,
  onSuccess
}: JobDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editPostLevel, setEditPostLevel] = useState('');
  const [editPositions, setEditPositions] = useState(1);
  const [editBudget, setEditBudget] = useState('');
  const [editJustification, setEditJustification] = useState('');
  const [editQualifications, setEditQualifications] = useState('');
  const [editExperience, setEditExperience] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (request) {
      setEditTitle(request.postTitle || '');
      setEditPostLevel(request.postLevel || 'Assistant Professor');
      setEditPositions(request.numberOfPositions || 1);
      setEditBudget(request.tentativeBudget || '');
      setEditJustification(request.justification || '');
      setEditQualifications(request.requiredQualifications || '');
      setEditExperience(request.experienceRequired || '2 - 5 Years');
      setIsEditing(false);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [request]);

  if (!isOpen || !request) return null;

  // Edit condition: Can edit UNTIL reviewed by Dean Academic
  const isReviewedByDeanAcademic =
    (request.currentStage || 1) >= 3 ||
    request.status === 'Approved by Dean Academic' ||
    request.status === 'Approved by VC / Registrar' ||
    request.status === 'Rejected' ||
    (request.deanAcademicApproval && request.deanAcademicApproval.decision === 'Approved');

  const canEdit = !isReviewedByDeanAcademic;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editJustification.trim() || !editQualifications.trim()) {
      setErrorMsg('Please complete post title, workload justification, and qualifications.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

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
        throw new Error(data.error || 'Failed to update job details');
      }

      setSuccessMsg('✓ Job requisition details successfully updated.');
      setIsEditing(false);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in-50 duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header - Clean, Modern Executive Style */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                {request.requestId}
              </span>
              <span className="text-xs font-semibold text-slate-500">{request.department}</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-600">
                {request.employmentType} ({request.postLevel})
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {request.postTitle}
            </h2>

            <div className="flex items-center space-x-2 text-xs text-slate-500 pt-0.5">
              <span>Status:</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                {request.status}
              </span>
              <span>•</span>
              <span className="text-slate-500 font-medium">Stage {request.currentStage || 1} of 6</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {canEdit ? (
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isEditing
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Cancel Edit' : 'Edit Details'}</span>
              </button>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[11px] font-semibold">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Locked (Reviewed by Dean Academic)</span>
              </span>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback Banners */}
        {successMsg && (
          <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-600 font-bold">✕</button>
          </div>
        )}

        {errorMsg && (
          <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="text-rose-600 font-bold">✕</button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {isEditing ? (
            /* ================= EDIT MODE ================= */
            <form onSubmit={handleSave} className="space-y-4">
              {/* Card 1: Position Details */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3.5">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5 border-b border-slate-200/60 pb-2">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. Position & Designation</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Post Title / Specialization:
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Designation Level:
                    </label>
                    <select
                      value={editPostLevel}
                      onChange={(e) => setEditPostLevel(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {POST_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Openings / Positions:
                    </label>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setEditPositions(Math.max(1, editPositions - 1))}
                        className="p-2.5 bg-white border border-r-0 border-slate-200 rounded-l-xl text-slate-600 hover:bg-slate-100 transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={editPositions}
                        onChange={(e) => setEditPositions(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-white border-y border-slate-200 p-2 text-center font-bold text-slate-900 focus:outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setEditPositions(editPositions + 1)}
                        className="p-2.5 bg-white border border-l-0 border-slate-200 rounded-r-xl text-slate-600 hover:bg-slate-100 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Budgeted Salary Head:
                    </label>
                    <input
                      type="text"
                      value={editBudget}
                      onChange={(e) => setEditBudget(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Workload & Requirements */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3.5">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                  <span>2. Workload & Qualification Criteria</span>
                </span>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Teaching Load & Faculty Deficit Justification:
                  </label>
                  <textarea
                    rows={2}
                    value={editJustification}
                    onChange={(e) => setEditJustification(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Required Statutory Qualifications:
                  </label>
                  <textarea
                    rows={2}
                    value={editQualifications}
                    onChange={(e) => setEditQualifications(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">
                      Experience Requirements:
                    </label>
                    <div className="flex items-center space-x-1 text-[10px]">
                      {['0-2 Years', '2-5 Years', '5-8 Years', '8+ Years'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setEditExperience(preset)}
                          className={`px-2 py-0.5 rounded-md border transition ${
                            editExperience === preset
                              ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={editExperience}
                    onChange={(e) => setEditExperience(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Requisition Changes'}
                </button>
              </div>
            </form>
          ) : (
            /* ================= VIEW MODE ================= */
            <div className="space-y-4">
              {/* 4 Clean Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  <div className="text-[11px] font-semibold text-slate-500">Department</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">{request.department}</div>
                </div>

                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  <div className="text-[11px] font-semibold text-slate-500">Cadre & Level</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">{request.employmentType} • {request.postLevel}</div>
                </div>

                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  <div className="text-[11px] font-semibold text-slate-500">Positions</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">{request.numberOfPositions} Vacancy(s)</div>
                </div>

                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  <div className="text-[11px] font-semibold text-slate-500">Budget Head</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">{request.tentativeBudget}</div>
                </div>
              </div>

              {/* Workforce Need & Teaching Load */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Workforce Need & Teaching Load Justification</span>
                </span>
                <p className="text-slate-800 text-xs leading-relaxed font-normal bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                  {request.justification}
                </p>
              </div>

              {/* Statutory Qualifications & Experience */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                  <Award className="w-3.5 h-3.5 text-blue-600" />
                  <span>Statutory Qualifications & Eligibility Norms</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500">Statutory Qualifications (UGC / AICTE):</span>
                    <p className="text-slate-800 text-xs leading-relaxed font-normal bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                      {request.requiredQualifications}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500">Experience Criteria:</span>
                    <p className="text-slate-800 text-xs font-medium bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                      {request.experienceRequired}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Note on Editability */}
              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {canEdit
                      ? 'Requisition is currently in Draft phase. You can modify these details until reviewed by Dean Academic.'
                      : 'This requisition has been reviewed by Dean Academic and is locked for governance audit.'}
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-mono text-slate-400">{request.requestId}</span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
