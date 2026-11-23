'use client';

import React, { useState } from 'react';
import { UNIVERSITY_DEPARTMENTS, POST_LEVELS } from '@/lib/constants';
import { X, Building2, Briefcase, GraduationCap, CheckCircle2, ChevronRight, Plus, Minus } from 'lucide-react';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDepartment?: string;
  creatorName?: string;
  creatorEmail?: string;
}

export function NewRequestModal({
  isOpen,
  onClose,
  onSuccess,
  defaultDepartment,
  creatorName = 'Dr. Harpreet Singh',
  creatorEmail = 'dean.engg@gurukashiuniv.edu.in'
}: NewRequestModalProps) {
  const [department, setDepartment] = useState(defaultDepartment || UNIVERSITY_DEPARTMENTS[0]);
  const [cadreType, setCadreType] = useState<'Teaching' | 'Non-Teaching'>('Teaching');
  const [postTitle, setPostTitle] = useState('');
  const [designationLevel, setDesignationLevel] = useState(POST_LEVELS[2] || 'Assistant Professor');
  const [numberOfPositions, setNumberOfPositions] = useState(1);
  const [priority, setPriority] = useState<'Normal' | 'High' | 'Urgent'>('Normal');
  const [salaryScale, setSalaryScale] = useState('₹8,40,000 – ₹10,80,000 p.a.');
  const [justification, setJustification] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [experience, setExperience] = useState('2 - 5 Years');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !justification.trim() || !qualifications.trim()) {
      setErrorMsg('Please complete post specialization, teaching load justification, and qualifications.');
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
          creatorName,
          creatorEmail,
          initialComment: 'Submitted by Department Dean for Academic Workload Scrutiny.'
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
                New Faculty Requisition
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Stage 1: Dispatched to Dean Academic for workload & ratio verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
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
        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-5 text-xs">
          {/* Card 1: Cadre & Position Overview */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                <span>1. Cadre & Designation</span>
              </span>
              {/* Cadre Segmented Pill */}
              <div className="inline-flex bg-white p-0.5 rounded-lg border border-slate-200 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setCadreType('Teaching')}
                  className={`px-3 py-1 rounded-md transition ${
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
                  className={`px-3 py-1 rounded-md transition ${
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
              <label className="block font-semibold text-slate-700 mb-1">
                Faculty / Department:
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {UNIVERSITY_DEPARTMENTS.map((dept) => (
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

            {/* Positions & Budget Head */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Positions Sanctioned:
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setNumberOfPositions(Math.max(1, numberOfPositions - 1))}
                    className="p-2.5 bg-white border border-r-0 border-slate-200 rounded-l-xl text-slate-600 hover:bg-slate-100 transition"
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
                    className="p-2.5 bg-white border border-l-0 border-slate-200 rounded-r-xl text-slate-600 hover:bg-slate-100 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
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

          {/* Card 2: Academic Workload Justification & Qualifications */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3.5">
            <div className="border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                <span>2. Workload Justification & Eligibility</span>
              </span>
            </div>

            {/* Teaching Load Justification */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Teaching Load & Faculty Deficit Justification:
              </label>
              <textarea
                rows={2}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="State student enrollment increase, credit-hour teaching load deficit, or statutory UGC/AICTE compliance norms..."
                className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400 leading-relaxed"
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
                placeholder="e.g., Ph.D. in relevant discipline with First Class Master's degree; minimum 2 Scopus/UGC-CARE indexed publications..."
                className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400 leading-relaxed"
                required
              />
            </div>

            {/* Experience with Quick Select Pills */}
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
                      className={`px-2 py-0.5 rounded-md border transition ${
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
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-[11px] text-slate-500">
              Dispatched directly to Dean Academic desk.
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition disabled:opacity-50 flex items-center space-x-1.5"
              >
                <span>{isSubmitting ? 'Submitting...' : 'Submit to Dean Academic'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
