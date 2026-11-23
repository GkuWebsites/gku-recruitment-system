'use client';

import React from 'react';
import { AdminHeader } from '@/components/AdminHeader';
import { AdminUserDashboard } from '@/components/AdminUserDashboard';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('gku_recruitment_user');
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800">
      <AdminHeader adminName="System Administrator" onLogout={handleLogout} />
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
        <AdminUserDashboard />
      </main>
    </div>
  );
}
