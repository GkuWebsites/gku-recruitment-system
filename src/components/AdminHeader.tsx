'use client';

import React from 'react';
import { UniversityLogo } from './UniversityLogo';
import { UserProfileHeaderMenu } from './UserProfileHeaderMenu';

interface AdminHeaderProps {
  adminName?: string;
  adminEmail?: string;
  onLogout: () => void;
}

export function AdminHeader({
  adminName = 'System Administrator',
  adminEmail = 'admin@gku.ac.in',
  onLogout
}: AdminHeaderProps) {
  return (
    <header className="w-full bg-white border-b border-slate-200 shadow-xs sticky top-0 z-40">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Guru Kashi University Official Logo */}
          <div className="flex items-center">
            <UniversityLogo />
          </div>

          {/* Admin User Info & Dropdown Menu */}
          <div className="flex items-center space-x-4">
            <UserProfileHeaderMenu
              name={adminName}
              email={adminEmail}
              designation="Administrator"
              department="Administration & IT Cell"
              onLogout={onLogout}
              badgeText="AD"
              badgeBgColor="bg-[#0f2d59]"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
