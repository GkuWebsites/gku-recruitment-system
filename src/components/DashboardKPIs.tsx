'use client';

import React from 'react';
import { FileText, CheckCircle2, Clock, IndianRupee } from 'lucide-react';

interface StatsProps {
  stats: {
    totalRequests: number;
    approved: number;
    rejected: number;
    inProcess: number;
    totalPromotionCost: number;
    totalCandidates: number;
    totalJoined: number;
    averageTurnaroundDays: number;
  };
  onFilterStatus: (status: string) => void;
  activeStatusFilter: string;
}

export function DashboardKPIs({ stats, onFilterStatus, activeStatusFilter }: StatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Total Requisitions */}
      <button
        onClick={() => onFilterStatus('All')}
        className={`p-6 rounded-2xl border text-left transition bg-white shadow-xs hover:shadow-md ${
          activeStatusFilter === 'All'
            ? 'border-blue-500 ring-2 ring-blue-500/20'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Requisitions
          </span>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {stats.totalRequests}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Across all 12 academic departments
          </p>
        </div>
      </button>

      {/* 2. Approved */}
      <button
        onClick={() => onFilterStatus('Approved')}
        className={`p-6 rounded-2xl border text-left transition bg-white shadow-xs hover:shadow-md ${
          activeStatusFilter === 'Approved'
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Approved & Sanctioned
          </span>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">
            {stats.approved}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {stats.totalJoined} Candidates Joined & Onboarded
          </p>
        </div>
      </button>

      {/* 3. In Governance Review */}
      <button
        onClick={() => onFilterStatus('In Process')}
        className={`p-6 rounded-2xl border text-left transition bg-white shadow-xs hover:shadow-md ${
          activeStatusFilter === 'In Process'
            ? 'border-amber-500 ring-2 ring-amber-500/20'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Under Governance Review
          </span>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-3xl font-extrabold text-amber-600 tracking-tight">
            {stats.inProcess}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Dean Academic & VC clearance queue
          </p>
        </div>
      </button>

      {/* 4. Sourcing Spend */}
      <div className="p-6 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Recruitment Ad Budget
          </span>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
            ₹{((stats.totalPromotionCost || 0) / 1000).toFixed(1)}k
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {stats.totalCandidates} total applicants received
          </p>
        </div>
      </div>
    </div>
  );
}
