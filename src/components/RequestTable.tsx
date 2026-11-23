'use client';

import React, { useState } from 'react';
import { IHiringRequest, UserRole } from '@/lib/types';
import { UNIVERSITY_DEPARTMENTS } from '@/lib/constants';
import { Search, ChevronRight, SlidersHorizontal, ArrowUpRight } from 'lucide-react';

interface RequestTableProps {
  requests: IHiringRequest[];
  onSelectRequest: (request: IHiringRequest) => void;
  currentRole: UserRole;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedDept: string;
  setSelectedDept: (dept: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
}

export function RequestTable({
  requests,
  onSelectRequest,
  currentRole,
  searchQuery,
  setSearchQuery,
  selectedDept,
  setSelectedDept,
  selectedType,
  setSelectedType
}: RequestTableProps) {
  const [selectedUrgency, setSelectedUrgency] = useState<string>('All');

  const filtered = requests.filter((req) => {
    // Statutory Workflow Rule:
    // When Deans request new job requirement details, it shows ONLY to Dean Academic and HR,
    // NOT to VC / Registrar until approved by Dean Academic!
    if (currentRole === 'VC / Registrar') {
      const isApprovedByDean =
        req.currentStage >= 3 ||
        req.deanAcademicApproval?.decision === 'Approved' ||
        [
          'Approved by Dean Academic',
          'Under Review (VC / Registrar)',
          'Approved by VC / Registrar',
          'In Process (HR - Recruitment)',
          'Interview & Selection Completed',
          'Joined & Request Closed'
        ].includes(req.status);
      if (!isApprovedByDean) return false;
    }

    if (selectedDept !== 'All' && req.department !== selectedDept) return false;
    if (selectedType !== 'All' && req.employmentType !== selectedType) return false;
    if (selectedUrgency !== 'All' && req.urgency !== selectedUrgency) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        req.requestId.toLowerCase().includes(q) ||
        req.postTitle.toLowerCase().includes(q) ||
        req.department.toLowerCase().includes(q) ||
        req.creator?.name?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Joined & Request Closed':
        return {
          pill: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
          dot: 'bg-emerald-500',
          label: 'Joined & Closed'
        };
      case 'Interview & Selection Completed':
      case 'Approved by VC / Registrar':
      case 'Approved by Dean Academic':
        return {
          pill: 'bg-teal-50 text-teal-700 border-teal-200 font-bold',
          dot: 'bg-teal-500',
          label: status
        };
      case 'In Process (HR - Recruitment)':
        return {
          pill: 'bg-blue-50 text-blue-700 border-blue-200 font-bold',
          dot: 'bg-blue-500',
          label: 'In Recruitment'
        };
      case 'Under Review (Dean Academic)':
      case 'Under Review (VC / Registrar)':
      case 'Request Submitted (Department)':
        return {
          pill: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
          dot: 'bg-amber-500',
          label: status
        };
      case 'Returned for Clarification':
        return {
          pill: 'bg-orange-50 text-orange-800 border-orange-200 font-bold',
          dot: 'bg-orange-500',
          label: 'Clarification Needed'
        };
      case 'Rejected':
        return {
          pill: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
          dot: 'bg-rose-500',
          label: 'Rejected'
        };
      default:
        return {
          pill: 'bg-slate-100 text-slate-800 border-slate-200 font-medium',
          dot: 'bg-slate-400',
          label: status
        };
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
      {/* Search & Filter Toolbar */}
      <div className="p-5 border-b border-slate-200/90 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, title, department, or submitter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-medium placeholder:text-slate-400"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
          >
            <option value="All">All 12 Academic Faculties</option>
            {UNIVERSITY_DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Cadre Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
          >
            <option value="All">Teaching & Non-Teaching</option>
            <option value="Teaching">Teaching Faculty</option>
            <option value="Non-Teaching">Non-Teaching Staff</option>
          </select>

          {/* Urgency */}
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
          >
            <option value="All">All Priorities</option>
            <option value="Normal">Normal</option>
            <option value="High">High Priority</option>
            <option value="Urgent">Urgent Regulatory</option>
          </select>
        </div>

        <div className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-2xs">
          Showing <span className="text-blue-600 font-extrabold">{filtered.length}</span> of {requests.length} Requisitions
        </div>
      </div>

      {/* Spacious Data Table */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
              <th className="py-4 px-6">Requisition ID</th>
              <th className="py-4 px-6">Post & Faculty</th>
              <th className="py-4 px-6 text-center">Positions</th>
              <th className="py-4 px-6">Current Stage</th>
              <th className="py-4 px-6">Governance Status</th>
              <th className="py-4 px-6">Applicants</th>
              <th className="py-4 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-500">
                  <div className="text-base font-bold text-slate-800">No requisitions found</div>
                  <p className="text-xs text-slate-400 mt-1">Adjust your filters or submit a new requisition.</p>
                </td>
              </tr>
            ) : (
              filtered.map((req) => {
                const badge = getStatusBadge(req.status);
                return (
                  <tr
                    key={req._id || req.requestId}
                    onClick={() => onSelectRequest(req)}
                    className="hover:bg-slate-50/80 cursor-pointer transition"
                  >
                    {/* Requisition ID */}
                    <td className="py-4.5 px-6 whitespace-nowrap">
                      <div className="font-mono font-bold text-blue-900 text-xs bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200/80 inline-block">
                        {req.requestId}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 font-medium">
                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-GB') : 'Nov 2026'}
                      </div>
                    </td>

                    {/* Post & Faculty */}
                    <td className="py-4.5 px-6">
                      <div className="font-bold text-slate-900 text-sm">{req.postTitle}</div>
                      <div className="text-xs text-slate-500 flex items-center space-x-2 mt-1">
                        <span className="font-semibold text-slate-700">{req.department}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {req.employmentType} ({req.postLevel})
                        </span>
                      </div>
                    </td>

                    {/* Positions */}
                    <td className="py-4.5 px-6 text-center whitespace-nowrap">
                      <span className="inline-block px-3 py-1 font-extrabold text-slate-900 bg-slate-100 rounded-lg text-xs">
                        {req.numberOfPositions}
                      </span>
                      <div className="text-xs mt-1">
                        {req.urgency === 'Urgent' ? (
                          <span className="font-bold text-rose-700">Urgent</span>
                        ) : req.urgency === 'High' ? (
                          <span className="font-bold text-amber-700">High</span>
                        ) : (
                          <span className="text-slate-400">Normal</span>
                        )}
                      </div>
                    </td>

                    {/* Current Stage */}
                    <td className="py-4.5 px-6 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                          {req.currentStage || 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {req.currentStage === 1 && 'Department Raise'}
                          {req.currentStage === 2 && 'Academic Clearance'}
                          {req.currentStage === 3 && 'Administrative Sanction'}
                          {req.currentStage === 4 && 'HR Recruitment Drive'}
                          {req.currentStage === 5 && 'Interviews & Scoring'}
                          {req.currentStage === 6 && 'Offer & Joining'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 font-medium">
                        Stage {req.currentStage || 1} of 6
                      </div>
                    </td>

                    {/* Governance Status */}
                    <td className="py-4.5 px-6 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${badge.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        <span>{badge.label}</span>
                      </span>
                    </td>

                    {/* Applicants */}
                    <td className="py-4.5 px-6 whitespace-nowrap text-slate-700">
                      <div>
                        <strong className="text-slate-900 font-bold">{req.candidates?.length || 0}</strong> applicants
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Ad: ₹{(req.totalPromotionCost || 0).toLocaleString()}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-4.5 px-6 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRequest(req);
                        }}
                        className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-blue-600 rounded-lg transition shadow-2xs"
                      >
                        Manage
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
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
  );
}
