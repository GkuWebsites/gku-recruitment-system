'use client';

import React from 'react';
import { UniversityLogo } from './UniversityLogo';
import { LogOut, Shield } from 'lucide-react';

interface AdminHeaderProps {
  adminName?: string;
  onLogout: () => void;
}

export function AdminHeader({ adminName = 'System Administrator', onLogout }: AdminHeaderProps) {
  return (
    <header className="w-full bg-white border-b border-slate-200 shadow-xs sticky top-0 z-40">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Guru Kashi University Official Logo */}
          <div className="flex items-center">
            <UniversityLogo />
          </div>

          {/* Admin User Info & Logout Button */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2.5 bg-slate-50 border border-slate-200/90 px-3.5 py-1.5 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-[#0f2d59] text-white flex items-center justify-center font-bold text-xs">
                <Shield className="w-4 h-4" />
              </div>
              <div className="text-left text-xs">
                <div className="font-bold text-slate-900 leading-tight">{adminName}</div>
                <div className="text-[10px] font-semibold text-slate-500">Super Admin Desk</div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition"
              title="Sign out of Admin Dashboard"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
