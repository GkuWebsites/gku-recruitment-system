'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { UniversityLogo } from '@/components/UniversityLogo';
import { ExpertInterviewWorkspace } from '@/components/profiles/ExpertInterviewWorkspace';
import { IHiringRequest } from '@/lib/types';

export default function ExpertPanelPage() {
  const [requests, setRequests] = useState<IHiringRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/requests');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRequests(data.data);
      }
    } catch (err) {
      console.error('Error fetching requests for expert:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="min-h-screen bg-[#D3D3D3] text-slate-800 flex flex-col">
      {/* Top Header */}
      <header className="w-full bg-white border-b border-slate-200 shadow-xs sticky top-0 z-40">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between h-20">
          <UniversityLogo />

          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Portal Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-xs">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading assigned interview panels...
          </div>
        ) : (
          <ExpertInterviewWorkspace
            requests={requests}
            currentUser={{
              name: 'Prof. (Dr.) Harpreet Singh',
              email: 'expert@gku.ac.in',
              designation: 'Expert',
              department: 'Subject Expert Panel'
            }}
            onRefresh={fetchRequests}
          />
        )}
      </main>
    </div>
  );
}
