'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { UNIVERSITY_DEPARTMENTS, POST_LEVELS } from '@/lib/constants';
import { UniversityLogo } from '@/components/Header';
import {
  ArrowLeft,
  Building2,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  Plus,
  Minus,
  UploadCloud,
  FileText,
  Zap,
  ShieldCheck,
  Sparkles,
  Info
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
  const [designationLevel, setDesignationLevel] = useState(POST_LEVELS[2] || 'Assistant Professor');
  const [designationsList] = useState<string[]>([...POST_LEVELS, 'Other']);
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

  const handleQuickAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
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
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add department');
      }
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
    if (lvl === 'Professor') {
      setSalaryScale('₹18,00,000 – ₹24,00,000 p.a.');
      setExperience('10+ Years');
    } else if (lvl === 'Associate Professor') {
      setSalaryScale('₹12,00,000 – ₹15,50,000 p.a.');
      setExperience('8+ Years');
    } else if (lvl === 'Assistant Professor') {
      setSalaryScale('₹8,40,000 – ₹10,80,000 p.a.');
      setExperience('2 - 5 Years');
    } else if (lvl.includes('Lecturer')) {
      setSalaryScale('₹5,40,000 – ₹7,20,000 p.a.');
      setExperience('1 - 3 Years');
    } else if (lvl.includes('Technical') || lvl.includes('Staff')) {
      setSalaryScale('₹4,20,000 – ₹6,00,000 p.a.');
      setExperience('2 - 4 Years');
    }
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
      setErrorMsg('Please complete post specialization, justification, and qualifications.');
      return;
    }

    const effectiveDesignation = isCustomDesignation
      ? customDesignation.trim() || 'Other'
      : designationLevel;

    if (!effectiveDesignation) {
      setErrorMsg('Please specify a designation level.');
      return;
    }

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
        ? hrWorkflowMode === 'direct'
          ? 'direct_hr_order'
          : 'route_vc'
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
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit requisition');
      }

      setSuccessMsg(`✓ Job Requirement for ${fullTitle} created successfully with ID ${data.data?.requestId || 'GKUJD'}. Redirecting...`);
      setTimeout(() => {
        router.push(isHR ? '/hr' : '/dean');
      }, 1200);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to submit requisition');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col">
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-600 hover:text-slate-900 cursor-pointer"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <UniversityLogo />
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="font-semibold text-slate-500">
              Role: <strong className="text-slate-800">{isHR ? 'HR Directorate' : 'Department Dean'}</strong>
            </span>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-200">
              Pattern: GKUJD0001
            </span>
          </div>
        </div>
      </header>

      {/* Main Form Page */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-8 py-8">
        <div className="mb-6">
          <Link
            href={isHR ? '/hr' : '/dean'}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Create Job Requirement & Requisition
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Initiate a sanctioned faculty or staff hiring requirement across Guru Kashi University
              </p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-8">
          {/* Top Workflow Mode Bar */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Recruitment Mode:
              </span>
              {isHR ? (
                <div className="inline-flex rounded-xl p-1 bg-slate-200/70 border border-slate-300">
                  <button
                    type="button"
                    onClick={() => setHrWorkflowMode('direct')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                      hrWorkflowMode === 'direct'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Direct Recruitment (No Approval)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHrWorkflowMode('request_approval')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                      hrWorkflowMode === 'request_approval'
                        ? 'bg-blue-800 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Request Governance Approval</span>
                  </button>
                </div>
              ) : (
                <span className="px-3 py-1 bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold rounded-lg flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Academic Dean Requisition Workflow
                </span>
              )}
            </div>

            {/* Statutory Checkboxes if HR Request Approval */}
            {isHR && hrWorkflowMode === 'request_approval' && (
              <div className="flex items-center space-x-3 text-xs bg-white px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs">
                <span className="font-semibold text-slate-700">Submit To:</span>
                <label className="flex items-center space-x-1.5 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetAuthorities.vc}
                    onChange={(e) => setTargetAuthorities((prev) => ({ ...prev, vc: e.target.checked }))}
                    className="rounded text-blue-600"
                  />
                  <span>VC</span>
                </label>
                <label className="flex items-center space-x-1.5 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={targetAuthorities.registrar}
                    onChange={(e) => setTargetAuthorities((prev) => ({ ...prev, registrar: e.target.checked }))}
                    className="rounded text-blue-600"
                  />
                  <span>Registrar</span>
                </label>
              </div>
            )}

            {isHR && (
              <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleToDean}
                  onChange={(e) => setVisibleToDean(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Visible in Department Dean Requisition Pipeline</span>
              </label>
            )}
          </div>

          {/* 2-Column Responsive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* COLUMN 1: Position & Cadre */}
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  1. Position & Cadre Specifications
                </h2>

                {/* Cadre Toggle */}
                <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setCadreType('Teaching')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      cadreType === 'Teaching'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Teaching Faculty
                  </button>
                  <button
                    type="button"
                    onClick={() => setCadreType('Non-Teaching')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      cadreType === 'Non-Teaching'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Non-Teaching / Staff
                  </button>
                </div>
              </div>

              {/* Department Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Faculty / Academic Department <span className="text-rose-600">*</span>:
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingDept(!isAddingDept)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    {isAddingDept ? '✕ Close' : '+ Add New Department'}
                  </button>
                </div>

                {isAddingDept && (
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2 mb-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newDeptInput}
                        onChange={(e) => setNewDeptInput(e.target.value)}
                        placeholder="Department Name"
                        className="p-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={newDeptCode}
                        onChange={(e) => setNewDeptCode(e.target.value)}
                        placeholder="Code (e.g. AI-DS)"
                        className="p-2 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    {deptSaveError && <p className="text-[11px] text-rose-600 font-semibold">{deptSaveError}</p>}
                    <button
                      type="button"
                      disabled={isDeptSaving}
                      onClick={handleQuickAddDept}
                      className="px-3 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-bold transition"
                    >
                      {isDeptSaving ? 'Saving...' : 'Save & Select Department'}
                    </button>
                  </div>
                )}

                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Designation Level & Domain */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Designation Level <span className="text-rose-600">*</span>:
                  </label>
                  <select
                    value={designationLevel}
                    onChange={(e) => handleLevelChange(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  >
                    {designationsList.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Specialization / Domain <span className="text-rose-600">*</span>:
                  </label>
                  <input
                    type="text"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="e.g. Artificial Intelligence & ML"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {isCustomDesignation && (
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    Enter Custom Designation Title:
                  </label>
                  <input
                    type="text"
                    value={customDesignation}
                    onChange={(e) => setCustomDesignation(e.target.value)}
                    placeholder="e.g. Senior Research Fellow / Lab Technician"
                    className="w-full p-2.5 border border-amber-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 bg-amber-50/20"
                    required
                  />
                </div>
              )}

              {/* Positions & Urgency */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Positions:
                  </label>
                  <div className="flex items-center space-x-1 border border-slate-200 rounded-xl p-1 bg-white">
                    <button
                      type="button"
                      onClick={() => setNumberOfPositions(Math.max(1, numberOfPositions - 1))}
                      className="p-1 hover:bg-slate-100 rounded-lg text-slate-600"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={numberOfPositions}
                      onChange={(e) => setNumberOfPositions(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-center text-xs font-black border-none focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setNumberOfPositions(numberOfPositions + 1)}
                      className="p-1 hover:bg-slate-100 rounded-lg text-slate-600"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Hiring Urgency:
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                {isHR ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Budget Scale (HR):
                    </label>
                    <input
                      type="text"
                      value={salaryScale}
                      onChange={(e) => setSalaryScale(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Salary Decision</span>
                    <span className="text-xs font-bold text-slate-600 mt-1">Decided by HR</span>
                  </div>
                )}
              </div>

              {/* Upload JD Document */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Upload Specification Document / JD (Optional):
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-4 bg-slate-50/50 hover:bg-blue-50/20 transition text-center cursor-pointer relative group">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleJdUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {jobDescriptionFileName ? (
                    <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-blue-200">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-800">{jobDescriptionFileName}</span>
                        <span className="text-[10px] text-slate-400">({jobDescriptionFileSize})</span>
                      </div>
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setJobDescriptionFileName('');
                        }}
                        className="text-xs text-rose-500 font-bold hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <UploadCloud className="w-6 h-6 mx-auto text-blue-600 group-hover:scale-110 transition" />
                      <p className="text-xs font-bold text-slate-700">Click to upload specification document</p>
                      <p className="text-[10px] text-slate-400">PDF, DOC, DOCX up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* COLUMN 2: Specifications & Workload */}
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  2. Criteria & Academic Workload
                </h2>

                {/* Quick Exp presets */}
                <div className="flex items-center space-x-1">
                  {['0-2Y', '2-5Y', '5-8Y', '8+Y'].map((expBadge) => (
                    <button
                      key={expBadge}
                      type="button"
                      onClick={() => setExperience(`${expBadge.replace('Y', '')} Years`)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    >
                      {expBadge}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Experience Requirement <span className="text-rose-600">*</span>:
                </label>
                <input
                  type="text"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g. 2 - 5 Years teaching / research experience"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Requirement Justification / Need Analysis <span className="text-rose-600">*</span>:
                </label>
                <textarea
                  rows={4}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Detail student enrollment growth, teaching load deficit, or new program requirements..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Required Minimum Qualifications & Criteria <span className="text-rose-600">*</span>:
                </label>
                <textarea
                  rows={4}
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  placeholder="e.g. Master's with Ph.D. in relevant discipline from a recognized University; UGC NET qualified..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                  required
                />
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                {isHR
                  ? hrWorkflowMode === 'direct'
                    ? 'Requisition will be directly active in Talent Acquisition pipeline without intermediate approvals.'
                    : 'Requisition will route to selected Leadership authorities for statutory clearance.'
                  : 'Requisition will be submitted to Dean Academic for workload scrutiny.'}
              </span>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Publishing...'
                    : isHR && hrWorkflowMode === 'direct'
                    ? 'Direct Publish Job Requirement'
                    : 'Submit Job Requisition'}
                </span>
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-center text-xs text-slate-500">
          Loading Requisition Workspace...
        </div>
      }
    >
      <NewRequisitionContent />
    </Suspense>
  );
}
