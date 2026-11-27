'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { IHiringRequest } from '@/lib/types';
import { POST_LEVELS } from '@/lib/constants';
import { UniversityLogo } from '@/components/Header';
import {
  ArrowLeft,
  Edit2,
  Lock,
  Building2,
  Briefcase,
  GraduationCap,
  Award,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Clock,
  Trash2,
  History,
  FileText
} from 'lucide-react';

interface StoredUser {
  name?: string;
  email?: string;
  designation?: string;
  role?: string;
  department?: string;
}

function RequisitionDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestId = params?.id as string;
  const roleParam = searchParams.get('role') || '';

  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [request, setRequest] = useState<IHiringRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editPostLevel, setEditPostLevel] = useState('');
  const [isCustomLevel, setIsCustomLevel] = useState(false);
  const [customLevelInput, setCustomLevelInput] = useState('');
  const [editPositions, setEditPositions] = useState(1);
  const [editBudget, setEditBudget] = useState('');
  const [editJustification, setEditJustification] = useState('');
  const [editQualifications, setEditQualifications] = useState('');
  const [editExperience, setEditExperience] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gku_recruitment_user');
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const syncFormFields = (req: IHiringRequest) => {
    setEditTitle(req.postTitle || '');
    const lvl = req.postLevel || 'Assistant Professor';
    if (POST_LEVELS.includes(lvl) && lvl !== 'Other') {
      setEditPostLevel(lvl);
      setIsCustomLevel(false);
      setCustomLevelInput('');
    } else {
      setEditPostLevel('Other');
      setIsCustomLevel(true);
      setCustomLevelInput(lvl === 'Other' ? '' : lvl);
    }
    setEditPositions(req.numberOfPositions || 1);
    setEditBudget(req.tentativeBudget || '');
    setEditJustification(req.justification || '');
    setEditQualifications(req.requiredQualifications || '');
    setEditExperience(req.experienceRequired || '2 - 5 Years');
  };

  const fetchRequest = useCallback(async () => {
    if (!requestId) return;
    try {
      setLoading(true);
      setLoadError('');
      const res = await fetch(`/api/requests/${encodeURIComponent(requestId)}`);
      const data = await res.json();
      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.error || 'Requisition not found');
      }
      setRequest(data.data);
      syncFormFields(data.data);
    } catch (err: unknown) {
      setLoadError((err as Error).message || 'Failed to load requisition');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  // Role & Permission calculation
  const effectiveDesignation =
    currentUser?.designation ||
    (roleParam === 'hr'
      ? 'HR'
      : roleParam === 'dean-academic'
        ? 'Dean Academic'
        : roleParam === 'vc'
          ? 'Vice Chancellor'
          : roleParam === 'dean'
            ? 'Dean'
            : '');

  const isHR =
    effectiveDesignation === 'HR' ||
    effectiveDesignation === 'Admin' ||
    currentUser?.role === 'HR' ||
    roleParam === 'hr';

  const isDepartmentDean =
    effectiveDesignation === 'Dean' ||
    effectiveDesignation === 'Director' ||
    roleParam === 'dean';

  const isReviewedByDeanAcademic = request
    ? (request.currentStage || 1) >= 3 ||
    request.status === 'Approved by Dean Academic' ||
    request.status === 'Under Review (VC / Registrar)' ||
    request.status === 'Approved by VC / Registrar' ||
    request.status === 'In Process (HR - Recruitment)' ||
    request.status === 'Interview & Selection Completed' ||
    request.status === 'Joined & Request Closed' ||
    request.status === 'Position Fulfilled (Recruitment Completed)' ||
    request.status === 'Rejected' ||
    Boolean(request.deanAcademicApproval && request.deanAcademicApproval.decision === 'Approved')
    : false;

  const canEdit = isHR || (isDepartmentDean && !isReviewedByDeanAcademic);
  const canDelete = isHR || (isDepartmentDean && !isReviewedByDeanAcademic);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;
    if (!editTitle.trim() || !editJustification.trim() || !editQualifications.trim()) {
      setErrorMsg('Please complete post title, workload justification, and qualifications.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    const effectiveLevel = isCustomLevel ? customLevelInput.trim() || 'Other' : editPostLevel;
    const effectiveBudget = isHR
      ? editBudget.trim() || request.tentativeBudget || 'To be decided by HR'
      : request.tentativeBudget;

    try {
      const res = await fetch(`/api/requests/${request.requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postTitle: editTitle.trim(),
          postLevel: effectiveLevel,
          numberOfPositions: Number(editPositions),
          tentativeBudget: effectiveBudget,
          justification: editJustification.trim(),
          requiredQualifications: editQualifications.trim(),
          experienceRequired: editExperience.trim(),
          userRole: effectiveDesignation || currentUser?.role || 'Department / Dean'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update job details');
      }

      setSuccessMsg('Job requisition details updated successfully.');
      setIsEditing(false);
      await fetchRequest();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!request) return;
    if (
      !confirm(
        `Are you sure you want to permanently delete requisition ${request.requestId} (${request.postTitle})? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    setErrorMsg('');

    try {
      const roleQuery = encodeURIComponent(effectiveDesignation || currentUser?.role || '');
      const res = await fetch(`/api/requests/${request.requestId}?role=${roleQuery}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete requisition');
      }
      router.push('/');
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Error deleting requisition');
      setIsDeleting(false);
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
    <div className="min-h-screen bg-[#D3D3D3] flex flex-col">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <UniversityLogo />
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            {effectiveDesignation && (
              <span className="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 font-semibold text-slate-700">
                {effectiveDesignation}
              </span>
            )}
            <span className="font-mono font-bold px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
              {requestId}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Workspace
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-500">
            Loading requisition details...
          </div>
        ) : loadError || !request ? (
          <div className="bg-white rounded-2xl border border-rose-200 p-10 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <div className="text-sm font-bold text-slate-800">{loadError || 'Requisition not found'}</div>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Go Back
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Title & Permission Action Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                    {request.requestId}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">{request.department}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-semibold text-slate-600">
                    {request.employmentType} ({request.postLevel})
                  </span>
                </div>

                <h1 className="text-2xl font-black text-[#0f2d59] tracking-tight">
                  {request.postTitle}
                </h1>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-0.5">
                  <span>Status:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                    {request.status}
                  </span>
                  <span>•</span>
                  <span className="font-medium">Stage {request.currentStage || 1} of 6</span>
                  {request.urgency && (
                    <>
                      <span>•</span>
                      <span className="font-semibold text-slate-700">Urgency: {request.urgency}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Permission-Based Edit & Delete Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditing) syncFormFields(request);
                      setIsEditing(!isEditing);
                    }}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${isEditing
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        : 'bg-[#0f2d59] hover:bg-[#163f7a] text-white shadow-xs'
                      }`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{isEditing ? 'Cancel Edit' : 'Edit Details'}</span>
                  </button>
                ) : isDepartmentDean ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Locked (Reviewed by Dean Academic)</span>
                  </span>
                ) : null}

                {canDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Feedback Banners */}
            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
                <button onClick={() => setSuccessMsg('')} className="text-emerald-600 font-bold cursor-pointer">✕</button>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
                <button onClick={() => setErrorMsg('')} className="text-rose-600 font-bold cursor-pointer">✕</button>
              </div>
            )}

            {isEditing ? (
              /* ================= EDIT MODE ================= */
              <form onSubmit={handleSave} className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <h2 className="text-sm font-bold text-slate-800">1. Position & Designation</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Post Title / Specialization *
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          Designation Level *
                        </label>
                        {!isCustomLevel ? (
                          <button
                            type="button"
                            onClick={() => { setIsCustomLevel(true); setCustomLevelInput(''); }}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                          >
                            + Add Custom
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setIsCustomLevel(false); setEditPostLevel('Assistant Professor'); }}
                            className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                          >
                            Choose Preset
                          </button>
                        )}
                      </div>

                      {!isCustomLevel ? (
                        <select
                          value={editPostLevel}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'Other') {
                              setIsCustomLevel(true);
                              setCustomLevelInput('');
                              setEditPostLevel('Other');
                            } else {
                              setEditPostLevel(val);
                            }
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          {POST_LEVELS.map((lvl) => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={customLevelInput}
                          onChange={(e) => setCustomLevelInput(e.target.value)}
                          placeholder="Type custom designation..."
                          className="w-full bg-white border border-indigo-400 rounded-xl p-3 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          required
                        />
                      )}
                    </div>
                  </div>

                  <div className={`grid grid-cols-1 ${isHR ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-4`}>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Openings / Positions
                      </label>
                      <div className="flex items-center max-w-xs">
                        <button
                          type="button"
                          onClick={() => setEditPositions(Math.max(1, editPositions - 1))}
                          className="p-3 bg-white border border-r-0 border-slate-200 rounded-l-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={editPositions}
                          onChange={(e) => setEditPositions(Math.max(1, Number(e.target.value)))}
                          className="w-full bg-white border-y border-slate-200 p-2.5 text-center text-sm font-bold text-slate-900 focus:outline-none"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setEditPositions(editPositions + 1)}
                          className="p-3 bg-white border border-l-0 border-slate-200 rounded-r-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {isHR && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Budgeted Salary Head (HR Only)
                        </label>
                        <input
                          type="text"
                          value={editBudget}
                          onChange={(e) => setEditBudget(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <h2 className="text-sm font-bold text-slate-800">2. Workload & Qualification Criteria</h2>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Workforce Need & Teaching Load Justification *
                    </label>
                    <textarea
                      rows={3}
                      value={editJustification}
                      onChange={(e) => setEditJustification(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Required Statutory Qualifications *
                    </label>
                    <textarea
                      rows={3}
                      value={editQualifications}
                      onChange={(e) => setEditQualifications(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">Experience Criteria</label>
                      <div className="flex items-center gap-1.5">
                        {['0-2 Years', '2-5 Years', '5-8 Years', '8+ Years'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setEditExperience(preset)}
                            className={`px-2.5 py-1 rounded-lg text-xs border transition cursor-pointer ${editExperience === preset
                                ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
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
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { syncFormFields(request); setIsEditing(false); }}
                    className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-[#0f2d59] hover:bg-[#163f7a] text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {isSaving ? 'Saving Changes...' : 'Save Requisition Changes'}
                  </button>
                </div>
              </form>
            ) : (
              /* ================= VIEW MODE ================= */
              <div className="space-y-6">
                {/* Summary Metrics */}
                <div className={`grid grid-cols-2 ${isHR ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Department</div>
                    <div className="text-sm font-bold text-slate-900 mt-1">{request.department}</div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cadre & Level</div>
                    <div className="text-sm font-bold text-slate-900 mt-1">
                      {request.employmentType} • {request.postLevel}
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Positions</div>
                    <div className="text-sm font-bold text-slate-900 mt-1">{request.numberOfPositions} Vacancy(s)</div>
                  </div>

                  {isHR && (
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Budget Head (HR)</div>
                      <div className="text-sm font-bold text-slate-900 mt-1">{request.tentativeBudget || 'To be decided by HR'}</div>
                    </div>
                  )}
                </div>

                {/* Justification & Qualifications */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span>Workforce Need & Teaching Load Justification</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                      {request.justification || '—'}
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <Award className="w-4 h-4 text-indigo-600" />
                      <span>Statutory Qualifications & Experience</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block mb-1">
                          Statutory Qualifications (UGC / AICTE):
                        </span>
                        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                          {request.requiredQualifications || '—'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50/70 px-4 py-3 rounded-xl border border-slate-100">
                        <span className="text-xs font-semibold text-slate-500">Experience Criteria:</span>
                        <span className="text-sm font-bold text-slate-900">{request.experienceRequired || '—'}</span>
                      </div>
                      {request.jobDescriptionFile && (
                        <div className="flex items-center gap-2 bg-indigo-50/70 px-4 py-3 rounded-xl border border-indigo-200 text-xs font-semibold text-indigo-900">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <span>Attached Specification: {request.jobDescriptionFile}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recruitment Timeline & Approval History */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <History className="w-4 h-4 text-blue-600" />
                    <h2 className="text-sm font-bold text-slate-900">Recruitment Timeline & Approval History</h2>
                  </div>

                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {/* 1. Submitted */}
                    <div className="relative flex items-start gap-3">
                      <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">
                        ✓
                      </div>
                      <div className="flex-1 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">1. Job Requirement Submitted</span>
                          <span className="text-[11px] text-slate-400">{formatDate(request.createdAt)}</span>
                        </div>
                        <div className="text-slate-600">
                          Submitted by <strong className="text-slate-800">{request.creator?.name || 'Department Dean'}</strong> ({request.department})
                        </div>
                      </div>
                    </div>

                    {/* 2. Dean Academic */}
                    {request.deanAcademicApproval ? (
                      <div className="relative flex items-start gap-3">
                        <div className={`absolute -left-6 mt-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${request.deanAcademicApproval.decision === 'Approved' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}>
                          {request.deanAcademicApproval.decision === 'Approved' ? '✓' : '✕'}
                        </div>
                        <div className="flex-1 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">
                              2. Dean Academic Scrutiny:{' '}
                              <span className={request.deanAcademicApproval.decision === 'Approved' ? 'text-emerald-700' : 'text-rose-700'}>
                                {request.deanAcademicApproval.decision === 'Approved' ? 'Approved & Cleared ✓' : request.deanAcademicApproval.decision}
                              </span>
                            </span>
                            <span className="text-[11px] text-slate-400">{formatDate(request.deanAcademicApproval.decidedAt)}</span>
                          </div>
                          <div className="text-slate-600">
                            Reviewed by <strong className="text-slate-800">{request.deanAcademicApproval.decidedBy}</strong>
                          </div>
                          {request.deanAcademicApproval.remarks && (
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700 italic">
                              &ldquo;{request.deanAcademicApproval.remarks}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="relative flex items-start gap-3">
                        <div className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-amber-400 text-white flex items-center justify-center text-[9px] font-bold">
                          •
                        </div>
                        <div className="flex-1 bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/80 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-950">2. Dean Academic Scrutiny</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md">
                              Pending / Under Review
                            </span>
                          </div>
                          <div className="text-slate-600">
                            Workload norms and statutory qualifications under verification by Dean Academic.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. VC / Registrar */}
                    {request.vcRegistrarApproval && (
                      <div className="relative flex items-start gap-3">
                        <div className={`absolute -left-6 mt-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${request.vcRegistrarApproval.decision === 'Approved' ? 'bg-purple-600' : 'bg-rose-500'
                          }`}>
                          {request.vcRegistrarApproval.decision === 'Approved' ? '✓' : '✕'}
                        </div>
                        <div className="flex-1 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">
                              3. VC / Registrar Sanction:{' '}
                              <span className={request.vcRegistrarApproval.decision === 'Approved' ? 'text-purple-700' : 'text-rose-700'}>
                                {request.vcRegistrarApproval.decision === 'Approved' ? 'Sanction Accorded ✓' : request.vcRegistrarApproval.decision}
                              </span>
                            </span>
                            <span className="text-[11px] text-slate-400">{formatDate(request.vcRegistrarApproval.decidedAt)}</span>
                          </div>
                          <div className="text-slate-600">
                            Authority: <strong className="text-slate-800">{request.vcRegistrarApproval.decidedBy}</strong>
                          </div>
                          {request.vcRegistrarApproval.remarks && (
                            <div className="bg-purple-50/60 p-2.5 rounded-lg border border-purple-200/60 text-purple-950 italic">
                              &ldquo;{request.vcRegistrarApproval.remarks}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Permission Notice Footer */}
                <div className="p-4 bg-blue-50/60 border border-blue-200/70 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    {isHR
                      ? 'HR Directorate Authority: You can edit or delete this requisition anytime.'
                      : canEdit
                        ? 'Department Draft Phase: You can edit or delete this requisition until reviewed by Dean Academic.'
                        : isDepartmentDean
                          ? 'This requisition has been reviewed by Dean Academic and is locked against departmental editing or deletion.'
                          : 'Viewing requisition in read-only governance mode.'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function RequisitionDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-400">
          Loading Requisition Details...
        </div>
      }
    >
      <RequisitionDetailContent />
    </Suspense>
  );
}
