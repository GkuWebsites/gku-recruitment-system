'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { UNIVERSITY_DEPARTMENTS, POST_LEVELS } from '@/lib/constants';
import { UniversityLogo } from '@/components/Header';
import {
  ArrowLeft,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  Plus,
  Minus,
  UploadCloud,
  FileText,
  Zap,
  ShieldCheck,
  Info,
  Users,
  BookOpen,
  ChevronRight
} from 'lucide-react';

function NewRequisitionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const roleParam = searchParams.get('role') || 'hr';
  const deptParam = searchParams.get('department') || '';

  const isHR = roleParam.toLowerCase().includes('hr') || roleParam.toLowerCase() === 'admin';
  const defaultCreatorName = isHR ? 'Director of HR & Faculty Affairs' : 'Department Dean';
  const defaultCreatorEmail = isHR ? 'hr@gku.ac.in' : 'dean.engg@gku.ac.in';

  const [departments, setDepartments] = useState<string[]>(UNIVERSITY_DEPARTMENTS);
  const [department, setDepartment] = useState(deptParam || UNIVERSITY_DEPARTMENTS[0]);
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [newDeptInput, setNewDeptInput] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [isDeptSaving, setIsDeptSaving] = useState(false);
  const [deptSaveError, setDeptSaveError] = useState('');

  const [cadreType, setCadreType] = useState<'Teaching' | 'Non-Teaching'>('Teaching');
  const [postTitle, setPostTitle] = useState('');
  const [designationLevel, setDesignationLevel] = useState('Assistant Professor');
  const [isCustomDesignation, setIsCustomDesignation] = useState(false);
  const [customDesignation, setCustomDesignation] = useState('');
  const [numberOfPositions, setNumberOfPositions] = useState(1);
  const [priority, setPriority] = useState<'Normal' | 'High' | 'Urgent'>('Normal');
  const [salaryScale, setSalaryScale] = useState('₹8,40,000 – ₹10,80,000 p.a.');
  const [justification, setJustification] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [experience, setExperience] = useState('2 - 5 Years');
  const [hrWorkflowMode, setHrWorkflowMode] = useState<'direct' | 'request_approval'>('direct');
  const [targetAuthorities, setTargetAuthorities] = useState<{ vc: boolean; registrar: boolean }>({
    vc: true,
    registrar: true
  });
  const [visibleToDean, setVisibleToDean] = useState(false);
  const [jobDescriptionFileName, setJobDescriptionFileName] = useState('');
  const [jobDescriptionFileSize, setJobDescriptionFileSize] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setDepartments(data.data);
          if (deptParam && data.data.includes(deptParam)) {
            setDepartment(deptParam);
          }
        }
      })
      .catch((err) => console.error('Error fetching departments:', err));
  }, [deptParam]);

  const handleQuickAddDept = async () => {
    if (!newDeptInput.trim()) return;
    setIsDeptSaving(true);
    setDeptSaveError('');
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDeptInput.trim(),
          code: newDeptCode.trim(),
          createdBy: defaultCreatorName
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add department');
      const added = newDeptInput.trim();
      setDepartments((prev) => (prev.includes(added) ? prev : [...prev, added]));
      setDepartment(added);
      setNewDeptInput('');
      setNewDeptCode('');
      setIsAddingDept(false);
    } catch (err: unknown) {
      setDeptSaveError((err as Error).message);
    } finally {
      setIsDeptSaving(false);
    }
  };

  const handleLevelChange = (lvl: string) => {
    if (lvl === 'Other') {
      setIsCustomDesignation(true);
      setDesignationLevel('Other');
      return;
    }
    setIsCustomDesignation(false);
    setDesignationLevel(lvl);
    if (lvl === 'Professor') { setSalaryScale('₹18,00,000 – ₹24,00,000 p.a.'); setExperience('10+ Years'); }
    else if (lvl === 'Associate Professor') { setSalaryScale('₹12,00,000 – ₹15,50,000 p.a.'); setExperience('8+ Years'); }
    else if (lvl === 'Assistant Professor') { setSalaryScale('₹8,40,000 – ₹10,80,000 p.a.'); setExperience('2 - 5 Years'); }
    else if (lvl.includes('Lecturer')) { setSalaryScale('₹5,40,000 – ₹7,20,000 p.a.'); setExperience('1 - 3 Years'); }
    else if (lvl.includes('Technical') || lvl.includes('Lab')) { setSalaryScale('₹4,20,000 – ₹6,00,000 p.a.'); setExperience('2 - 4 Years'); }
  };

  const handleJdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setJobDescriptionFileName(file.name);
      const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`;
      setJobDescriptionFileSize(sizeStr);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !justification.trim() || !qualifications.trim()) {
      setErrorMsg('Please complete all required fields: specialization, justification, and qualifications.');
      return;
    }
    const effectiveDesignation = isCustomDesignation ? customDesignation.trim() || 'Other' : designationLevel;
    if (!effectiveDesignation) { setErrorMsg('Please specify a designation level.'); return; }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const fullTitle = postTitle.toLowerCase().includes(effectiveDesignation.toLowerCase())
        ? postTitle.trim()
        : `${effectiveDesignation} (${postTitle.trim()})`;

      const authoritiesList: string[] = [];
      if (isHR && hrWorkflowMode === 'request_approval') {
        if (targetAuthorities.vc) authoritiesList.push('Vice-Chancellor (VC)');
        if (targetAuthorities.registrar) authoritiesList.push('Registrar');
      }

      const effectiveRouting = isHR
        ? hrWorkflowMode === 'direct' ? 'direct_hr_order' : 'route_vc'
        : 'standard_academic';

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department,
          employmentType: cadreType,
          postTitle: fullTitle,
          postLevel: effectiveDesignation,
          numberOfPositions: Number(numberOfPositions),
          urgency: priority,
          tentativeBudget: isHR ? salaryScale : 'To be decided by HR',
          justification: justification.trim(),
          requiredQualifications: qualifications.trim(),
          experienceRequired: experience.trim(),
          jobDescriptionFile: jobDescriptionFileName || undefined,
          visibleToDean: isHR ? visibleToDean : true,
          approvalRouting: effectiveRouting,
          authorities: authoritiesList,
          creatorName: defaultCreatorName,
          creatorEmail: defaultCreatorEmail,
          creatorRole: isHR ? 'HR Department' : 'Department / Dean',
          initialComment: isHR
            ? hrWorkflowMode === 'direct'
              ? 'Sanctioned under Direct Recruitment Protocol by HR Directorate (Self-Sanctioned).'
              : `Created by HR Directorate and submitted for executive approval to ${authoritiesList.join(' & ')}.`
            : 'Submitted by Department Dean for Academic Workload Scrutiny.'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to submit requisition');

      setSuccessMsg(`Job requirement for ${fullTitle} created successfully. Redirecting to dashboard...`);
      setTimeout(() => { router.push(isHR ? '/hr' : '/dean'); }, 1400);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to submit requisition');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Derived labels ──────────────────────────────────────────────────────────
  const submitLabel = isSubmitting
    ? 'Submitting...'
    : isHR && hrWorkflowMode === 'direct'
      ? 'Publish Job Requirement'
      : 'Submit Requisition';

  const workflowNote = isHR
    ? hrWorkflowMode === 'direct'
      ? 'Direct Recruitment — immediately active in Talent Acquisition pipeline. No approval required.'
      : 'Governance Approval — routed to selected Leadership authorities for statutory clearance.'
    : 'Academic Workflow — submitted to Dean Academic for workload scrutiny before activation.';

  const expPresets = [
    { label: '0–2 Yrs', value: '0 - 2 Years' },
    { label: '2–5 Yrs', value: '2 - 5 Years' },
    { label: '5–8 Yrs', value: '5 - 8 Years' },
    { label: '8+ Yrs', value: '8+ Years' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Sticky top header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <UniversityLogo />
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-slate-500 font-medium">
              Role: <strong className="text-slate-800">{isHR ? 'HR Directorate' : 'Department Dean'}</strong>
            </span>
            <span className="text-xs font-bold px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
              GKUJD0001
            </span>
          </div>
        </div>
      </header>

      {/* ── Page content ──────────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-10">
        {/* Page heading */}
        <div className="mb-8">
          <Link
            href={isHR ? '/hr' : '/dean'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-black text-[#0f2d59] tracking-tight leading-tight">
            Create Job Requirement
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Initiate a sanctioned faculty or staff hiring requirement across Guru Kashi University
          </p>
        </div>

        {/* Error / success banners */}
        {errorMsg && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
            <span className="font-semibold flex-1">{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="text-rose-400 hover:text-rose-700 font-bold shrink-0 cursor-pointer">✕</button>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Card 1: Workflow Mode ──────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-indigo-600" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Recruitment Workflow</h2>
                <p className="text-xs text-slate-400">Select how this requirement will be processed</p>
              </div>
            </div>
            <div className="px-6 py-5">
              {isHR ? (
                <div className="flex flex-wrap items-center gap-3">
                  {/* Mode Pills */}
                  <div className="flex bg-slate-100 p-1 rounded-xl gap-1 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setHrWorkflowMode('direct')}
                      className={`flex-1 sm:flex-none flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        hrWorkflowMode === 'direct'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Direct Recruitment
                    </button>
                    <button
                      type="button"
                      onClick={() => setHrWorkflowMode('request_approval')}
                      className={`flex-1 sm:flex-none flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        hrWorkflowMode === 'request_approval'
                          ? 'bg-[#0f2d59] text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Request Governance Approval
                    </button>
                  </div>

                  {/* Authority checkboxes */}
                  {hrWorkflowMode === 'request_approval' && (
                    <div className="flex items-center gap-4 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <span className="font-semibold text-slate-600">Route to:</span>
                      {[
                        { key: 'vc' as const, label: 'Vice-Chancellor' },
                        { key: 'registrar' as const, label: 'Registrar' }
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-1.5 font-medium text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={targetAuthorities[key]}
                            onChange={(e) => setTargetAuthorities((prev) => ({ ...prev, [key]: e.target.checked }))}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Visible to Dean toggle */}
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleToDean}
                      onChange={(e) => setVisibleToDean(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    Visible in Department Dean pipeline
                  </label>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-800">
                    <GraduationCap className="w-4 h-4" />
                    Academic Dean Requisition Workflow
                  </span>
                  <span className="text-xs text-slate-400">Routes to Dean Academic for review before VC sanction</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Card 2: Position Details ───────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Position & Cadre</h2>
                  <p className="text-xs text-slate-400">Department, designation, and staffing numbers</p>
                </div>
              </div>

              {/* Cadre toggle — right side of card header */}
              <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setCadreType('Teaching')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    cadreType === 'Teaching'
                      ? 'bg-[#0f2d59] text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Teaching
                </button>
                <button
                  type="button"
                  onClick={() => setCadreType('Non-Teaching')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    cadreType === 'Non-Teaching'
                      ? 'bg-[#0f2d59] text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Non-Teaching
                </button>
              </div>
            </div>

            <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left sub-col */}
              <div className="space-y-5">
                {/* Department */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Department / Faculty <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddingDept(!isAddingDept)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      {isAddingDept ? '✕ Close' : '+ Add Department'}
                    </button>
                  </div>
                  {isAddingDept && (
                    <div className="mb-2 p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={newDeptInput}
                          onChange={(e) => setNewDeptInput(e.target.value)}
                          placeholder="Department name"
                          className="p-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={newDeptCode}
                          onChange={(e) => setNewDeptCode(e.target.value)}
                          placeholder="Code (e.g. AI-DS)"
                          className="p-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                        />
                      </div>
                      {deptSaveError && <p className="text-xs text-rose-600 font-semibold">{deptSaveError}</p>}
                      <button
                        type="button"
                        disabled={isDeptSaving || !newDeptInput.trim()}
                        onClick={handleQuickAddDept}
                        className="px-3 py-1.5 bg-[#0f2d59] hover:bg-[#163f7a] text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                      >
                        {isDeptSaving ? 'Saving...' : 'Save & Select'}
                      </button>
                    </div>
                  )}
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-400"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Designation Level */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Designation Level <span className="text-rose-500">*</span>
                  </label>
                  {!isCustomDesignation ? (
                    <select
                      value={designationLevel}
                      onChange={(e) => handleLevelChange(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-400"
                    >
                      {POST_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={customDesignation}
                        onChange={(e) => setCustomDesignation(e.target.value)}
                        placeholder="e.g. Senior Research Fellow / Lab Technician"
                        className="w-full p-3 bg-white border border-indigo-300 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        autoFocus
                        required
                      />
                      <button
                        type="button"
                        onClick={() => { setIsCustomDesignation(false); setDesignationLevel('Assistant Professor'); }}
                        className="text-xs text-slate-500 hover:text-indigo-600 font-semibold cursor-pointer"
                      >
                        ← Choose from preset list
                      </button>
                    </div>
                  )}
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Specialization / Domain <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="e.g. Artificial Intelligence & Machine Learning"
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-400 placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              {/* Right sub-col */}
              <div className="space-y-5">
                {/* Positions + Urgency + Budget row */}
                <div className={`grid gap-4 ${isHR ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {/* Positions */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Positions</label>
                    <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setNumberOfPositions(Math.max(1, numberOfPositions - 1))}
                        className="px-3 py-3 text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={numberOfPositions}
                        onChange={(e) => setNumberOfPositions(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 text-center text-sm font-black border-none focus:outline-none py-3"
                      />
                      <button
                        type="button"
                        onClick={() => setNumberOfPositions(numberOfPositions + 1)}
                        className="px-3 py-3 text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Urgency */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Urgency</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as 'Normal' | 'High' | 'Urgent')}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  {/* Budget — HR only */}
                  {isHR && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Budget / Salary</label>
                      <input
                        type="text"
                        value={salaryScale}
                        onChange={(e) => setSalaryScale(e.target.value)}
                        placeholder="₹8,40,000 – ₹10,80,000"
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* JD Upload */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Specification Document / JD <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  {jobDescriptionFileName ? (
                    <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="text-xs font-semibold text-slate-800 truncate">{jobDescriptionFileName}</span>
                        {jobDescriptionFileSize && (
                          <span className="text-xs text-slate-400">({jobDescriptionFileSize})</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setJobDescriptionFileName(''); setJobDescriptionFileSize(''); }}
                        className="text-xs text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-6 bg-slate-50/60 hover:bg-indigo-50/30 transition cursor-pointer group">
                      <UploadCloud className="w-7 h-7 text-slate-400 group-hover:text-indigo-500 transition" />
                      <div className="text-center">
                        <p className="text-xs font-semibold text-slate-600">Click to upload job description</p>
                        <p className="text-xs text-slate-400 mt-0.5">PDF, DOC, DOCX — up to 10 MB</p>
                      </div>
                      <input type="file" accept=".pdf,.doc,.docx" onChange={handleJdUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Card 3: Criteria & Workload ───────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4 text-violet-600" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Criteria & Academic Workload</h2>
                  <p className="text-xs text-slate-400">Experience requirements, justification, and qualifications</p>
                </div>
              </div>

              {/* Quick experience presets */}
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-xs text-slate-400 mr-1">Experience:</span>
                {expPresets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setExperience(p.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      experience === p.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Experience */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Experience Required <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g. 2 – 5 Years in teaching / research"
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-indigo-400 placeholder:text-slate-400"
                  required
                />
                {/* Mobile presets */}
                <div className="flex sm:hidden items-center gap-1 mt-2 flex-wrap">
                  {expPresets.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setExperience(p.value)}
                      className={`px-2 py-0.5 rounded text-xs font-bold cursor-pointer ${
                        experience === p.value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Justification */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Requirement Justification / Need Analysis <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Detail student enrollment growth, teaching load deficit, or new program requirements..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed resize-none placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Qualifications — full width */}
              <div className="lg:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Minimum Qualifications & Eligibility Criteria <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  placeholder="e.g. Ph.D. in relevant discipline; UGC NET/SLET qualified; minimum 2 Scopus/UGC-CARE publications..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed resize-none placeholder:text-slate-400"
                  required
                />
              </div>
            </div>
          </div>

          {/* ── Action strip ──────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-start gap-2 text-xs text-slate-500 max-w-lg">
              <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <span>{workflowNote}</span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-5 py-3 text-sm font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl hover:bg-white transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-7 py-3 bg-[#0f2d59] hover:bg-[#163f7a] text-white rounded-xl text-sm font-black shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <>
                    <span>{submitLabel}</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      </main>
    </div>
  );
}

export default function NewRequisitionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-sm text-slate-400 font-medium">Loading Requisition Workspace...</div>
        </div>
      }
    >
      <NewRequisitionContent />
    </Suspense>
  );
}
