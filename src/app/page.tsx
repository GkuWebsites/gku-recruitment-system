'use client';

import React, { useState, useEffect } from 'react';
import { IUserProfile } from '@/lib/models/UserProfile';
import { AdminHeader } from '@/components/AdminHeader';
import { AdminUserDashboard } from '@/components/AdminUserDashboard';
import { UniversityLogo } from '@/components/UniversityLogo';
import { DeanDepartmentModule } from '@/components/profiles/DeanDepartmentModule';
import { VCRegistrarModule } from '@/components/profiles/VCRegistrarModule';
import { HRDepartmentModule } from '@/components/profiles/HRDepartmentModule';
import { DeanAcademicModule } from '@/components/profiles/DeanAcademicModule';
import { NewRequestModal } from '@/components/NewRequestModal';
import { RequestDetailModal } from '@/components/RequestDetailModal';
import { TimelineModal } from '@/components/TimelineModal';
import { JobDetailsModal } from '@/components/JobDetailsModal';
import { IHiringRequest, UserRole } from '@/lib/types';
import { UserProfileHeaderMenu } from '@/components/UserProfileHeaderMenu';
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<IUserProfile | null>(null);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Shared state for Department/Dean views
  const [requests, setRequests] = useState<IHiringRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<IHiringRequest | null>(null);
  const [selectedTimelineRequest, setSelectedTimelineRequest] = useState<IHiringRequest | null>(null);
  const [selectedJobDetailsRequest, setSelectedJobDetailsRequest] = useState<IHiringRequest | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Restore session from localStorage on initial render
  useEffect(() => {
    try {
      const stored = localStorage.getItem('gku_recruitment_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) {
          setCurrentUser(parsed);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch requisitions when logged in
  const fetchRequests = async () => {
    if (!currentUser) return;
    try {
      // Map designation to query role
      const isDeanOrHod =
        currentUser.designation === 'Dean' ||
        currentUser.designation === 'Director' ||
        currentUser.designation === 'HOD';
      const isVCRegistrar =
        currentUser.designation === 'VC / Registrar' ||
        currentUser.designation === 'Vice Chancellor' ||
        currentUser.designation === 'Registrar';

      const roleQuery = isDeanOrHod
        ? 'Department / Dean'
        : currentUser.designation === 'Dean Academic'
        ? 'Dean Academic'
        : isVCRegistrar
        ? 'VC / Registrar'
        : currentUser.designation === 'HR'
        ? 'HR Department'
        : 'Dean Academic';

      const res = await fetch(`/api/requests?role=${encodeURIComponent(roleQuery)}`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching requisitions:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchRequests();
    }
  }, [currentUser]);

  // Handle Login submission
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    const loginEmail = email;
    const loginPassword = password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword.trim() })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      const user = data.user as IUserProfile;
      setCurrentUser(user);
      localStorage.setItem('gku_recruitment_user', JSON.stringify(user));
    } catch (err: unknown) {
      setLoginError((err as Error).message || 'Invalid credentials');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('gku_recruitment_user');
    setEmail('');
    setPassword('');
  };

  // 1. IF NOT LOGGED IN: Render Clean Institutional Authentication Page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between text-slate-800">
        {/* Simple Institutional Header */}
        <header className="w-full bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
            <UniversityLogo />
            <div className="hidden sm:flex items-center space-x-2 text-xs font-bold text-slate-600">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Official Institutional Recruitment Portal</span>
            </div>
          </div>
        </header>

        {/* Center Login Box */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-2xl shadow-xs p-8 space-y-6">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Institutional Sign In
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Enter your official university credentials to access your designated desk.
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={(e) => handleLogin(e)} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@gku.ac.in"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-[#0f2d59] hover:bg-[#163f7a] text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-xs transition disabled:opacity-50"
              >
                <span>{isLoggingIn ? 'Verifying...' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500 font-medium">
          Guru Kashi University • Talwandi Sabo, Bathinda, Punjab • Recruitment & Academic Governance System
        </footer>
      </div>
    );
  }

  // 2. IF LOGGED IN AS ADMIN: Clean Admin User Management Dashboard
  if (currentUser.designation === 'Admin') {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col">
        <AdminHeader
          adminName={currentUser.name}
          adminEmail={currentUser.email}
          onLogout={handleLogout}
        />
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
          <AdminUserDashboard />
        </main>
      </div>
    );
  }

  // 3. IF LOGGED IN AS DEAN / HOD / DIRECTOR: Dedicated Faculty/Department Workspace
  if (
    currentUser.designation === 'Dean' ||
    currentUser.designation === 'Director' ||
    currentUser.designation === 'HOD'
  ) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col">
        {/* Clean Header for Dean/HOD with Profile Settings Dropdown */}
        <header className="w-full bg-white border-b border-slate-200 shadow-xs sticky top-0 z-40">
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between h-20">
            <UniversityLogo />
            <div className="flex items-center space-x-4">
              <UserProfileHeaderMenu
                name={currentUser.name}
                email={currentUser.email}
                designation={currentUser.designation}
                department={currentUser.department || 'Faculty'}
                onLogout={handleLogout}
                badgeText={currentUser.designation === 'HOD' ? 'HOD' : currentUser.name.charAt(0)}
                badgeBgColor="bg-blue-600"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
          <DeanDepartmentModule
            requests={requests}
            onSelectRequest={(r) => setSelectedJobDetailsRequest(r)}
            onOpenTimeline={(r) => setSelectedTimelineRequest(r)}
            onOpenNewModal={() => setIsNewModalOpen(true)}
            onRefresh={fetchRequests}
            currentUser={currentUser}
          />
        </main>

        {/* Modal 1: Raise Requisition Modal */}
        <NewRequestModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onSuccess={() => {
            setIsNewModalOpen(false);
            fetchRequests();
          }}
          defaultDepartment={currentUser.department}
          creatorName={currentUser.name}
          creatorEmail={currentUser.email}
          userRole={currentUser.role}
        />

        {/* Modal 2: Step-by-Step Timeline with Remarks */}
        {selectedTimelineRequest && (
          <TimelineModal
            isOpen={!!selectedTimelineRequest}
            request={selectedTimelineRequest}
            onClose={() => setSelectedTimelineRequest(null)}
            currentUser={currentUser}
          />
        )}

        {/* Modal 3: Pure Job Details with Edit Option (until reviewed by Dean Academic) */}
        {selectedJobDetailsRequest && (
          <JobDetailsModal
            isOpen={!!selectedJobDetailsRequest}
            request={selectedJobDetailsRequest}
            onClose={() => setSelectedJobDetailsRequest(null)}
            onSuccess={() => {
              setSelectedJobDetailsRequest(null);
              fetchRequests();
            }}
          />
        )}
      </div>
    );
  }

  // 4. IF LOGGED IN AS VC OR REGISTRAR
  if (
    currentUser.designation === 'VC / Registrar' ||
    currentUser.designation === 'Vice Chancellor' ||
    currentUser.designation === 'Registrar'
  ) {
    const isRegistrar = currentUser.designation === 'Registrar';
    const isVC = currentUser.designation === 'Vice Chancellor';
    const roleBadge = isVC ? 'VC' : isRegistrar ? 'REG' : 'VC';
    const deskSubtitle = isVC
      ? "Vice Chancellor's Secretariat"
      : isRegistrar
      ? "Registrar's Statutory Office"
      : 'Executive Sanction Desk';

    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col">
        <header className="w-full bg-white border-b border-slate-200 shadow-xs sticky top-0 z-40">
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between h-20">
            <UniversityLogo />
            <div className="flex items-center space-x-4">
              <UserProfileHeaderMenu
                name={currentUser.name}
                email={currentUser.email}
                designation={currentUser.designation}
                department={deskSubtitle}
                onLogout={handleLogout}
                badgeText={roleBadge}
                badgeBgColor="bg-purple-700"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
          <VCRegistrarModule
            requests={requests}
            onSelectRequest={(r) => setSelectedRequest(r)}
            onRefresh={fetchRequests}
            currentUser={currentUser}
          />
        </main>

        {selectedRequest && (
          <RequestDetailModal
            isOpen={!!selectedRequest}
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            currentRole="VC / Registrar"
            onActionComplete={() => {
              setSelectedRequest(null);
              fetchRequests();
            }}
          />
        )}
      </div>
    );
  }

  // 5. IF LOGGED IN AS HR
  if (currentUser.designation === 'HR') {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col">
        <header className="w-full bg-white border-b border-slate-200 shadow-xs sticky top-0 z-40">
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between h-20">
            <UniversityLogo />
            <div className="flex items-center space-x-4">
              <UserProfileHeaderMenu
                name={currentUser.name}
                email={currentUser.email}
                designation={currentUser.designation}
                department="Talent Acquisition Directorate"
                onLogout={handleLogout}
                badgeText="HR"
                badgeBgColor="bg-emerald-700"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
          <HRDepartmentModule
            requests={requests}
            onSelectRequest={(r) => setSelectedRequest(r)}
            onRefresh={fetchRequests}
          />
        </main>

        {selectedRequest && (
          <RequestDetailModal
            isOpen={!!selectedRequest}
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            currentRole="HR Department"
            onActionComplete={() => {
              setSelectedRequest(null);
              fetchRequests();
            }}
          />
        )}
      </div>
    );
  }

  // 6. DEFAULT FALLBACK: Dean Academic
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col">
      <header className="w-full bg-white border-b border-slate-200 shadow-xs sticky top-0 z-40">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between h-20">
          <UniversityLogo />
          <div className="flex items-center space-x-4">
            <UserProfileHeaderMenu
              name={currentUser.name}
              email={currentUser.email}
              designation={currentUser.designation}
              department={currentUser.department || 'Office of Dean Academic Affairs'}
              onLogout={handleLogout}
              badgeText="DA"
              badgeBgColor="bg-blue-700"
            />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
        <DeanAcademicModule
          requests={requests}
          onSelectRequest={(r) => setSelectedRequest(r)}
          onRefresh={fetchRequests}
          currentUser={currentUser}
        />
      </main>

      {selectedRequest && (
        <RequestDetailModal
          isOpen={!!selectedRequest}
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          currentRole="Dean Academic"
          onActionComplete={() => {
            setSelectedRequest(null);
            fetchRequests();
          }}
        />
      )}
    </div>
  );
}
