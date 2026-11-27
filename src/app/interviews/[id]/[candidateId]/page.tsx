'use client';

import React, { useState, useEffect, use, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  FileText,
  GraduationCap,
  HelpCircle,
  MapPin,
  Plus,
  Save,
  ShieldCheck,
  Star,
  Trash2,
  UserCheck,
  Users,
  XCircle
} from 'lucide-react';
import { IHiringRequest, Candidate, MemberEvaluation, EvaluationMetric } from '@/lib/types';

interface EvaluationPageProps {
  params: Promise<{
    id: string;
    candidateId: string;
  }>;
}

function CandidateInterviewEvaluationContent({ params }: EvaluationPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  const requestId = decodeURIComponent(resolvedParams.id);
  const candidateId = decodeURIComponent(resolvedParams.candidateId);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [request, setRequest] = useState<IHiringRequest | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);

  // Panel Members & Metric evaluations out of 50 (default clean: no dummy names/marks/remarks)
  const [memberEvaluations, setMemberEvaluations] = useState<MemberEvaluation[]>([
    {
      memberId: 'm-1',
      memberName: '',
      memberRole: '',
      metrics: [
        { id: 'met-1', name: 'Technical & Domain Knowledge', maxMarks: 20, marksObtained: 0 },
        { id: 'met-2', name: 'Communication & Articulation Skills', maxMarks: 15, marksObtained: 0 },
        { id: 'met-3', name: 'Teaching Aptitude & Pedagogy', maxMarks: 15, marksObtained: 0 }
      ],
      totalScore: 0,
      remarks: '',
      recommendation: 'Recommend'
    }
  ]);

  // Only first panel member expanded by default
  const [expandedMembers, setExpandedMembers] = useState<Record<number, boolean>>({ 0: true });
  const [overrideTotalScore, setOverrideTotalScore] = useState<number | null>(null);

  const [overallRecommendation, setOverallRecommendation] = useState<
    'Strongly Recommend' | 'Recommend' | 'Waitlist' | 'Not Recommended'
  >('Recommend');
  const [committeeRemarks, setCommitteeRemarks] = useState('');

  const toggleMemberExpand = (idx: number) => {
    setExpandedMembers((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Fetch requisition and candidate
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setErrorMsg('');
        const res = await fetch(`/api/requests/${requestId}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to load requisition');
        }

        const req: IHiringRequest = data.data;
        setRequest(req);

        const cand = req.candidates?.find((c) => c.id === candidateId);
        if (!cand) {
          throw new Error(`Candidate with ID "${candidateId}" was not found in requisition ${requestId}`);
        }
        setCandidate(cand);

        // If candidate already has saved memberEvaluations, load them!
        if (cand.interviewDetails?.memberEvaluations && cand.interviewDetails.memberEvaluations.length > 0) {
          setMemberEvaluations(cand.interviewDetails.memberEvaluations);
          if (typeof cand.interviewDetails.totalScore50 === 'number') {
            setOverrideTotalScore(cand.interviewDetails.totalScore50);
          }
          if (cand.interviewDetails.recommendation) {
            setOverallRecommendation(cand.interviewDetails.recommendation);
          }
          if (cand.interviewDetails.panelRemarks) {
            setCommitteeRemarks(cand.interviewDetails.panelRemarks);
          }
        } else if (cand.interviewDetails?.panelMembers && cand.interviewDetails.panelMembers.length > 0) {
          // Initialize from scheduled panel members with cleared marks (out of 50)
          const initialized: MemberEvaluation[] = cand.interviewDetails.panelMembers.map((rawName, idx) => {
            const match = rawName.match(/^(.+?)\s*\((.+)\)$/);
            const parsedName = match ? match[1].trim() : rawName;
            const parsedRole = match ? match[2].trim() : '';
            return {
              memberId: `m-${idx + 1}`,
              memberName: parsedName,
              memberRole: parsedRole,
              metrics: [
                { id: `met-${idx}-1`, name: 'Technical & Domain Knowledge', maxMarks: 20, marksObtained: 0 },
                { id: `met-${idx}-2`, name: 'Communication Skills', maxMarks: 15, marksObtained: 0 },
                { id: `met-${idx}-3`, name: 'Teaching Aptitude & Pedagogy', maxMarks: 15, marksObtained: 0 }
              ],
              totalScore: 0,
              remarks: '',
              recommendation: 'Recommend'
            };
          });
          setMemberEvaluations(initialized);
          setExpandedMembers({ 0: true });
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error fetching candidate data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [requestId, candidateId]);

  // Recalculate member total score out of 50
  const recalcMemberTotal = (metrics: EvaluationMetric[]) => {
    const sum = metrics.reduce((acc, m) => acc + (Number(m.marksObtained) || 0), 0);
    return Math.min(50, Math.max(0, Number(sum.toFixed(1))));
  };

  // Metric changes inside a member section
  const handleMetricChange = (
    memberIndex: number,
    metricIndex: number,
    field: 'name' | 'maxMarks' | 'marksObtained',
    value: any
  ) => {
    setMemberEvaluations((prev) => {
      const next = [...prev];
      const member = { ...next[memberIndex] };
      const metrics = [...member.metrics];
      const targetMetric = { ...metrics[metricIndex] };

      if (field === 'marksObtained') {
        const numVal = Math.max(0, Number(value) || 0);
        targetMetric.marksObtained = Math.min(targetMetric.maxMarks || 50, numVal);
      } else if (field === 'maxMarks') {
        targetMetric.maxMarks = Math.max(1, Number(value) || 1);
        if (targetMetric.marksObtained > targetMetric.maxMarks) {
          targetMetric.marksObtained = targetMetric.maxMarks;
        }
      } else {
        targetMetric.name = value;
      }

      metrics[metricIndex] = targetMetric;
      member.metrics = metrics;
      member.totalScore = recalcMemberTotal(metrics);
      next[memberIndex] = member;
      return next;
    });
    setOverrideTotalScore(null);
  };

  // Direct edit of member score (out of 50)
  const handleMemberScoreChange = (memberIndex: number, value: string) => {
    const parsed = value === '' ? 0 : Math.min(50, Math.max(0, Number(value) || 0));
    setMemberEvaluations((prev) => {
      const next = [...prev];
      next[memberIndex] = {
        ...next[memberIndex],
        totalScore: parsed
      };
      return next;
    });
    setOverrideTotalScore(null);
  };

  // Add dynamic metric to member
  const handleAddMetric = (memberIndex: number) => {
    setMemberEvaluations((prev) => {
      const next = [...prev];
      const member = { ...next[memberIndex] };
      const newMet: EvaluationMetric = {
        id: `met-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: '',
        maxMarks: 10,
        marksObtained: 0
      };
      member.metrics = [...member.metrics, newMet];
      member.totalScore = recalcMemberTotal(member.metrics);
      next[memberIndex] = member;
      return next;
    });
    setOverrideTotalScore(null);
  };

  // Remove metric
  const handleRemoveMetric = (memberIndex: number, metricIndex: number) => {
    setMemberEvaluations((prev) => {
      const next = [...prev];
      const member = { ...next[memberIndex] };
      member.metrics = member.metrics.filter((_, idx) => idx !== metricIndex);
      member.totalScore = recalcMemberTotal(member.metrics);
      next[memberIndex] = member;
      return next;
    });
    setOverrideTotalScore(null);
  };

  // Member details change
  const handleMemberChange = (memberIndex: number, field: 'memberName' | 'memberRole' | 'remarks' | 'recommendation', value: any) => {
    setMemberEvaluations((prev) => {
      const next = [...prev];
      next[memberIndex] = {
        ...next[memberIndex],
        [field]: value
      };
      return next;
    });
  };

  // Add another panel member (all fields clean/blank, metrics out of 50)
  const handleAddPanelMember = () => {
    const newMember: MemberEvaluation = {
      memberId: `m-${Date.now()}`,
      memberName: '',
      memberRole: '',
      metrics: [
        { id: `met-${Date.now()}-1`, name: 'Technical & Domain Knowledge', maxMarks: 25, marksObtained: 0 },
        { id: `met-${Date.now()}-2`, name: 'Communication & Aptitude', maxMarks: 25, marksObtained: 0 }
      ],
      totalScore: 0,
      remarks: '',
      recommendation: 'Recommend'
    };
    setMemberEvaluations((prev) => {
      const next = [...prev, newMember];
      setExpandedMembers((exp) => ({ ...exp, [next.length - 1]: true }));
      return next;
    });
    setOverrideTotalScore(null);
  };

  // Remove panel member
  const handleRemovePanelMember = (memberIndex: number) => {
    if (memberEvaluations.length <= 1) {
      alert('At least one evaluator panel member is required.');
      return;
    }
    setMemberEvaluations((prev) => prev.filter((_, idx) => idx !== memberIndex));
    setOverrideTotalScore(null);
  };

  // Calculate aggregated average score out of 50 (auto-calculated, or user override)
  const calculatedAverageScoreOutOf50 =
    memberEvaluations.length > 0
      ? Number(
        (
          memberEvaluations.reduce((acc, m) => acc + (Number(m.totalScore) || 0), 0) /
          memberEvaluations.length
        ).toFixed(1)
      )
      : 0;

  const averageScoreOutOf50 =
    overrideTotalScore !== null ? overrideTotalScore : calculatedAverageScoreOutOf50;

  // Submit interview evaluation to server
  const handleSubmitEvaluation = async (decision: 'shortlist' | 'reject' | 'interviewed') => {
    if (!request || !candidate) return;

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/hr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate_interview',
          requestId: request.requestId,
          candidateId: candidate.id,
          memberEvaluations,
          totalScore50: averageScoreOutOf50,
          decision,
          recommendation: overallRecommendation,
          panelRemarks:
            committeeRemarks.trim() ||
            `Candidate evaluated by Selection Committee. Average Score: ${averageScoreOutOf50} / 50 across ${memberEvaluations.length} panel member(s). Outcome: ${decision === 'shortlist' ? 'Shortlisted' : decision === 'reject' ? 'Rejected' : 'Interviewed'}.`,
          actorName: 'Selection Committee Board'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit interview evaluation');
      }

      setSuccessMsg(
        `✓ Assessment successfully submitted! Candidate ${candidate.fullName} scored ${averageScoreOutOf50}/50 (${overallRecommendation}) and marked as ${decision === 'shortlist' ? 'Shortlisted' : decision === 'reject' ? 'Rejected' : 'Interviewed'}.`
      );

      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving evaluation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center max-w-md w-full space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-bold text-slate-800">Loading Interview Assessment Sheet...</h2>
          <p className="text-xs text-slate-500">Retrieving candidate profile and evaluation rubric.</p>
        </div>
      </div>
    );
  }

  if (errorMsg && !candidate) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-rose-200 text-center max-w-md w-full space-y-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            ✕
          </div>
          <h2 className="text-base font-bold text-slate-900">Evaluation Sheet Unavailable</h2>
          <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
          >
            &larr; Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#D3D3D3] text-slate-800 pb-20">
      {/* Top Banner Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              title="Return to previous screen"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {request?.requestId}
                </span>
                <span className="text-xs font-semibold text-slate-500">{request?.department}</span>
              </div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900">
                Interview Assessment Sheet: {candidate?.fullName}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Editable Total Score out of 50 (auto-calculated from all members) */}
            <div className="flex items-center space-x-2 bg-blue-50/80 px-3 py-1.5 rounded-xl border border-blue-200 text-xs">
              <span className="text-blue-900 font-bold">Total Score:</span>
              <input
                type="number"
                min={0}
                max={50}
                step={0.5}
                value={averageScoreOutOf50}
                onChange={(e) => {
                  const val = Math.min(50, Math.max(0, Number(e.target.value) || 0));
                  setOverrideTotalScore(val);
                }}
                className="w-16 bg-white border border-blue-300 rounded-lg px-2 py-0.5 text-center text-sm font-black text-blue-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                title="Auto-calculated from all members (editable)"
              />
              <span className="text-slate-500 font-semibold">/ 50</span>
            </div>

            <Link
              href="/"
              className="text-xs font-semibold text-slate-600 hover:text-blue-700 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition"
            >
              Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Status Messages */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="font-bold text-rose-500">✕</button>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </span>
            <button onClick={() => setSuccessMsg('')} className="font-bold text-emerald-600">✕</button>
          </div>
        )}

        {/* Candidate & Post Header Card */}
        <section className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                Target Post: {request?.postTitle}
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {candidate?.fullName}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
                <span>📧 {candidate?.email}</span>
                <span>📞 {candidate?.phone || 'Not provided'}</span>
                <span>🏢 Current Affiliation: {candidate?.currentAffiliation || 'Not specified'}</span>
              </div>
            </div>

            {candidate?.resumeFileName && (
              <div className="flex items-center space-x-2">
                <a
                  href={`/uploads/resumes/${candidate.resumeFileName}`}
                  download={candidate.resumeFileName}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-2 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200/80 rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Download Candidate CV ({candidate.resumeFileName})</span>
                </a>
              </div>
            )}
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Qualification</span>
              <span className="font-bold text-slate-900 mt-0.5 block truncate">{candidate?.qualification}</span>
            </div>
            <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Experience</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{candidate?.experienceYears} Years</span>
            </div>
            <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Interview Schedule</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{candidate?.interviewDetails?.date || 'Today'}</span>
            </div>
            <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/70">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Status</span>
              <span className="font-bold text-blue-700 mt-0.5 block">{candidate?.status}</span>
            </div>
          </div>
        </section>



        {/* Panel Members Evaluation Sections (Separate per member) */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Selection Committee Panel Members ({memberEvaluations.length})</span>
            </h3>

            <button
              type="button"
              onClick={handleAddPanelMember}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Another Committee Evaluator</span>
            </button>
          </div>

          {memberEvaluations.map((member, mIdx) => {
            const isExpanded = Boolean(expandedMembers[mIdx]);
            return (
              <div
                key={member.memberId || mIdx}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition hover:border-slate-300"
              >
                {/* Panel Member Card Header */}
                <div className={`p-4 sm:p-5 bg-slate-50/70 ${isExpanded ? 'border-b border-slate-200' : ''} flex flex-wrap items-center justify-between gap-3`}>
                  <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
                    <button
                      type="button"
                      onClick={() => toggleMemberExpand(mIdx)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-700 hover:border-blue-300 transition cursor-pointer shrink-0"
                      title={isExpanded ? 'Collapse evaluator section' : 'Expand evaluator section'}
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    <div className="w-8 h-8 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {mIdx + 1}
                    </div>

                    <div className="flex-1 max-w-sm">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                        Panel Member Name:
                      </label>
                      <input
                        type="text"
                        value={member.memberName}
                        onChange={(e) => handleMemberChange(mIdx, 'memberName', e.target.value)}
                        placeholder="Enter panel member name..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
                      />
                    </div>

                    <div className="max-w-[200px]">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                        Panelist Role:
                      </label>
                      <input
                        type="text"
                        value={member.memberRole || ''}
                        onChange={(e) => handleMemberChange(mIdx, 'memberRole', e.target.value)}
                        placeholder="Enter role (e.g. Expert, Dean)..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    {/* Editable Member Score out of 50 */}
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Member Score</div>
                      <div className="flex items-center justify-end space-x-1">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          step={0.5}
                          value={member.totalScore}
                          onChange={(e) => handleMemberScoreChange(mIdx, e.target.value)}
                          className="w-16 bg-white border border-blue-300 rounded-lg px-2 py-1 text-center text-sm font-black text-blue-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          title="Edit member score directly (out of 50)"
                        />
                        <span className="text-xs text-slate-400 font-semibold">/ 50</span>
                      </div>
                    </div>

                    {memberEvaluations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePanelMember(mIdx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Remove this panel member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Dynamic Assessment Metrics List for this Member */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                        Assessment Metrics & Criteria (Score out of 50)
                      </span>

                      <button
                        type="button"
                        onClick={() => handleAddMetric(mIdx)}
                        className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Metric to this Member</span>
                      </button>
                    </div>

                    {member.metrics.length === 0 ? (
                      <div className="text-center py-4 bg-slate-50 rounded-xl text-xs text-slate-400">
                        No metrics added for this member. Click &quot;+ Add Metric&quot; to define criteria.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {member.metrics.map((metric, metIdx) => (
                          <div
                            key={metric.id || metIdx}
                            className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center bg-slate-50/60 p-3 rounded-xl border border-slate-200/70"
                          >
                            <div className="sm:col-span-6">
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                                Metric / Skill Name:
                              </label>
                              <input
                                type="text"
                                value={metric.name}
                                onChange={(e) => handleMetricChange(mIdx, metIdx, 'name', e.target.value)}
                                placeholder="e.g. Communication Skills, Technical Domain"
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                                Max Marks:
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={50}
                                value={metric.maxMarks}
                                onChange={(e) => handleMetricChange(mIdx, metIdx, 'maxMarks', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              />
                            </div>

                            <div className="sm:col-span-3">
                              <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                                Marks Awarded:
                              </label>
                              <div className="flex items-center space-x-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  max={metric.maxMarks}
                                  step={0.5}
                                  value={metric.marksObtained}
                                  onChange={(e) => handleMetricChange(mIdx, metIdx, 'marksObtained', e.target.value)}
                                  className="w-full bg-white border border-blue-400 rounded-lg px-2.5 py-1.5 text-xs font-black text-blue-900 text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                                <span className="text-xs text-slate-400 font-medium">/ {metric.maxMarks}</span>
                              </div>
                            </div>

                            <div className="sm:col-span-1 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveMetric(mIdx, metIdx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                                title="Remove this metric"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Member Recommendation & Remarks */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                          Individual Recommendation:
                        </label>
                        <select
                          value={member.recommendation || 'Recommend'}
                          onChange={(e) => handleMemberChange(mIdx, 'recommendation', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="Strongly Recommend">Strongly Recommend</option>
                          <option value="Recommend">Recommend</option>
                          <option value="Waitlist">Waitlist</option>
                          <option value="Not Recommended">Not Recommended</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                          Evaluator Confidential Remarks:
                        </label>
                        <input
                          type="text"
                          value={member.remarks || ''}
                          onChange={(e) => handleMemberChange(mIdx, 'remarks', e.target.value)}
                          placeholder="e.g. Excellent teaching demonstration, deep conceptual clarity in algorithms..."
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Consolidated Committee Decision & Action Bar */}
        <section className="bg-white rounded-2xl border-2 border-blue-600/30 p-6 shadow-md space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                Final Assessment Synthesis
              </span>
              <h3 className="text-lg font-black text-slate-900">
                Selection Committee Verdict & Aggregate Scoring
              </h3>
            </div>

            <div className="flex items-center space-x-3 bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-xl">
              <span className="text-xs font-bold text-blue-900">Total Score:</span>
              <div className="flex items-center space-x-1.5">
                <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                <input
                  type="number"
                  min={0}
                  max={50}
                  step={0.5}
                  value={averageScoreOutOf50}
                  onChange={(e) => {
                    const val = Math.min(50, Math.max(0, Number(e.target.value) || 0));
                    setOverrideTotalScore(val);
                  }}
                  className="w-20 bg-white border border-blue-300 rounded-lg px-2 py-1 text-center text-lg font-black text-blue-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  title="Auto-calculated from all members (editable)"
                />
                <span className="text-xs text-slate-500 font-semibold">/ 50</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Consolidated Committee Recommendation:
              </label>
              <select
                value={overallRecommendation}
                onChange={(e) => setOverallRecommendation(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Strongly Recommend">Strongly Recommend (High Priority)</option>
                <option value="Recommend">Recommend for Selection</option>
                <option value="Waitlist">Waitlist / Reserve Candidate</option>
                <option value="Not Recommended">Not Recommended / Reject</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Formal Committee Minute & Panel Remarks:
              </label>
              <textarea
                rows={2}
                value={committeeRemarks}
                onChange={(e) => setCommitteeRemarks(e.target.value)}
                placeholder="Enter consolidated committee minutes, justification for recommendation or specific terms..."
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmitEvaluation('interviewed')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : '💾 Save as Evaluated (Interviewed)'}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmitEvaluation('reject')}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : '✕ Mark as Rejected'}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmitEvaluation('shortlist')}
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Shortlisting...' : '✓ Finalize & Move to Shortlisted Candidates'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function CandidateInterviewEvaluationPage(props: EvaluationPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#D3D3D3] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-base font-bold text-slate-800">Loading Interview Evaluation Workspace...</h2>
          <p className="text-xs text-slate-500 mt-1">Fetching candidate and selection committee metrics</p>
        </div>
      }
    >
      <CandidateInterviewEvaluationContent {...props} />
    </Suspense>
  );
}
