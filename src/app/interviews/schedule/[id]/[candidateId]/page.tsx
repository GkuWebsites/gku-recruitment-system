'use client';

import React, { useState, useEffect, use, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UniversityLogo } from '@/components/Header';
import { IHiringRequest, Candidate } from '@/lib/types';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle2,
  FileText,
  User,
  GraduationCap,
  Building2,
  Download,
  Info,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2
} from 'lucide-react';

interface SchedulePageProps {
  params: Promise<{
    id: string;
    candidateId: string;
  }>;
}

function ScheduleInterviewContent({ params }: SchedulePageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  const requestId = decodeURIComponent(resolvedParams.id);
  const candidateId = decodeURIComponent(resolvedParams.candidateId);

  const [request, setRequest] = useState<IHiringRequest | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const [interviewDate, setInterviewDate] = useState('2026-12-10');
  const [interviewTime, setInterviewTime] = useState('11:00 AM');
  const [interviewVenue, setInterviewVenue] = useState('Board Room 1, Guru Kashi University');
  const [memberInput, setMemberInput] = useState('');
  const [panelMembers, setPanelMembers] = useState<string[]>([
    'Prof. Balwant Singh (Dean Academic)',
    'Prof. (Dr.) Harpreet Singh (Subject Expert Panelist)'
  ]);

  const [confirmUnapprovedProceed, setConfirmUnapprovedProceed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/requests/${encodeURIComponent(requestId)}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to load requisition');
        }
        const req: IHiringRequest = data.data;
        setRequest(req);

        const cand = (req.candidates || []).find((c) => c.id === candidateId);
        if (!cand) {
          throw new Error(`Candidate with ID "${candidateId}" not found in this requisition.`);
        }
        setCandidate(cand);

        if (cand.interviewDetails) {
          if (cand.interviewDetails.date) setInterviewDate(cand.interviewDetails.date);
          if (cand.interviewDetails.time) setInterviewTime(cand.interviewDetails.time);
          if (cand.interviewDetails.venue) setInterviewVenue(cand.interviewDetails.venue);
          if (cand.interviewDetails.panelMembers && cand.interviewDetails.panelMembers.length > 0) {
            setPanelMembers(cand.interviewDetails.panelMembers);
          }
        }
      } catch (err: unknown) {
        setErrorMsg((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [requestId, candidateId]);

  const handleAddMember = (name?: string) => {
    const memberName = (name || memberInput).trim();
    if (!memberName) return;
    if (!panelMembers.includes(memberName)) {
      setPanelMembers((prev) => [...prev, memberName]);
    }
    if (!name) setMemberInput('');
  };

  const handleRemoveMember = (idx: number) => {
    setPanelMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  // Determine CV Approval Status
  const isCvApprovalRequested = !!candidate?.cvApproval;
  const isCvApproved =
    candidate?.cvApproval &&
    candidate.cvApproval.reviews.some((r) => r.decision === 'Approved' || r.status === 'Approved');
  const isCvPending = isCvApprovalRequested && !isCvApproved;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panelMembers.length) {
      setErrorMsg('Please assign at least one interviewer / panel member.');
      return;
    }

    if (isCvPending && !confirmUnapprovedProceed) {
      setErrorMsg(
        'Statutory Leadership CV Clearance is pending. Please review the notice and check the confirmation box below to proceed with scheduling.'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setStatusMsg('');

    try {
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'schedule_interview',
          requestId,
          candidateId,
          interviewerNames: panelMembers,
          date: interviewDate,
          time: interviewTime,
          venue: interviewVenue,
          actorName: 'HR Recruitment Directorate'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to schedule interview');
      }

      setStatusMsg(`✓ Interview successfully scheduled for ${candidate?.fullName} on ${interviewDate} at ${interviewTime}! Redirecting...`);
      setTimeout(() => {
        router.push('/hr');
      }, 1300);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold text-slate-800">Loading Candidate & Requisition Details...</h2>
        <p className="text-xs text-slate-500 mt-1">Fetching candidate record and selection committee details</p>
      </div>
    );
  }

  if (errorMsg && !request) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <AlertTriangle className="w-12 h-12 text-rose-600 mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Unable to Open Schedule Workspace</h2>
        <p className="text-xs text-slate-600 mt-2 mb-4">{errorMsg}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          &larr; Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col">
      {/* Top Header */}
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
            <span className="font-semibold text-slate-500">Requisition:</span>
            <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              {requestId}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div>
          <Link
            href="/hr"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to HR Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Schedule Candidate Interview
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Configure interview date, time, panel composition, and venue for {candidate?.fullName}
              </p>
            </div>
            {candidate?.status && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 self-start sm:self-auto">
                Status: {candidate.status}
              </span>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {statusMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
            {statusMsg}
          </div>
        )}

        {/* Candidate Information Card */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                Candidate Profile
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                {candidate?.fullName}
              </h2>
              <p className="text-xs text-slate-500">
                Applied for: <strong className="text-slate-800">{request?.postTitle}</strong> ({request?.department})
              </p>
            </div>

            {/* Leadership CV Status Badge */}
            <div>
              {isCvApproved ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  ✓ Leadership CV Approved & Cleared
                </span>
              ) : isCvPending ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  ⏳ CV Approval Waiting (Leadership Review)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  <Info className="w-4 h-4 text-slate-500" />
                  Direct Sourced Candidate
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block">Email Address</span>
              <span className="font-bold text-slate-800 break-all">{candidate?.email}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Contact Number</span>
              <span className="font-bold text-slate-800">{candidate?.phone}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Highest Qualification</span>
              <span className="font-bold text-slate-800">{candidate?.qualification}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Experience</span>
              <span className="font-bold text-slate-800">{candidate?.experienceYears} Years</span>
            </div>
          </div>

          {candidate?.currentAffiliation && (
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <strong>Current Affiliation:</strong> {candidate.currentAffiliation}
              </div>
              {candidate.resumeFileName && (
                <span className="text-slate-500 font-medium text-[11px]">
                  Attached File: <strong className="text-slate-800">{candidate.resumeFileName}</strong>
                </span>
              )}
            </div>
          )}
        </section>

        {/* STATUTORY CV WARNING PROMPT (If Approval is Pending) */}
        {isCvPending && (
          <section className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-5 space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-amber-950">
                  Statutory Leadership CV Clearance Still Awaiting
                </h3>
                <p className="text-xs text-amber-800 leading-relaxed">
                  This candidate&apos;s CV was routed to University Leadership (VC / Registrar / Dean Academic) and is currently in the review pipeline.
                  If scheduling is urgent or part of an expedited recruitment drive, you may proceed, but this action will be logged in the recruitment audit trail.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200">
              <label className="flex items-center space-x-2.5 text-xs font-bold text-amber-950 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmUnapprovedProceed}
                  onChange={(e) => setConfirmUnapprovedProceed(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-700 focus:ring-amber-500 border-amber-400"
                />
                <span>
                  I confirm proceeding with interview scheduling ahead of leadership statutory clearance
                </span>
              </label>
            </div>
          </section>
        )}

        {/* Schedule Interview Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-700" />
            Interview Logistics & Panel Constitution
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Interview Date <span className="text-rose-600">*</span>:
              </label>
              <input
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Interview Time <span className="text-rose-600">*</span>:
              </label>
              <input
                type="text"
                value={interviewTime}
                onChange={(e) => setInterviewTime(e.target.value)}
                placeholder="e.g. 11:30 AM"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Interview Venue / Meeting Link <span className="text-rose-600">*</span>:
            </label>
            <input
              type="text"
              value={interviewVenue}
              onChange={(e) => setInterviewVenue(e.target.value)}
              placeholder="e.g. Board Room 1, Guru Kashi University or Google Meet Link"
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Panel Members Adder */}
          <div className="space-y-3 p-5 bg-blue-50/40 border border-blue-200 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-blue-950">
                  Selection Committee & Interviewers <span className="text-rose-600">*</span>
                </label>
                <p className="text-[11px] text-blue-700">
                  Add designated university deans, VC nominees, and external subject matter experts
                </p>
              </div>
              <span className="text-xs font-extrabold text-blue-900 bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200">
                {panelMembers.length} Member(s)
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMember();
                  }
                }}
                placeholder="Enter member name and designation..."
                className="flex-1 p-2.5 bg-white border border-blue-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleAddMember()}
                disabled={!memberInput.trim()}
                className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shrink-0 cursor-pointer"
              >
                + Add Member
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-500">Quick Suggestions:</span>
              {[
                'Prof. Balwant Singh (Dean Academic)',
                'Prof. (Dr.) Gurinder Singh (VC Nominee)',
                'Department Dean',
                'Prof. (Dr.) Harpreet Singh (External Subject Expert)',
                'External University Nominee',
                'Industry Specialist'
              ].map((sugg) => (
                <button
                  key={sugg}
                  type="button"
                  onClick={() => handleAddMember(sugg)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-100 text-blue-900 border border-blue-200 text-[10px] font-semibold transition cursor-pointer"
                >
                  + {sugg}
                </button>
              ))}
            </div>

            {/* Added Members List */}
            <div className="space-y-2 pt-2">
              {panelMembers.map((member, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-white border border-blue-100 rounded-xl text-xs font-semibold text-slate-800"
                >
                  <div className="flex items-center space-x-2">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>{member}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(idx)}
                    className="text-slate-400 hover:text-rose-600 text-xs font-bold p-1 cursor-pointer"
                    title="Remove member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel & Return
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Scheduling...' : 'Finalize & Schedule Interview'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function ScheduleInterviewPage(props: SchedulePageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-center text-xs text-slate-500">
          Loading Interview Scheduling Workspace...
        </div>
      }
    >
      <ScheduleInterviewContent {...props} />
    </Suspense>
  );
}
