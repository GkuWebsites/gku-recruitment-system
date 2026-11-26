'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/lib/types';
import { USER_ROLES } from '@/lib/constants';
import { UniversityLogo } from './UniversityLogo';
export { UniversityLogo };
import { Plus, RotateCcw } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenNewModal: () => void;
  onSeedData: () => void;
  isSeeding: boolean;
}

export function Header({
  currentRole,
  onRoleChange,
  onOpenNewModal,
  onSeedData,
  isSeeding
}: HeaderProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Overview' },
    { href: '/dean', label: 'Deans & Directors' },
    { href: '/dean-academic', label: 'Dean Academic' },
    { href: '/vc-registrar', label: 'VC / Registrar' },
    { href: '/hr', label: 'HR Recruitment' },
    { href: '/expert', label: 'Expert Panel' },
    { href: '/admin', label: 'Admin (Profiles)' }
  ];

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

          {/* Profile-Wise Portal Navigation Links (gkucrm style) */}
          <nav className="hidden xl:flex items-center space-x-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-xs font-bold">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-lg transition ${
                    isActive
                      ? 'bg-white text-[#0f2d59] shadow-xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action Controls */}
          <div className="flex items-center space-x-3">
            {/* Quick Reset Data */}
            <button
              onClick={onSeedData}
              disabled={isSeeding}
              title="Reset 24 baseline records"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200/80 px-3 py-2 rounded-lg transition disabled:opacity-50 inline-flex items-center"
            >
              <RotateCcw className={`w-3.5 h-3.5 mr-1.5 text-slate-500 ${isSeeding ? 'animate-spin' : ''}`} />
              {isSeeding ? 'Resetting...' : 'Reset'}
            </button>

            {/* Role Switcher */}
            <div className="flex items-center bg-slate-100/80 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
              <span className="text-slate-500 font-semibold mr-1.5 text-xs">Profile:</span>
              <select
                value={currentRole}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
              >
                {USER_ROLES.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* New Requisition Button */}
            <button
              onClick={onOpenNewModal}
              className="inline-flex items-center text-xs sm:text-sm font-bold text-white bg-[#0f2d59] hover:bg-[#163f7a] px-3.5 sm:px-4 py-2 rounded-lg shadow-sm transition shrink-0"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>New Requisition</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="xl:hidden flex items-center space-x-2 overflow-x-auto pb-3 text-xs font-bold">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                  isActive
                    ? 'bg-[#0f2d59] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
