'use client';

import React from 'react';
import { UNIVERSITY_DEPARTMENTS } from '@/lib/constants';
import { Building2, Clock, IndianRupee } from 'lucide-react';

interface AnalyticsPanelProps {
  stats: {
    totalRequests: number;
    approved: number;
    rejected: number;
    inProcess: number;
    totalPromotionCost: number;
    totalCandidates: number;
    totalJoined: number;
    departmentBreakdown: Record<string, { total: number; approved: number; inProcess: number; rejected: number }>;
    channelSpendBreakdown: Record<string, number>;
    averageTurnaroundDays: number;
  };
}

export function AnalyticsPanel({ stats }: AnalyticsPanelProps) {
  const deptList = UNIVERSITY_DEPARTMENTS;

  return (
    <div className="space-y-5">
      {/* Metrics Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Department Coverage
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">12 / 12</div>
          <p className="text-xs text-slate-500 mt-1 font-medium">All academic faculties actively participating</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Average Turnaround Time
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">14 Days</div>
          <p className="text-xs text-slate-500 mt-1 font-medium">From HOD submission to VC administrative sanction</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Advertising & Sourcing Outlay
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            ₹{(stats.totalPromotionCost || 0).toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Times Ascent, LinkedIn, Print & Web Portals</p>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Faculty-wise Requisitions & Clearance Status
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Real-time monitoring across all 12 university academic departments.
            </p>
          </div>
          <span className="text-xs font-extrabold text-blue-900 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
            12 Academic Faculties
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Academic Faculty / Department</th>
                <th className="py-3 px-4 text-center">Total Requisitions</th>
                <th className="py-3 px-4 text-center">Approved & Active</th>
                <th className="py-3 px-4 text-center">In Governance Review</th>
                <th className="py-3 px-4 text-center">Rejected / Query</th>
                <th className="py-3 px-4 text-right">Clearance Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deptList.map((dept) => {
                const data = stats.departmentBreakdown?.[dept] || { total: 0, approved: 0, inProcess: 0, rejected: 0 };
                const rate = data.total > 0 ? Math.round((data.approved / data.total) * 100) : 0;
                return (
                  <tr key={dept} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-800">{dept}</td>
                    <td className="py-3 px-4 text-center text-slate-900 font-extrabold">{data.total}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200">
                        {data.approved}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200">
                        {data.inProcess}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                        {data.rejected}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-blue-900">{rate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Media Spend Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-1">
          Recruitment Channel Expenditure & Media Breakdown
        </h3>
        <p className="text-xs text-slate-500 mb-4 font-medium">
          Detailed media breakdown of advertisement placements.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(stats.channelSpendBreakdown || {}).length === 0 ? (
            <div className="p-6 text-center text-slate-400 border border-slate-200 rounded-xl col-span-2 text-xs">
              No advertising expenditures recorded yet.
            </div>
          ) : (
            Object.entries(stats.channelSpendBreakdown || {}).map(([channel, cost]) => (
              <div key={channel} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-sm shadow-2xs">
                <span className="font-bold text-slate-800">{channel}</span>
                <span className="font-extrabold text-blue-950 font-mono text-base">₹{cost.toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
