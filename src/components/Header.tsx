'use client';

import React from 'react';
import Link from 'next/link';
import { UserRole } from '@/lib/types';
import { UniversityLogo } from './UniversityLogo';
export { UniversityLogo };
import { Plus, Home } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenNewModal: () => void;
  onSeedData: () => void;
  isSeeding: boolean;
}

export function Header({
  currentRole,
}: HeaderProps) {
  const showNewRequisition =
    currentRole === 'HR Department' || currentRole === 'Department / Dean';

  return (
    <header className="w-full bg-white border-b border-slate-200 shadow-xs sticky top-0 z-40">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Guru Kashi University Logo */}
          <div className="flex items-center">
            <Link href="/" className="hover:opacity-95 transition">
              <UniversityLogo />
            </Link>
          </div>

          {/* Right Controls: Current Portal Desk + Portal Home + New Requisition */}
          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
              {currentRole}
            </span>

            <Link
              href="/"
              className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg transition"
            >
              <Home className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              <span>Portal</span>
            </Link>

            {showNewRequisition && (
              <Link
                href={`/requisitions/new?role=${currentRole === 'HR Department' ? 'hr' : 'dean'}`}
                className="inline-flex items-center text-xs sm:text-sm font-bold text-white bg-[#0f2d59] hover:bg-[#163f7a] px-3.5 sm:px-4 py-2 rounded-lg shadow-sm transition shrink-0"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>New Requisition</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
