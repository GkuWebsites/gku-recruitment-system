'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IUserProfile } from '@/lib/models/UserProfile';
import { AdminHeader } from '@/components/AdminHeader';
import { AdminUserDashboard } from '@/components/AdminUserDashboard';
import { UniversityLogo } from '@/components/UniversityLogo';
import { DeanDepartmentModule } from '@/components/profiles/DeanDepartmentModule';
import { VCRegistrarModule } from '@/components/profiles/VCRegistrarModule';
import { HRDepartmentModule } from '@/components/profiles/HRDepartmentModule';
import { DeanAcademicModule } from '@/components/profiles/DeanAcademicModule';
import { ExpertInterviewWorkspace } from '@/components/profiles/ExpertInterviewWorkspace';
import { NewRequestModal } from '@/components/NewRequestModal';
import { RequestDetailModal } from '@/components/RequestDetailModal';
import { TimelineModal } from '@/components/TimelineModal';
import { JobDetailsModal } from '@/components/JobDetailsModal';
import { IHiringRequest, UserRole } from '@/lib/types';
import { UserProfileHeaderMenu } from '@/components/UserProfileHeaderMenu';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Eye,
  EyeOff,
  Building2,
  GraduationCap,
  Users,
  KeyRound,
  Sparkles
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
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
  const [showPassword, setShowPassword] = useState(false);

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
      const isDeanOrDirector =
        currentUser.designation === 'Dean' ||
        currentUser.designation === 'Director';
      const isVCRegistrar =
        currentUser.designation === 'VC / Registrar' ||
        currentUser.designation === 'Vice Chancellor' ||
        currentUser.designation === 'Registrar';

      const roleQuery = isDeanOrDirector
        ? 'Department / Dean'
        : currentUser.designation === 'Dean Academic'
          ? 'Dean Academic'
          : isVCRegistrar
            ? 'VC / Registrar'
            : currentUser.designation === 'HR'
              ? 'HR Department'
              : currentUser.designation === 'Expert'
                ? 'Expert Panel'
                : 'Dean Academic';

      const queryParams = new URLSearchParams({
        role: roleQuery,
        userEmail: currentUser.email || '',
        userRole: currentUser.designation || currentUser.role || '',
        userDepartment: currentUser.department || ''
      });

      const res = await fetch(`/api/requests?${queryParams.toString()}`);
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

  // 1. IF NOT LOGGED IN: Render Simple, Clean Institutional Authentication Card
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800">
        {/* Clean Institutional Top Bar */}
        <header className="w-full bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <UniversityLogo />
          </div>
        </header>

        {/* Center Simple, Refined Login Card */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-10 space-y-6">
            <div className="space-y-1">
              <h1 className="text-center text-2xl font-bold text-slate-900 tracking-tight">
                Institutional Sign In
              </h1>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                  OFFICIAL EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. admin@gku.ac.in"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 font-medium text-xs focus:bg-white focus:ring-2 focus:ring-[#0b1f3a] focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-900 font-medium text-xs focus:bg-white focus:ring-2 focus:ring-[#0b1f3a] focus:border-transparent outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full mt-2 bg-[#0b1f3a] hover:bg-[#163f7a] text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-md hover:shadow-lg active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoggingIn ? 'Signing In...' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 text-center border-t border-slate-100">
              <p className="text-[11px] text-slate-400 font-medium">
                Authorized Personnel Only • Guru Kashi University
              </p>
            </div>
          </div>
        </main>

        {/* Clean Footer */}
        <footer className="w-full py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
          Guru Kashi University • Talwandi Sabo, Bathinda, Punjab • Official Recruitment Portal
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

  // 3. IF LOGGED IN AS DEAN / DIRECTOR: Dedicated Faculty/Department Workspace
  if (
    currentUser.designation === 'Dean' ||
    currentUser.designation === 'Director'
  ) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col">
        {/* Clean Header for Dean/Director with Profile Settings Dropdown */}
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
                badgeText={currentUser.name.charAt(0)}
                badgeBgColor="bg-blue-600"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
          <DeanDepartmentModule
            requests={requests}
            onSelectRequest={(r) => router.push(`/requisitions/${r.requestId}?role=dean`)}
            onOpenTimeline={(r) => setSelectedTimelineRequest(r)}
            onOpenNewModal={() => router.push(`/requisitions/new?role=dean&department=${encodeURIComponent(currentUser.department || '')}`)}
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

        {/* Modal 3: Pure Job Details with Edit & Delete Option */}
        {selectedJobDetailsRequest && (
          <JobDetailsModal
            isOpen={!!selectedJobDetailsRequest}
            request={selectedJobDetailsRequest}
            currentUser={currentUser}
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
            onSelectRequest={(r) => router.push(`/requisitions/${r.requestId}?role=vc`)}
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
            onSelectRequest={(r) => router.push(`/requisitions/${r.requestId}?role=hr`)}
            onRefresh={fetchRequests}
            onOpenNewModal={() => router.push('/requisitions/new?role=hr')}
          />
        </main>

        <NewRequestModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onSuccess={() => {
            setIsNewModalOpen(false);
            fetchRequests();
          }}
          creatorName={currentUser.name}
          creatorEmail={currentUser.email}
          userRole="HR Department"
        />

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

  // 6. IF LOGGED IN AS EXPERT: Dedicated Subject Expert Panel Workspace
  if (currentUser.designation === 'Expert') {
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
                department={currentUser.department || 'Expert Panel'}
                onLogout={handleLogout}
                badgeText="EX"
                badgeBgColor="bg-amber-600"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
          <ExpertInterviewWorkspace
            requests={requests}
            currentUser={currentUser}
            onRefresh={fetchRequests}
          />
        </main>
      </div>
    );
  }

  // 7. DEFAULT FALLBACK: Dean Academic
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
          onSelectRequest={(r) => router.push(`/requisitions/${r.requestId}?role=dean-academic`)}
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
