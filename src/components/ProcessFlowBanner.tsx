'use client';

import React from 'react';
import { ArrowRight, CheckCircle2, Award, Users, UserCheck, ShieldCheck, FileText } from 'lucide-react';

interface ProcessFlowBannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProcessFlowBanner({ isOpen, onClose }: ProcessFlowBannerProps) {
  if (!isOpen) return null;

  const stages = [
    {
      num: 1,
      title: 'Department / Dean',
      tag: '12 Departments',
      action: 'Raise Hiring Request',
      bullets: [
        'Post & Cadre (Teaching / Non-Teaching)',
        'Number of Positions (e.g. 2 AP)',
        'Teaching Workload Justification',
        'Required Qualifications & Experience',
        'Tentative Salary Budget'
      ],
      color: 'border-blue-200 bg-blue-50/50 text-blue-900',
      badge: 'bg-blue-100 text-blue-800'
    },
    {
      num: 2,
      title: 'Dean Academic',
      tag: 'Academic Scrutiny',
      action: 'Review & Clearance',
      bullets: [
        'Scrutinize Credit-Hour Workload',
        'Faculty-to-Student Ratio Verification',
        'Approve & Advance to VC Office',
        'Seek Clarification or Query',
        'If Rejected: Back with Comments'
      ],
      color: 'border-amber-200 bg-amber-50/50 text-amber-900',
      badge: 'bg-amber-100 text-amber-800'
    },
    {
      num: 3,
      title: 'VC / Registrar',
      tag: 'Administration',
      action: 'Final Institutional Sanction',
      bullets: [
        'Financial Budget Sanction',
        'Executive Council Concurrence',
        'Administrative Approval',
        'Query Academic Dean / Department',
        'Release to HR Recruitment Cell'
      ],
      color: 'border-purple-200 bg-purple-50/50 text-purple-900',
      badge: 'bg-purple-100 text-purple-800'
    },
    {
      num: 4,
      title: 'HR Department',
      tag: 'Execution Cell',
      action: 'Sourcing & Promotions',
      bullets: [
        'Times Ascent, LinkedIn, Portals',
        'Track Advertisement Costs',
        'Candidate Pool Intake & CV Screening',
        'Schedule Interview Panels',
        'Coordinate Committee Dates'
      ],
      color: 'border-indigo-200 bg-indigo-50/50 text-indigo-900',
      badge: 'bg-indigo-100 text-indigo-800'
    },
    {
      num: 5,
      title: 'Selection Panel',
      tag: 'Evaluation Desk',
      action: 'Interviews & Scorecards',
      bullets: [
        'Domain Knowledge (Max 40)',
        'Research & Publications (Max 25)',
        'Teaching Aptitude (Max 20)',
        'Communication (Max 15)',
        'Selection Committee Merit List'
      ],
      color: 'border-teal-200 bg-teal-50/50 text-teal-900',
      badge: 'bg-teal-100 text-teal-800'
    },
    {
      num: 6,
      title: 'Joining & Closure',
      tag: 'Onboarding Cell',
      action: 'Appointment & Closure',
      bullets: [
        'Issue Formal Offer Letter',
        '4-Point Document Verification',
        'Identity, Degrees, Relieving, Police',
        'Biometric & Employee Code Allocation',
        'Update to "Joined" & Close Request'
      ],
      color: 'border-emerald-200 bg-emerald-50/50 text-emerald-900',
      badge: 'bg-emerald-100 text-emerald-800'
    }
  ];

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                End-to-End University Recruitment Architecture
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Statutory Governance Process
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-level approval workflow from workforce requirement to appointment letter and joining.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50"
          >
            Close Overview ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          {stages.map((stage) => (
            <div
              key={stage.num}
              className={`border rounded-xl p-3.5 flex flex-col justify-between ${stage.color} shadow-2xs`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-lg bg-white border border-slate-300 font-extrabold text-xs flex items-center justify-center text-slate-900 shadow-xs">
                    {stage.num}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stage.badge}`}>
                    {stage.tag}
                  </span>
                </div>
                <h3 className="font-bold text-xs text-slate-900 mb-0.5">{stage.title}</h3>
                <div className="text-[11px] font-bold text-slate-700 mb-2">{stage.action}</div>
                <ul className="text-xs space-y-1 text-slate-600 leading-snug">
                  {stage.bullets.map((b, i) => (
                    <li key={i} className="flex items-start space-x-1">
                      <span className="text-slate-400 font-bold">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
