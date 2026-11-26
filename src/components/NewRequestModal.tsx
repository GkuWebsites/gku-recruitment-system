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
          postLevel: designationLevel,
          numberOfPositions: Number(numberOfPositions),
          urgency: priority,
          tentativeBudget: salaryScale,
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

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const authoritiesList: string[] = [];
  if (isHR && hrWorkflowMode === 'request_approval') {
    if (targetAuthorities.vc) authoritiesList.push('VC');
    if (targetAuthorities.registrar) authoritiesList.push('Registrar');
  }

  let submitBtnLabel = 'Submit for Academic Review';
  let routingSubtext = 'Dispatched to Dean Academic for workload & compliance review.';
  if (isHR) {
    if (hrWorkflowMode === 'direct') {
      submitBtnLabel = isSubmitting ? 'Publishing Direct Job...' : 'Direct Publish Job Requirement';
      routingSubtext = '⚡ Direct Recruitment: No approval required. Immediately active in HR Recruitment Pipeline.';
    } else {
      const authLabel = authoritiesList.join(' & ') || 'VC / Registrar';
      submitBtnLabel = isSubmitting ? 'Submitting for Sanction...' : `Request Approval from ${authLabel}`;
      routingSubtext = `🏛️ Dispatched to ${authLabel} desk for executive approval before posting.`;
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header - Minimal, Clean & Professional */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-snug">
              {isHR ? 'Create Job Requirement' : 'New Faculty Requisition'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isHR
                ? 'Create and publish or route a new recruitment requirement.'
                : 'Submit a new teaching requirement for departmental workload review.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="text-rose-600 font-bold cursor-pointer">✕</button>
          </div>
        )}

        {/* Form Body - Clean White Canvas, Zero Clutter */}
        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-5 text-xs">
          {/* HR Workflow Selection - Clean Segmented Bar without Heavy Boxes */}
          {isHR ? (
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-semibold text-slate-500">Recruitment Mode:</span>
                <div className="inline-flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setHrWorkflowMode('direct')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      hrWorkflowMode === 'direct'
                        ? 'bg-[#0f2d59] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Direct Recruitment
                  </button>
                  <button
                    type="button"
                    onClick={() => setHrWorkflowMode('request_approval')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      hrWorkflowMode === 'request_approval'
                        ? 'bg-[#0f2d59] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Request Approval
                  </button>
                </div>

                {hrWorkflowMode === 'request_approval' && (
                  <div className="flex items-center space-x-2.5 pl-2 text-xs font-semibold text-slate-700">
                    <span className="text-slate-400 font-normal">Authority:</span>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={targetAuthorities.vc}
                        onChange={(e) => {
                          setTargetAuthorities((prev) => ({
                            ...prev,
                            vc: e.target.checked || !prev.registrar
                          }));
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-3.5 h-3.5"
                      />
                      <span>VC</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={targetAuthorities.registrar}
                        onChange={(e) => {
                          setTargetAuthorities((prev) => ({
                            ...prev,
                            registrar: e.target.checked || !prev.vc
                          }));
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-3.5 h-3.5"
                      />
                      <span>Registrar</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Dean Visibility Toggle */}
              <label className="flex items-center space-x-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={visibleToDean}
                  onChange={(e) => setVisibleToDean(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span>Visible to Department Dean</span>
              </label>
            </div>
          ) : (
            <div className="pb-3 border-b border-slate-100 text-xs text-slate-500 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
              <span>Requisition routes to Dean Academic for workload &amp; ratio review before VC sanction.</span>
            </div>
          )}

          {/* Form Fields: Balanced 2-Column Grid on Pure White Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
            {/* Left Column: Department, Cadre & Position Details */}
            <div className="space-y-4">
              {/* Department */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Department / Faculty
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingDept(!isAddingDept)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    {isAddingDept ? 'Close' : '+ Add Department'}
                  </button>
                </div>

                {isAddingDept && (
                  <div className="mb-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="text-[11px] font-bold text-slate-800">Add New Department to Database</div>
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
                        placeholder="Code (FAI)"
                        value={newDeptCode}
                        onChange={(e) => setNewDeptCode(e.target.value)}
                        className="w-20 p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        disabled={isDeptSaving || !newDeptInput.trim()}
                        onClick={handleQuickAddDept}
                        className="px-3 py-2 bg-[#0f2d59] hover:bg-[#163f7a] text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
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

              {/* Cadre & Designation Level */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Cadre
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setCadreType('Teaching')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                        cadreType === 'Teaching'
                          ? 'bg-[#0f2d59] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Teaching
                    </button>
                    <button
                      type="button"
                      onClick={() => setCadreType('Non-Teaching')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                        cadreType === 'Non-Teaching'
                          ? 'bg-[#0f2d59] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Non-Teaching
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Designation Level
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
              </div>

              {/* Specialization / Subject Domain */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Specialization / Domain
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

              {/* Positions, Urgency & Budget */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Positions
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={numberOfPositions}
                    onChange={(e) => setNumberOfPositions(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none text-center"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Urgency
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Budget / Salary
                  </label>
                  <input
                    type="text"
                    value={salaryScale}
                    onChange={(e) => setSalaryScale(e.target.value)}
                    placeholder="₹8,40,000 – ₹10,80,000"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none truncate"
                  />
                </div>
              </div>

              {/* Requirement Document Upload */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Requirement Document <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                {!jobDescriptionFileName ? (
                  <label className="border border-slate-200 hover:border-slate-300 rounded-xl p-2.5 flex items-center justify-center space-x-2 cursor-pointer bg-slate-50/60 hover:bg-slate-50 transition text-xs text-slate-600 font-medium">
                    <UploadCloud className="w-4 h-4 text-slate-500" />
                    <span>Attach Job Description (PDF/DOC)</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleJdUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div className="flex items-center space-x-2 truncate">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{jobDescriptionFileName}</span>
                      {jobDescriptionFileSize && (
                        <span className="text-slate-400 text-[10px]">({jobDescriptionFileSize})</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setJobDescriptionFileName('');
                        setJobDescriptionFileSize('');
                      }}
                      className="text-slate-400 hover:text-rose-600 font-bold ml-2 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Experience, Justification & Qualifications */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Experience Requirement
                </label>
                <input
                  type="text"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g. 2 - 5 Years in University / Research"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Requirement Justification
                </label>
                <textarea
                  rows={4}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="State enrollment increase, credit-hour teaching load deficit, or institutional expansion requirement..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400 leading-relaxed resize-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Required Qualifications &amp; Criteria
                </label>
                <textarea
                  rows={4}
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  placeholder="e.g. Ph.D. in relevant discipline with First Class Master's degree; minimum 2 Scopus/UGC-CARE publications..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400 leading-relaxed resize-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Footer - Minimal & Balanced */}
          <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-500 font-medium">
              {routingSubtext}
            </span>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#0f2d59] hover:bg-[#163f7a] rounded-xl shadow-xs transition disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
              >
                <span>{submitBtnLabel}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}