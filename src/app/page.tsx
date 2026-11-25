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

  // 1. IF NOT LOGGED IN: Render Interactive Executive Institutional Authentication Page
  if (!currentUser) {
    const quickDesks = [
      { label: 'Directorate of HR', email: 'hr@gku.ac.in', icon: Users, roleTitle: 'Talent Acquisition' },
      { label: 'Vice-Chancellor Desk', email: 'vc@gku.ac.in', icon: ShieldCheck, roleTitle: 'Executive Sanction' },
      { label: 'Registrar Office', email: 'registrar@gku.ac.in', icon: Building2, roleTitle: 'Statutory Authority' },
      { label: 'Dean Academic Affairs', email: 'deanacademic@gku.ac.in', icon: GraduationCap, roleTitle: 'Workload Scrutiny' },
      { label: 'Faculty / Dept Dean', email: 'dean@gku.ac.in', icon: Building2, roleTitle: 'Job Requisitions' },
      { label: 'Portal Administrator', email: 'admin@gku.ac.in', icon: KeyRound, roleTitle: 'System & Security' }
    ];

    return (
      <div className="min-h-screen bg-linear-to-br from-[#07162c] via-[#0d274c] to-[#0a1e38] flex flex-col justify-between text-slate-800 relative selection:bg-amber-400 selection:text-slate-950 overflow-hidden">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Clean Institutional Top Bar */}
        <header className="w-full bg-slate-950/40 backdrop-blur-md border-b border-white/10 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UniversityLogo />
            </div>
            <div className="flex items-center space-x-3 text-xs font-semibold text-slate-300">
              <span className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Official Gateway Active</span>
              </span>
              <div className="hidden md:flex items-center space-x-1.5 text-slate-300 text-xs pl-3 border-l border-white/15">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>256-bit Encrypted SSO</span>
              </div>
            </div>
          </div>
        </header>

        {/* Center Interactive Authentication Suite */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-8 z-10">
          <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl border border-white/20 overflow-hidden grid grid-cols-1 md:grid-cols-12">
            
            {/* Left Column: Interactive University Brand & Quick Desk Switcher */}
            <div className="md:col-span-5 bg-linear-to-br from-[#07162c] via-[#0f2d59] to-[#163f7a] text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

              <div className="space-y-4 relative z-10">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold text-amber-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>NAAC A++ University</span>
                </div>

                <div>
                  <h2 className="text-xl font-serif font-black tracking-wide text-white uppercase">
                    GURU KASHI UNIVERSITY
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
                    Faculty Recruitment &amp; Academic Governance Portal
                  </p>
                </div>

                {/* Quick Desk Selector - Interactive */}
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                      Quick Desk Access:
                    </span>
                    <span className="text-[10px] text-amber-300/80">Click to switch</span>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {quickDesks.map((desk) => {
                      const isSelected = email.toLowerCase() === desk.email.toLowerCase();
                      const Icon = desk.icon;
                      return (
                        <button
                          key={desk.email}
                          type="button"
                          onClick={() => {
                            setEmail(desk.email);
                            setPassword('admin123');
                            setLoginError('');
                          }}
                          className={`w-full text-left p-2 rounded-xl border transition flex items-center justify-between text-xs cursor-pointer ${
                            isSelected
                              ? 'bg-amber-400/20 border-amber-400 text-white shadow-xs ring-1 ring-amber-400/30'
                              : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-300' : 'text-slate-400'}`} />
                            <span className="font-semibold truncate">{desk.label}</span>
                          </div>
                          <span className="text-[10px] text-slate-300 font-mono shrink-0 pl-1">
                            {desk.roleTitle}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-white/10 text-[11px] text-slate-300 space-y-1 relative z-10 mt-4">
                <p className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Statutory UGC 2(f) Approved Institution</span>
                </p>
                <p className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Established by Punjab Act No. 37 of 2011</span>
                </p>
              </div>
            </div>

            {/* Right Column: Clean, Modern Login Form */}
            <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Official Sign-In
                  </span>
                  <span className="text-[11px] text-slate-400">Talwandi Sabo, Bathinda</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Institutional Sign In
                </h1>
                <p className="text-xs text-slate-500">
                  Enter your official university credentials to access your designated desk.
                </p>
              </div>

              {loginError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center space-x-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={(e) => handleLogin(e)} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                    Official Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. hr@gku.ac.in"
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-[#0f2d59] focus:border-transparent focus:outline-none transition text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                    Account Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter account password"
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-[#0f2d59] focus:border-transparent focus:outline-none transition text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Institutional @gku.ac.in credentials
                  </span>
                  <span className="text-[11px] text-blue-700 font-semibold cursor-default">
                    SSL Secured
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-[#0b1f3a] hover:bg-[#163f7a] text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-md hover:shadow-lg active:scale-98 transition disabled:opacity-50 cursor-pointer"
                >
                  <span>{isLoggingIn ? 'Verifying Credentials...' : 'Sign In to Official Desk'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Authorized University Personnel</span>
                <span className="font-mono">Guru Kashi University</span>
              </div>
            </div>
          </div>
        </main>

        {/* Clean Footer */}
        <footer className="w-full py-3.5 text-center text-xs text-slate-400/80 font-medium z-20 bg-slate-950/20 border-t border-white/5">
          Guru Kashi University • Talwandi Sabo, Bathinda, Punjab • Official Recruitment &amp; Academic Governance Portal
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
            onOpenNewModal={() => setIsNewModalOpen(true)}
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
