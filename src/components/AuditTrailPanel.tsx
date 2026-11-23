'use client';

import React from 'react';
import { IHiringRequest } from '@/lib/types';
import { History, Shield, CheckCircle2 } from 'lucide-react';

interface AuditTrailPanelProps {
  requests: IHiringRequest[];
}

export function AuditTrailPanel({ requests }: AuditTrailPanelProps) {
  const allLogs: {
    requestId: string;
    department: string;
    postTitle: string;
    action: string;
    performedBy: string;
    role: string;
    details: string;
    timestamp: string;
  }[] = [];

  requests.forEach((req) => {
    if (req.auditTrail) {
      req.auditTrail.forEach((log) => {
        allLogs.push({
          requestId: req.requestId,
          department: req.department,
          postTitle: req.postTitle,
          action: log.action,
          performedBy: log.performedBy,
          role: log.role,
          details: log.details,
          timestamp: log.timestamp
        });
      });
    }
  });

  allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
            Institutional Master Audit Trail
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Chronological audit trail of approvals, queries, evaluations, and stage closures.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
          {allLogs.length} Events Captured
        </span>
      </div>

      <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
        {allLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No audit records captured yet.
          </div>
        ) : (
          allLogs.slice(0, 50).map((log, index) => (
            <div key={index} className="py-3 px-2 hover:bg-slate-50/70 transition text-sm flex items-start space-x-3">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                      {log.requestId}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">({log.department})</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-1 font-medium">
                  By: <strong className="text-slate-900">{log.performedBy}</strong> ({log.role}) • Post: {log.postTitle}
                </div>
                {log.details && (
                  <div className="text-slate-700 mt-1.5 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-medium leading-relaxed">
                    {log.details}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
