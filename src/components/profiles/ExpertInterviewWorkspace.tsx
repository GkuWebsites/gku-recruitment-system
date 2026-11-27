'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Lock,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Star,
  Unlock,
  User,
  Users
} from 'lucide-react';
import { IHiringRequest, Candidate } from '@/lib/types';

interface ExpertInterviewWorkspaceProps {
  requests: IHiringRequest[];
  currentUser?: {
    name: string;
    email: string;
    designation: string;
    department?: string;
  } | null;
  onRefresh?: () => void;
}

export function ExpertInterviewWorkspace({
  requests,
  currentUser,
  onRefresh
}: ExpertInterviewWorkspaceProps) {
  const [filterType, setFilterType] = useState<'all' | 'unlocked' | 'locked' | 'completed'>('all');

  // Extract all scheduled & interviewed candidates
  const allInterviews: {
    request: IHiringRequest;
    candidate: Candidate;
    isTimeReached: boolean;
    interviewDateStr: string;
  }[] = [];

  const now = new Date();

  requests.forEach((req) => {
    if (req.candidates && req.candidates.length > 0) {
      req.candidates.forEach((cand) => {
        if (
          cand.status === 'Interview Scheduled' ||
          cand.status === 'Interviewed' ||
          cand.status === 'Selected' ||
          cand.status === 'Shortlisted'
        ) {
          // Check if expert is assigned or matching department
          const isAssigned =
            !cand.interviewDetails?.assignedExpertIds ||
            cand.interviewDetails.assignedExpertIds.length === 0 ||
            cand.interviewDetails.assignedExpertIds.some(
              (id) => id === currentUser?.email || id === currentUser?.name
            ) ||
            cand.interviewDetails.panelMembers.some(
              (m) =>
                m.toLowerCase().includes('expert') ||
                (currentUser?.name && m.toLowerCase().includes(currentUser.name.toLowerCase()))
            ) ||
            true; // In demo/expert mode, show all department/assigned interviews

          if (isAssigned && cand.interviewDetails) {
            // Determine if interview time has arrived
            let isTimeReached = false;
            let dateStr = cand.interviewDetails.date || '';

            try {
              // Try parsing date string like '2026-12-10 11:00 AM' or '2026-12-10'
              const interviewDate = new Date(dateStr);
              if (!isNaN(interviewDate.getTime())) {
                isTimeReached = now.getTime() >= interviewDate.getTime();
              } else {
                // If date is today or past, unlock
                isTimeReached = true;
              }
            } catch {
              isTimeReached = true;
            }

            // If already evaluated, it is always unlocked
            if (cand.status === 'Interviewed' || cand.status === 'Selected' || cand.status === 'Shortlisted') {
              isTimeReached = true;
            }

            allInterviews.push({
              request: req,
              candidate: cand,
              isTimeReached,
              interviewDateStr: dateStr
            });
          }
        }
      });
    }
  });

  const displayedInterviews = allInterviews.filter((item) => {
    if (filterType === 'unlocked') return item.isTimeReached && item.candidate.status === 'Interview Scheduled';
    if (filterType === 'locked') return !item.isTimeReached;
    if (filterType === 'completed') return item.candidate.status !== 'Interview Scheduled';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Expert Profile Welcome Banner */}
      <div className="text-black rounded-2xl p-6 sm:p-7 shadow-md border border-slate-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Welcome, {currentUser?.name || 'Subject Expert'}
            </h2>
          </div>

          <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-xs px-4 py-3 rounded-xl border border-white/15">
            <Users className="w-5 h-5 text-blue-300" />
            <div>
              <div className="text-xl font-black">{allInterviews.length}</div>
              <div className="text-[10px] text-slate-300 uppercase font-semibold">Total Assigned</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${filterType === 'all'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            All Interviews ({allInterviews.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('unlocked')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${filterType === 'unlocked'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Ready to Evaluate ({allInterviews.filter((i) => i.isTimeReached && i.candidate.status === 'Interview Scheduled').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('locked')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${filterType === 'locked'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Upcoming (Locked) ({allInterviews.filter((i) => !i.isTimeReached).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('completed')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${filterType === 'completed'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Evaluated ({allInterviews.filter((i) => i.candidate.status !== 'Interview Scheduled').length})
          </button>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 rounded-xl transition shadow-xs cursor-pointer"
          >
            ↻ Refresh Schedule
          </button>
        )}
      </div>

      {/* Interviews Grid / List */}
      {displayedInterviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No Scheduled Interviews in this Queue</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            When HR schedules candidates with you on the committee panel, they will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedInterviews.map(({ request: req, candidate: cand, isTimeReached, interviewDateStr }) => {
            const isCompleted =
              cand.status === 'Interviewed' ||
              cand.status === 'Selected' ||
              cand.status === 'Shortlisted';

            return (
              <div
                key={`${req.requestId}-${cand.id}`}
                className={`bg-white rounded-2xl border transition shadow-xs overflow-hidden flex flex-col justify-between ${!isTimeReached
                  ? 'border-amber-200/80 bg-gradient-to-b from-amber-50/20 to-white'
                  : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : 'border-blue-200 shadow-md'
                  }`}
              >
                {/* Card Top Details */}
                <div className="p-5 space-y-4">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {req.requestId}
                    </span>

                    {!isTimeReached ? (
                      <span className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300">
                        <Lock className="w-3.5 h-3.5 text-amber-700" />
                        <span>Protected (Unlocks at Interview)</span>
                      </span>
                    ) : isCompleted ? (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Evaluated & Scored ({cand.interviewDetails?.scores?.totalScore || 0}/50)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-300">
                        <Unlock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Active Session (Ready to Evaluate)</span>
                      </span>
                    )}
                  </div>

                  {/* Post Designation (Always visible) */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Target Designation:
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                      {req.postTitle}
                    </h3>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      {req.department} • {req.employmentType} ({req.postLevel})
                    </div>
                  </div>

                  {/* Schedule Strip (Always visible) */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Interview Schedule:</span>
                      <span className="font-bold text-slate-900 flex items-center space-x-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span className="truncate">{interviewDateStr || 'Today'}</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Venue / Mode:</span>
                      <span className="font-bold text-slate-700 flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span className="truncate">Board Room / Online</span>
                      </span>
                    </div>
                  </div>

                  {/* CANDIDATE SPECIFICATIONS - CONDITIONALLY UNLOCKED */}
                  {!isTimeReached ? (
                    /* Locked View */
                    <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-center space-y-2">
                      <Lock className="w-6 h-6 text-amber-700 mx-auto" />
                      <div className="text-xs font-bold text-amber-950">
                        Candidate Credentials & Resume Protected
                      </div>
                      <p className="text-[11px] text-amber-800 leading-tight">
                        In accordance with university anti-bias guidelines, candidate full name, contact information,
                        and resume will unlock automatically when the scheduled interview begins.
                      </p>
                    </div>
                  ) : (
                    /* Unlocked View */
                    <div className="space-y-3 pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          Candidate Full Name:
                        </span>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                          {cand.fullName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {cand.qualification} • {cand.experienceYears} Years Exp • {cand.currentAffiliation || 'Independent'}
                        </div>
                      </div>

                      {/* Attached CV Download */}
                      {cand.resumeFileName && (
                        <div>
                          <a
                            href={`/uploads/resumes/${cand.resumeFileName}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-2 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>View / Download Candidate CV ({cand.resumeFileName})</span>
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Bottom CTA */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Panelists: {cand.interviewDetails?.panelMembers?.length || 1}
                  </span>

                  {isTimeReached ? (
                    <Link
                      href={`/interviews/${encodeURIComponent(req.requestId)}/${encodeURIComponent(cand.id)}`}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{isCompleted ? 'View / Edit Assessment' : 'Open Assessment Sheet &rarr;'}</span>
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 bg-slate-200 text-slate-500 rounded-xl text-xs font-semibold cursor-not-allowed"
                    >
                      🔒 Unlocks at Interview
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
