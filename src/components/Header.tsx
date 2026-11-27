'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/lib/types';
import { UniversityLogo } from './UniversityLogo';
export { UniversityLogo };
import { UserProfileHeaderMenu } from './UserProfileHeaderMenu';
import { LogIn } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenNewModal: () => void;
  onSeedData: () => void;
  isSeeding: boolean;
}

interface StoredUser {
  name: string;
  email: string;
  designation: string;
  department?: string;
}

export function Header({}: HeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gku_recruitment_user');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem('gku_recruitment_user');
    } catch {
      // ignore
    }
    router.push('/');
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 shadow-xs sticky top-0 z-40">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-20 gap-4">
          <Link href="/" className="hover:opacity-95 transition">
            <UniversityLogo />
          </Link>

          <div className="flex items-center space-x-3">
            {user ? (
              <UserProfileHeaderMenu
                name={user.name}
                email={user.email}
                designation={user.designation}
                department={user.department || ''}
                onLogout={handleLogout}
              />
            ) : (
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#0f2d59] hover:bg-[#163f7a] px-4 py-2 rounded-xl shadow-xs transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
