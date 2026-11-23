'use client';

import React, { useState, useEffect } from 'react';
import { UNIVERSITY_DEPARTMENTS, POST_LEVELS } from '@/lib/constants';
import {
  X,
  Building2,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  ChevronRight,
  Plus,
  Minus,
  UploadCloud,
  FileText,
  Zap,
  ShieldCheck
} from 'lucide-react';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDepartment?: string;
  creatorName?: string;
  creatorEmail?: string;
  userRole?: string;
}

export function NewRequestModal({
  isOpen,
  onClose,
  onSuccess,
  defaultDepartment,
  creatorName,
  creatorEmail,
  userRole = 'Department / Dean'
}: NewRequestModalProps) {
  const isHR = userRole.toLowerCase().includes('hr') || userRole === 'Admin';
  const defaultCreatorName = creatorName || (isHR ? 'Director of HR & Recruitment' : 'Dr. Harpreet Singh');
  const defaultCreatorEmail = creatorEmail || (isHR ? 'hr@gku.ac.in' : 'dean.engg@gku.ac.in');

  const [departments, setDepartments] = useState<string[]>(UNIVERSITY_DEPARTMENTS);
  const [department, setDepartment] = useState(defaultDepartment || UNIVERSITY_DEPARTMENTS[0]);
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [newDeptInput, setNewDeptInput] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [isDeptSaving, setIsDeptSaving] = useState(false);
  const [deptSaveError, setDeptSaveError] = useState('');

  const [cadreType, setCadreType] = useState<'Teaching' | 'Non-Teaching'>('Teaching');
  const [postTitle, setPostTitle] = useState('');
  const [designationLevel, setDesignationLevel] = useState(POST_LEVELS[2] || 'Assistant Professor');
  const [numberOfPositions, setNumberOfPositions] = useState(1);
  const [priority, setPriority] = useState<'Normal' | 'High' | 'Urgent'>('Normal');
  const [salaryScale, setSalaryScale] = useState('₹8,40,000 – ₹10,80,000 p.a.');
  const [justification, setJustification] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [experience, setExperience] = useState('2 - 5 Years');
  const [approvalRouting, setApprovalRouting] = useState<'direct_hr_order' | 'route_vc' | 'standard_academic'>(
    isHR ? 'direct_hr_order' : 'standard_academic'
  );
  const [jobDescriptionFileName, setJobDescriptionFileName] = useState('');
  const [jobDescriptionFileSize, setJobDescriptionFileSize] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setDepartments(data.data);
        }
      })
      .catch((err) => console.error(err));
  }, []);

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

  if (!isOpen) return null;

  // Auto-suggest salary range when designation level changes
  const handleLevelChange = (lvl: string) => {
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

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const fullTitle = postTitle.toLowerCase().includes(designationLevel.toLowerCase())
        ? postTitle.trim()
        : `${designationLevel} (${postTitle.trim()})`;

      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department,
          employmentType: cadreType,
          postTitle: fullTitle,
          postLevel: designationLevel,
          numberOfPositions: Number(numberOfPositions),
          urgency: priority,
          tentativeBudget: salaryScale,
          justification: justification.trim(),
          requiredQualifications: qualifications.trim(),
          experienceRequired: experience.trim(),
          jobDescriptionFile: jobDescriptionFileName || undefined,
          approvalRouting,
          creatorName: defaultCreatorName,
          creatorEmail: defaultCreatorEmail,
          creatorRole: isHR ? 'HR Department' : 'Department / Dean',
          initialComment: isHR
            ? approvalRouting === 'direct_hr_order'
              ? 'Sanctioned under Executive Direct Order by HR Directorate.'
              : 'Direct institutional requirement raised by HR Directorate.'
            : 'Submitted by Department Dean for Academic Workload Scrutiny.'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit requisition');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  let submitBtnLabel = 'Submit to Dean Academic';
  let routingSubtext = 'Dispatched directly to Dean Academic desk.';
  if (approvalRouting === 'direct_hr_order') {
    submitBtnLabel = isSubmitting ? 'Creating Requisition...' : 'Create & Direct Sanction';
    routingSubtext = 'Immediate executive sanction: skips approvals and initiates recruitment immediately.';
  } else if (approvalRouting === 'route_vc') {
    submitBtnLabel = isSubmitting ? 'Submitting to VC...' : 'Submit to VC / Registrar';
    routingSubtext = 'Dispatched directly to Vice Chancellor & Registrar executive desk.';
  } else {
    submitBtnLabel = isSubmitting ? 'Submitting...' : 'Submit for Academic Review';
    routingSubtext = 'Dispatched to Dean Academic for workload & compliance review.';
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {isHR ? 'Create Hiring Requirement & Requisition' : 'New Faculty Requisition'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isHR ? 'Directorate of HR & Faculty Affairs' : 'Department Dean Requisition Desk'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="text-rose-600 font-bold">✕</button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Section 0: Approval Routing & Executive Sanction (For HR or when configurable) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Approval Workflow &amp; Sanction Authority</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">Select routing option</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option 1: Direct HR Order */}
              <label
                onClick={() => setApprovalRouting('direct_hr_order')}
                className={`p-3 rounded-xl border cursor-pointer select-none transition flex flex-col justify-between ${
                  approvalRouting === 'direct_hr_order'
                    ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-xs flex items-center space-x-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Direct HR Order</span>
                    </span>
                    <input
                      type="radio"
                      name="approvalRouting"
                      checked={approvalRouting === 'direct_hr_order'}
                      onChange={() => setApprovalRouting('direct_hr_order')}
                      className="text-blue-600 cursor-pointer"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Direct executive order. Sanctioned immediately; HR can post jobs and intake candidates right away.
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Direct Approved (Stage 4)
                  </span>
                </div>
              </label>

              {/* Option 2: Route to VC / Registrar */}
              <label
                onClick={() => setApprovalRouting('route_vc')}
                className={`p-3 rounded-xl border cursor-pointer select-none transition flex flex-col justify-between ${
                  approvalRouting === 'route_vc'
                    ? 'bg-purple-50/70 border-purple-400 ring-2 ring-purple-500/20'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-xs flex items-center space-x-1">
                      <Building2 className="w-3.5 h-3.5 text-purple-600" />
                      <span>Route to VC / Reg.</span>
                    </span>
                    <input
                      type="radio"
                      name="approvalRouting"
                      checked={approvalRouting === 'route_vc'}
                      onChange={() => setApprovalRouting('route_vc')}
                      className="text-purple-600 cursor-pointer"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Bypasses academic review and sends directly to VC &amp; Registrar desk for formal sanction.
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Pending VC Sanction (Stage 3)
                  </span>
                </div>
              </label>

              {/* Option 3: Standard Academic Workflow */}
              <label
                onClick={() => setApprovalRouting('standard_academic')}
                className={`p-3 rounded-xl border cursor-pointer select-none transition flex flex-col justify-between ${
                  approvalRouting === 'standard_academic'
                    ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/20'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 text-xs flex items-center space-x-1">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-600" />
                      <span>Academic Review</span>
                    </span>
                    <input
                      type="radio"
                      name="approvalRouting"
                      checked={approvalRouting === 'standard_academic'}
                      onChange={() => setApprovalRouting('standard_academic')}
                      className="text-slate-600 cursor-pointer"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Standard route to Dean Academic for workload &amp; ratio review before reaching VC.
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Dean Academic (Stage 1)
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Card 1: Cadre & Position Overview */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                <span>1. Cadre &amp; Designation</span>
              </span>
              {/* Cadre Segmented Pill */}
              <div className="inline-flex bg-white p-0.5 rounded-lg border border-slate-200 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setCadreType('Teaching')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    cadreType === 'Teaching'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Teaching Faculty
                </button>
                <button
                  type="button"
                  onClick={() => setCadreType('Non-Teaching')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${
                    cadreType === 'Non-Teaching'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Non-Teaching / Staff
                </button>
              </div>
            </div>

            {/* Department */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Faculty / Department:
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingDept(!isAddingDept)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  {isAddingDept ? '✕ Close' : '+ Add New Department'}
                </button>
              </div>

              {isAddingDept && (
                <div className="mb-2 p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                  <div className="text-[11px] font-bold text-blue-900">Add New Department to Database</div>
                  {deptSaveError && (
                    <div className="text-[11px] text-rose-600 font-semibold">{deptSaveError}</div>
                  )}
                  <div className="flex flex-wrap sm:flex-nowrap gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Faculty of Artificial Intelligence"
                      value={newDeptInput}
                      onChange={(e) => setNewDeptInput(e.target.value)}
                      className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Code (e.g. FAI)"
                      value={newDeptCode}
                      onChange={(e) => setNewDeptCode(e.target.value)}
                      className="w-24 p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      disabled={isDeptSaving || !newDeptInput.trim()}
                      onClick={handleQuickAddDept}
                      className="px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      {isDeptSaving ? 'Saving...' : 'Add'}
                    </button>
                  </div>
                </div>
              )}

              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Designation Level & Specialization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Designation Level:
                </label>
                <select
                  value={designationLevel}
                  onChange={(e) => handleLevelChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {POST_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Specialization / Domain:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Artificial Intelligence & ML"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            {/* Positions, Urgency & Budget Head */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Positions Sanctioned:
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setNumberOfPositions(Math.max(1, numberOfPositions - 1))}
                    className="p-2.5 bg-white border border-r-0 border-slate-200 rounded-l-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={numberOfPositions}
                    onChange={(e) => setNumberOfPositions(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white border-y border-slate-200 p-2 text-center font-bold text-slate-900 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setNumberOfPositions(numberOfPositions + 1)}
                    className="p-2.5 bg-white border border-l-0 border-slate-200 rounded-r-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Hiring Urgency:
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent / Immediate</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Budget Head / Package:
                </label>
                <input
                  type="text"
                  value={salaryScale}
                  onChange={(e) => setSalaryScale(e.target.value)}
                  placeholder="e.g. ₹8,40,000 – ₹10,80,000 p.a."
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Workload Justification & Qualifications */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                <span>2. Workload Justification &amp; Specifications</span>
              </span>
            </div>

            {/* Teaching Load Justification */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Requirement Justification:
              </label>
              <textarea
                rows={2}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="State enrollment increase, credit-hour teaching load deficit, or institutional expansion requirement..."
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400 leading-relaxed"
                required
              />
            </div>

            {/* Qualifications */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Required Qualifications:
              </label>
              <textarea
                rows={2}
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                placeholder="e.g. Ph.D. in relevant discipline with First Class Master's degree; minimum 2 Scopus/UGC-CARE publications..."
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400 leading-relaxed"
                required
              />
            </div>

            {/* Experience */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">
                  Experience Requirements:
                </label>
                <div className="flex items-center space-x-1 text-[10px]">
                  <span className="text-slate-400">Presets:</span>
                  {['0-2 Years', '2-5 Years', '5-8 Years', '8+ Years'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setExperience(preset)}
                      className={`px-2 py-0.5 rounded-md border transition cursor-pointer ${
                        experience === preset
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
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. 2 - 5 Years in University / Research"
                className="w-full border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Upload Job Requirement Document / JD File */}
            <div className="pt-1">
              <label className="block font-semibold text-slate-700 mb-1">
                Upload Job Requirement Document / JD <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              {!jobDescriptionFileName ? (
                <label className="border border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-2.5 flex items-center justify-center space-x-2 cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition">
                  <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-medium text-slate-600">
                    Upload Job Requirement Sheet / Specification (PDF or DOC)
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleJdUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center space-x-2 min-w-0">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-emerald-950 text-xs truncate">{jobDescriptionFileName}</span>
                    {jobDescriptionFileSize && (
                      <span className="text-[10px] text-emerald-700 shrink-0">({jobDescriptionFileSize})</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setJobDescriptionFileName('');
                      setJobDescriptionFileSize('');
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer ml-2"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-[11px] text-slate-500">
              {routingSubtext}
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
              >
                <span>{submitBtnLabel}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}