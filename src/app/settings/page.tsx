'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UniversityLogo } from '@/components/Header';
import { UNIVERSITY_DEPARTMENTS } from '@/lib/constants';
import {
  ArrowLeft,
  Building2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Search,
  KeyRound,
  Shield,
  Eye,
  EyeOff,
  Mail,
  Send,
  RefreshCw,
  LogIn
} from 'lucide-react';

interface StoredUser {
  name: string;
  email: string;
  designation: string;
  department?: string;
}

function SettingsContent() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loadedUser, setLoadedUser] = useState(false);

  const [activeTab, setActiveTab] = useState<'departments' | 'password' | 'mailbox'>('departments');

  // Departments State
  const [departments, setDepartments] = useState<string[]>(UNIVERSITY_DEPARTMENTS);
  const [deptSearch, setDeptSearch] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [isDeptSubmitting, setIsDeptSubmitting] = useState(false);
  const [deptSuccessMsg, setDeptSuccessMsg] = useState('');
  const [deptErrorMsg, setDeptErrorMsg] = useState('');

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isPassSubmitting, setIsPassSubmitting] = useState(false);
  const [passSuccessMsg, setPassSuccessMsg] = useState('');
  const [passErrorMsg, setPassErrorMsg] = useState('');

  // Official Mailbox State
  const [canUseOfficialEmail, setCanUseOfficialEmail] = useState(false);
  const [isMailboxConfigured, setIsMailboxConfigured] = useState(false);
  const [mailboxSenderName, setMailboxSenderName] = useState('');
  const [mailboxPass, setMailboxPass] = useState('');
  const [showMailboxPass, setShowMailboxPass] = useState(false);
  const [mailboxTestedAt, setMailboxTestedAt] = useState('');
  const [testRecipient, setTestRecipient] = useState('');
  const [isMailboxSubmitting, setIsMailboxSubmitting] = useState(false);
  const [mailboxSuccessMsg, setMailboxSuccessMsg] = useState('');
  const [mailboxErrorMsg, setMailboxErrorMsg] = useState('');
  const [loadingMailbox, setLoadingMailbox] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gku_recruitment_user');
      if (saved) {
        const parsed: StoredUser = JSON.parse(saved);
        setUser(parsed);
        setMailboxSenderName(parsed.name || '');
        setTestRecipient(parsed.email || '');
      }
    } catch {
      // ignore storage errors
    } finally {
      setLoadedUser(true);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setDepartments(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchMailSettings = useCallback(async (email: string, name: string, designation: string) => {
    if (!email) return;
    try {
      setLoadingMailbox(true);
      const res = await fetch(`/api/user/mail-settings?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success) {
        setCanUseOfficialEmail(Boolean(data.canUseOfficialEmail) || designation === 'Admin');
        setIsMailboxConfigured(Boolean(data.mailSettings?.isConfigured));
        setMailboxSenderName(data.mailSettings?.senderName || name);
        setMailboxTestedAt(data.mailSettings?.lastTestedAt || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMailbox(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
    if (user?.email) {
      fetchMailSettings(user.email, user.name, user.designation);
    }
  }, [user, fetchDepartments, fetchMailSettings]);

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setIsDeptSubmitting(true);
    setDeptErrorMsg('');
    setDeptSuccessMsg('');

    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDeptName.trim(),
          code: newDeptCode.trim(),
          createdBy: user ? `${user.name} (${user.designation || 'University Staff'})` : 'University Staff'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add department');
      }
      setDeptSuccessMsg(`✓ Department "${newDeptName.trim()}" successfully registered.`);
      setNewDeptName('');
      setNewDeptCode('');
      await fetchDepartments();
    } catch (err: unknown) {
      setDeptErrorMsg((err as Error).message);
    } finally {
      setIsDeptSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    setPassErrorMsg('');
    setPassSuccessMsg('');

    if (!currentPassword) {
      setPassErrorMsg('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPassErrorMsg('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassErrorMsg('New password and confirm password do not match.');
      return;
    }

    setIsPassSubmitting(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          currentPassword,
          newPassword
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to change password');
      }
      setPassSuccessMsg('✓ Your password has been updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPassErrorMsg((err as Error).message);
    } finally {
      setIsPassSubmitting(false);
    }
  };

  const handleSaveMailbox = async (e?: React.FormEvent, testOnly: boolean = false) => {
    if (e) e.preventDefault();
    if (!user?.email) return;
    setMailboxErrorMsg('');
    setMailboxSuccessMsg('');

    if (!mailboxPass.trim() && !isMailboxConfigured) {
      setMailboxErrorMsg('Please enter your 16-character Google App Password.');
      return;
    }

    setIsMailboxSubmitting(true);
    try {
      const res = await fetch('/api/user/mail-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          smtpPass: mailboxPass.trim(),
          senderName: mailboxSenderName.trim() || user.name,
          testRecipient: testRecipient.trim() || user.email,
          testOnly
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to authenticate with Google Workspace SMTP.');
      }
      setMailboxSuccessMsg(`✓ ${data.message}`);
      setIsMailboxConfigured(true);
      setMailboxTestedAt(new Date().toISOString());
      setMailboxPass('');
    } catch (err: unknown) {
      setMailboxErrorMsg((err as Error).message);
    } finally {
      setIsMailboxSubmitting(false);
    }
  };

  const filteredDepts = departments.filter((d) =>
    d.toLowerCase().includes(deptSearch.toLowerCase().trim())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <UniversityLogo />
          </div>

          {user ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-800">{user.name}</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-semibold text-slate-600">
                {user.designation}
              </span>
            </div>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#0f2d59] hover:bg-[#163f7a] px-4 py-2 rounded-xl transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-black text-[#0f2d59] tracking-tight">Portal Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage university departments, account password, and official email configuration
          </p>
        </div>

        {!loadedUser ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-400">
            Loading settings...
          </div>
        ) : !user ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
            <Shield className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-bold text-slate-800">Please sign in to access account settings</div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0f2d59] text-white rounded-xl text-xs font-bold"
            >
              Go to Sign In
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col md:flex-row min-h-[540px]">
            {/* Left Sidebar */}
            <aside className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-5 flex flex-col justify-between shrink-0">
              <div className="space-y-6">
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-0.5">
                  <div className="font-bold text-slate-900 text-xs truncate">{user.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">{user.email}</div>
                  <div className="text-[11px] text-indigo-700 font-semibold pt-0.5">{user.designation}</div>
                </div>

                <nav className="space-y-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('departments')}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl font-bold transition cursor-pointer ${
                      activeTab === 'departments'
                        ? 'bg-[#0f2d59] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                    }`}
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span>Departments</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('password')}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl font-bold transition cursor-pointer ${
                      activeTab === 'password'
                        ? 'bg-[#0f2d59] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                    }`}
                  >
                    <KeyRound className="w-4 h-4 shrink-0" />
                    <span>Change Password</span>
                  </button>

                  {canUseOfficialEmail && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('mailbox')}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl font-bold transition cursor-pointer ${
                        activeTab === 'mailbox'
                          ? 'bg-[#0f2d59] text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                      }`}
                    >
                      <Mail className="w-4 h-4 shrink-0" />
                      <span>Official Mailbox</span>
                    </button>
                  )}
                </nav>
              </div>
            </aside>

            {/* Right Panel Content */}
            <div className="flex-1 p-6 sm:p-8 space-y-6">
              {activeTab === 'departments' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">University Academic Departments</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Add new faculties or academic departments available across requisitions
                    </p>
                  </div>

                  {deptSuccessMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{deptSuccessMsg}</span>
                    </div>
                  )}
                  {deptErrorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{deptErrorMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleAddDepartment} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="text-xs font-bold text-slate-800">Register New Department</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={newDeptName}
                        onChange={(e) => setNewDeptName(e.target.value)}
                        placeholder="e.g. Faculty of Law"
                        className="sm:col-span-2 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                      <input
                        type="text"
                        value={newDeptCode}
                        onChange={(e) => setNewDeptCode(e.target.value)}
                        placeholder="Code (e.g. FOL)"
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isDeptSubmitting || !newDeptName.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0f2d59] hover:bg-[#163f7a] text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isDeptSubmitting ? 'Saving...' : 'Add Department'}</span>
                    </button>
                  </form>

                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={deptSearch}
                        onChange={(e) => setDeptSearch(e.target.value)}
                        placeholder="Filter departments..."
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                      {filteredDepts.map((dept) => (
                        <div
                          key={dept}
                          className="px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                        >
                          {dept}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'password' && (
                <div className="space-y-6 max-w-md">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Change Account Password</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Update your institutional portal login password
                    </p>
                  </div>

                  {passSuccessMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{passSuccessMsg}</span>
                    </div>
                  )}
                  {passErrorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{passErrorMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Current Password *</label>
                      <div className="relative">
                        <input
                          type={showCurrentPass ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full p-2.5 pr-9 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">New Password *</label>
                      <div className="relative">
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full p-2.5 pr-9 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Confirm New Password *</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isPassSubmitting}
                      className="px-5 py-2.5 bg-[#0f2d59] hover:bg-[#163f7a] text-white rounded-xl font-bold transition disabled:opacity-50 cursor-pointer"
                    >
                      {isPassSubmitting ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'mailbox' && canUseOfficialEmail && (
                <div className="space-y-6 max-w-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Official Mailbox (Google Workspace SMTP)</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Configure your @gku.ac.in App Password for sending official recruitment emails
                      </p>
                    </div>
                    {loadingMailbox && <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />}
                  </div>

                  {mailboxSuccessMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{mailboxSuccessMsg}</span>
                    </div>
                  )}
                  {mailboxErrorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{mailboxErrorMsg}</span>
                    </div>
                  )}

                  <form onSubmit={(e) => handleSaveMailbox(e, false)} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Display Sender Name</label>
                      <input
                        type="text"
                        value={mailboxSenderName}
                        onChange={(e) => setMailboxSenderName(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">
                        Google App Password {isMailboxConfigured ? '(Configured — leave blank to keep existing)' : '*'}
                      </label>
                      <div className="relative">
                        <input
                          type={showMailboxPass ? 'text' : 'password'}
                          value={mailboxPass}
                          onChange={(e) => setMailboxPass(e.target.value)}
                          placeholder="xxxx xxxx xxxx xxxx"
                          className="w-full p-2.5 pr-9 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowMailboxPass(!showMailboxPass)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {showMailboxPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">Test Email Recipient</label>
                      <input
                        type="email"
                        value={testRecipient}
                        onChange={(e) => setTestRecipient(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    {mailboxTestedAt && (
                      <div className="text-[11px] text-emerald-700 font-medium">
                        Last verified: {new Date(mailboxTestedAt).toLocaleString('en-IN')}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={isMailboxSubmitting}
                        className="px-5 py-2.5 bg-[#0f2d59] hover:bg-[#163f7a] text-white rounded-xl font-bold transition disabled:opacity-50 cursor-pointer"
                      >
                        {isMailboxSubmitting ? 'Saving...' : 'Save Mailbox Settings'}
                      </button>
                      <button
                        type="button"
                        disabled={isMailboxSubmitting}
                        onClick={() => handleSaveMailbox(undefined, true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition disabled:opacity-50 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Test Email</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-400">
          Loading Settings...
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
