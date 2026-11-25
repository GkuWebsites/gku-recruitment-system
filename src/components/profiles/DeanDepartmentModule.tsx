'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { IHiringRequest } from '@/lib/types';
import { UNIVERSITY_DEPARTMENTS } from '@/lib/constants';
import { Plus, Search, Building2, MessageSquare, CheckCircle2, Clock, AlertCircle, FileText, Check, ShieldCheck, Filter } from 'lucide-react';
import { ClarificationThreadChat } from '../ClarificationThreadChat';

interface DeanDepartmentModuleProps {
  requests: IHiringRequest[];
  onSelectRequest: (request: IHiringRequest) => void;
  onOpenTimeline?: (request: IHiringRequest) => void;
  onOpenNewModal: () => void;
  onRefresh: () => void;
  currentUser?: {
    name: string;
    email: string;
    designation: string;
    department?: string;
  } | null;
}

export function DeanDepartmentModule({
  requests,
  onSelectRequest,
  onOpenTimeline,
  onOpenNewModal,
  onRefresh,
  currentUser
}: DeanDepartmentModuleProps) {
  const [departments, setDepartments] = useState<string[]>(UNIVERSITY_DEPARTMENTS);
  const [selectedDept, setSelectedDept] = useState<string>(currentUser?.department || UNIVERSITY_DEPARTMENTS[0]);
  const [selectedPostFilter, setSelectedPostFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'myRequests' | 'clarifications' | 'cleared'>('myRequests');
  const [replyText, setReplyText] = useState<{ [id: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser?.department) {
      setSelectedDept(currentUser.department);
    }
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setDepartments(data.data);
        }
      })
      .catch((e) => console.error(e));
  }, [currentUser]);

  // Filter requests belonging to this department (or all departments)
  const deptRequests = selectedDept === 'all' ? requests : requests.filter((r) => r.department === selectedDept);

  // Available Post Titles derived dynamically
  const availablePostTitles = useMemo(() => {
    const set = new Set<string>();
    deptRequests.forEach((r) => {
      if (r.postTitle && r.postTitle.trim()) set.add(r.postTitle.trim());
    });
    return Array.from(set).sort();
  }, [deptRequests]);

  const filteredRequests = deptRequests.filter((r) => {
    if (selectedPostFilter !== 'all' && r.postTitle?.trim().toLowerCase() !== selectedPostFilter.trim().toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.requestId.toLowerCase().includes(q) ||
        r.postTitle.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.creator?.name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const clarificationNeeded = deptRequests.filter(
    (r) => r.status === 'Returned for Clarification'
  );

  // Filter all requisitions that have received governance clearance (Academic or Executive Sanction)
  const clearedRequests = deptRequests.filter(
    (r) =>
      r.status !== 'Rejected' &&
      (r.deanAcademicApproval?.decision === 'Approved' ||
        r.vcRegistrarApproval?.decision === 'Approved' ||
        (r.currentStage || 1) >= 3 ||
        [
          'Approved by Dean Academic',
          'Approved by VC / Registrar',
          'In Process (HR - Recruitment)',
          'Interview & Selection Completed',
          'Joined & Request Closed'
        ].includes(r.status))
  );

  const filteredCleared = clearedRequests.filter((r) => {
    if (selectedPostFilter !== 'all' && r.postTitle?.trim().toLowerCase() !== selectedPostFilter.trim().toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.requestId.toLowerCase().includes(q) ||
        r.postTitle.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.creator?.name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSendClarification = async (requestId: string) => {
    const text = replyText[requestId];
    if (!text || !text.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/department`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clarification_reply',
          requestId,
          actorName: `Dean / Director / HOD (${selectedDept})`,
          remarks: text.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setReplyText((prev) => ({ ...prev, [requestId]: '' }));
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStageBadge = (stage: number, status: string) => {
    if (status === 'Returned for Clarification') {
      return {
        pill: 'bg-amber-50 text-amber-900 border-amber-200',
        label: 'Clarification Requested by Dean Academic'
      };
    }
    if (status === 'Rejected') {
      return {
        pill: 'bg-rose-50 text-rose-700 border-rose-200',
        label: 'Requisition Rejected'
      };
    }
    if (stage === 1 || stage === 2) {
      return {
        pill: 'bg-blue-50 text-blue-800 border-blue-200',
        label: 'Under Academic Scrutiny (Dean Academic)'
      };
    }
    if (stage === 3) {
      return {
        pill: 'bg-purple-50 text-purple-800 border-purple-200',
        label: 'Under Sanction Review (VC / Registrar)'
      };
    }
    if (stage === 4) {
      return {
        pill: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        label: 'Active Recruitment & Advertising (HR)'
      };
    }
    if (stage === 5) {
      return {
        pill: 'bg-teal-50 text-teal-800 border-teal-200',
        label: 'Interview & Selection Stage'
      };
    }
    return {
      pill: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      label: 'Joined & Closed'
    };
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Department Dean Workspace
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit and track department faculty and staff hiring requisitions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Department Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">My Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenNewModal}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Raise New Requisition</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-3 border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('myRequests')}
          className={`py-3 px-4 border-b-2 transition ${
            activeTab === 'myRequests'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Requisitions ({deptRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('clarifications')}
          className={`py-3 px-4 border-b-2 transition flex items-center space-x-1.5 ${
            activeTab === 'clarifications'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Clarification Desk</span>
          {clarificationNeeded.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
              {clarificationNeeded.length} Action Needed
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('cleared')}
          className={`py-3 px-4 border-b-2 transition flex items-center space-x-1.5 ${
            activeTab === 'cleared'
              ? 'border-emerald-600 text-emerald-800 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Cleared Requisitions ({clearedRequests.length})</span>
        </button>
      </div>

      {/* TAB 1: REQUISITIONS LIST */}
      {activeTab === 'myRequests' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search requisitions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Department Filter */}
              <div className="flex items-center space-x-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={selectedDept}
                  onChange={(e) => {
                    setSelectedDept(e.target.value);
                    setSelectedPostFilter('all');
                  }}
                  className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer max-w-[190px] truncate"
                  title="Filter by Department"
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Post Title Filter */}
              <select
                value={selectedPostFilter}
                onChange={(e) => setSelectedPostFilter(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer max-w-[200px] truncate"
                title="Filter by Post Title"
              >
                <option value="all">All Post Titles</option>
                {availablePostTitles.map((title) => (
                  <option key={title} value={title}>{title}</option>
                ))}
              </select>

              {/* Reset button */}
              {(selectedDept !== (currentUser?.department || 'all') || selectedPostFilter !== 'all' || searchQuery.trim()) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDept(currentUser?.department || UNIVERSITY_DEPARTMENTS[0]);
                    setSelectedPostFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                >
                  ✕ Reset
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 font-medium shrink-0">
              Showing {filteredRequests.length} of {deptRequests.length} requisitions for{' '}
              <strong className="text-slate-800">{selectedDept === 'all' ? 'All Departments' : selectedDept}</strong>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Requisition ID</th>
                  <th className="py-3.5 px-6">Post Title & Cadre</th>
                  <th className="py-3.5 px-6 text-center">Positions</th>
                  <th className="py-3.5 px-6">Salary Scale / Budget</th>
                  <th className="py-3.5 px-6">Current Workflow Stage</th>
                  <th className="py-3.5 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No requisitions raised yet for this department. Click &ldquo;+ Raise New
                      Requisition&rdquo; to begin.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => {
                    const badge = getStageBadge(req.currentStage, req.status);
                    return (
                      <tr
                        key={req.requestId}
                        onClick={() => onSelectRequest(req)}
                        className="hover:bg-slate-50/70 cursor-pointer transition"
                      >
                        <td className="py-4 px-6 font-mono font-bold text-blue-900">
                          {req.requestId}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 text-sm">{req.postTitle}</div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            {req.employmentType} • {req.postLevel}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-slate-800">
                          {req.numberOfPositions}
                        </td>
                        <td className="py-4 px-6 text-slate-700 font-medium">
                          {req.tentativeBudget}
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1.5">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full font-bold border text-[10px] ${badge.pill}`}
                            >
                              {badge.label}
                            </span>
                            {onOpenTimeline && (
                              <div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenTimeline(req);
                                  }}
                                  className="inline-flex items-center space-x-1 text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 px-2 py-0.5 rounded-md font-bold text-[10px] border border-slate-200 transition cursor-pointer"
                                  title="View step-by-step governance timeline and remarks"
                                >
                                  <Clock className="w-3 h-3 text-blue-600" />
                                  <span>View Timeline</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectRequest(req);
                            }}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs transition cursor-pointer"
                            title="View job specifications and edit if not yet reviewed"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Job Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CLARIFICATION DESK */}
      {activeTab === 'clarifications' && (
        <div className="space-y-6">
          {clarificationNeeded.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="font-bold text-slate-800">No Pending Queries</div>
              <p className="text-xs text-slate-400 mt-1">
                None of your requisitions are currently awaiting clarification from Dean Academic or the Vice Chancellor.
              </p>
            </div>
          ) : (
            clarificationNeeded.map((req) => (
              <div key={req.requestId} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between px-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                      {req.requestId}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{req.postTitle}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {req.department} • {req.numberOfPositions} Position(s) • Budget: {req.tentativeBudget}
                  </div>
                </div>

                <ClarificationThreadChat
                  request={req}
                  currentUser={currentUser}
                  onRefresh={onRefresh}
                  allowCreateThread={false}
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: CLEARED REQUISITIONS */}
      {activeTab === 'cleared' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {/* Search & Summary Bar */}
          <div className="p-4 border-b border-slate-100 bg-emerald-50/30 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search cleared requisitions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Department Filter */}
              <div className="flex items-center space-x-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={selectedDept}
                  onChange={(e) => {
                    setSelectedDept(e.target.value);
                    setSelectedPostFilter('all');
                  }}
                  className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer max-w-[190px] truncate"
                  title="Filter by Department"
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Post Title Filter */}
              <select
                value={selectedPostFilter}
                onChange={(e) => setSelectedPostFilter(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer max-w-[200px] truncate"
                title="Filter by Post Title"
              >
                <option value="all">All Post Titles</option>
                {availablePostTitles.map((title) => (
                  <option key={title} value={title}>{title}</option>
                ))}
              </select>

              {(selectedDept !== (currentUser?.department || 'all') || selectedPostFilter !== 'all' || searchQuery.trim()) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDept(currentUser?.department || UNIVERSITY_DEPARTMENTS[0]);
                    setSelectedPostFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                >
                  ✕ Reset
                </button>
              )}
            </div>

            <div className="text-xs text-slate-600 font-medium flex items-center space-x-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                Showing <strong className="text-slate-900">{filteredCleared.length}</strong> of{' '}
                <strong className="text-slate-900">{clearedRequests.length}</strong> cleared requisitions for{' '}
                <strong className="text-slate-900">{selectedDept === 'all' ? 'All Departments' : selectedDept}</strong>
              </span>
            </div>
          </div>

          {/* Cleared Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Requisition ID</th>
                  <th className="py-3.5 px-6">Post Title & Cadre</th>
                  <th className="py-3.5 px-6 text-center">Positions</th>
                  <th className="py-3.5 px-6">Academic Clearance</th>
                  <th className="py-3.5 px-6">VC / Registrar Sanction</th>
                  <th className="py-3.5 px-6">Current Status</th>
                  <th className="py-3.5 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCleared.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <div className="font-semibold text-slate-600">No cleared requisitions found</div>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        Requisitions that have cleared Dean Academic scrutiny or gained VC Sanction will be listed here.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCleared.map((req) => {
                    const isAcademicCleared =
                      req.deanAcademicApproval?.decision === 'Approved' || (req.currentStage || 1) >= 3;
                    const isVcSanctioned =
                      req.vcRegistrarApproval?.decision === 'Approved' || (req.currentStage || 1) >= 4;

                    return (
                      <tr
                        key={req.requestId}
                        onClick={() => onSelectRequest(req)}
                        className="hover:bg-slate-50/70 cursor-pointer transition"
                      >
                        <td className="py-4 px-6 font-mono font-bold text-blue-900">
                          {req.requestId}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 text-sm">{req.postTitle}</div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            {req.employmentType} • {req.postLevel}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-slate-800">
                          {req.numberOfPositions}
                        </td>
                        <td className="py-4 px-6">
                          {isAcademicCleared ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-bold border text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Academic Cleared</span>
                              </span>
                              {req.deanAcademicApproval?.decidedBy && (
                                <div className="text-[10px] text-slate-500">
                                  {req.deanAcademicApproval.decidedBy}
                                </div>
                              )}
                              {req.deanAcademicApproval?.remarks && (
                                <div
                                  className="text-[10px] text-slate-600 italic truncate max-w-xs"
                                  title={req.deanAcademicApproval.remarks}
                                >
                                  &ldquo;{req.deanAcademicApproval.remarks}&rdquo;
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Under Scrutiny</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {isVcSanctioned ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-bold border text-[10px] bg-purple-50 text-purple-800 border-purple-200">
                                <Check className="w-3 h-3 text-purple-600" />
                                <span>Sanction Accorded</span>
                              </span>
                              {req.vcRegistrarApproval?.decidedBy && (
                                <div className="text-[10px] text-slate-500">
                                  {req.vcRegistrarApproval.decidedBy}
                                </div>
                              )}
                              {req.vcRegistrarApproval?.remarks && (
                                <div
                                  className="text-[10px] text-slate-600 italic truncate max-w-xs"
                                  title={req.vcRegistrarApproval.remarks}
                                >
                                  &ldquo;{req.vcRegistrarApproval.remarks}&rdquo;
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              <span>Awaiting VC Sanction</span>
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <span className="inline-block px-2.5 py-0.5 rounded-full font-bold border text-[10px] bg-blue-50 text-blue-800 border-blue-200">
                              {req.status}
                            </span>
                            {onOpenTimeline && (
                              <div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenTimeline(req);
                                  }}
                                  className="inline-flex items-center space-x-1 text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 px-2 py-0.5 rounded-md font-bold text-[10px] border border-slate-200 transition cursor-pointer"
                                  title="View step-by-step governance timeline and remarks"
                                >
                                  <Clock className="w-3 h-3 text-blue-600" />
                                  <span>View Timeline</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectRequest(req);
                            }}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs transition cursor-pointer"
                            title="View job specifications"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}