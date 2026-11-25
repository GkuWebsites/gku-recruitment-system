'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Lock,
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
  ExternalLink,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { UNIVERSITY_DEPARTMENTS } from '@/lib/constants';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
  currentUserName?: string;
  currentUserDesignation?: string;
  onDepartmentAdded?: () => void;
}

export function UserSettingsModal({
  isOpen,
  onClose,
  currentUserEmail = '',
  currentUserName = '',
  currentUserDesignation = '',
  onDepartmentAdded
}: UserSettingsModalProps) {
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
  const [mailboxSenderName, setMailboxSenderName] = useState(currentUserName);
  const [mailboxPass, setMailboxPass] = useState('');
  const [showMailboxPass, setShowMailboxPass] = useState(false);
  const [mailboxTestedAt, setMailboxTestedAt] = useState('');
  const [testRecipient, setTestRecipient] = useState(currentUserEmail);
  const [isMailboxSubmitting, setIsMailboxSubmitting] = useState(false);
  const [mailboxSuccessMsg, setMailboxSuccessMsg] = useState('');
  const [mailboxErrorMsg, setMailboxErrorMsg] = useState('');
  const [loadingMailbox, setLoadingMailbox] = useState(false);

  const fetchMailSettings = async () => {
    if (!currentUserEmail) return;
    try {
      setLoadingMailbox(true);
      const res = await fetch(`/api/user/mail-settings?email=${encodeURIComponent(currentUserEmail)}`);
      const data = await res.json();
      if (data.success) {
        setCanUseOfficialEmail(Boolean(data.canUseOfficialEmail) || currentUserDesignation === 'Admin');
        setIsMailboxConfigured(Boolean(data.mailSettings?.isConfigured));
        setMailboxSenderName(data.mailSettings?.senderName || currentUserName);
        setMailboxTestedAt(data.mailSettings?.lastTestedAt || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMailbox(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setDepartments(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
      fetchMailSettings();
      setDeptSuccessMsg('');
      setDeptErrorMsg('');
      setPassSuccessMsg('');
      setPassErrorMsg('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMailboxSuccessMsg('');
      setMailboxErrorMsg('');
      setMailboxPass('');
      setTestRecipient(currentUserEmail);
    }
  }, [isOpen, currentUserEmail]);

  if (!isOpen) return null;

  // Handle Add Department
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
          createdBy: `${currentUserName} (${currentUserDesignation || 'University Staff'})`
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add department');
      }

      setDeptSuccessMsg(`✓ Department "${newDeptName.trim()}" successfully registered!`);
      setNewDeptName('');
      setNewDeptCode('');
      await fetchDepartments();
      if (onDepartmentAdded) onDepartmentAdded();
    } catch (err: unknown) {
      setDeptErrorMsg((err as Error).message);
    } finally {
      setIsDeptSubmitting(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
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
          email: currentUserEmail,
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to change password');
      }

      setPassSuccessMsg('✓ Your password has been updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPassErrorMsg((err as Error).message);
    } finally {
      setIsPassSubmitting(false);
    }
  };

  // Handle Save / Test Official Mailbox
  const handleSaveMailbox = async (e?: React.FormEvent, testOnly: boolean = false) => {
    if (e) e.preventDefault();
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
          email: currentUserEmail,
          smtpPass: mailboxPass.trim(),
          senderName: mailboxSenderName.trim() || currentUserName,
          testRecipient: testRecipient.trim() || currentUserEmail,
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
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        {/* Left Sidebar Menu */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-5 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-base tracking-tight">
                <Shield className="w-5 h-5 text-blue-600" />
                <span>Portal Settings</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                University administration &amp; account controls
              </p>
            </div>

            {/* Menu Links */}
            <nav className="space-y-1.5 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('departments')}
                className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl font-bold transition text-left cursor-pointer ${
                  activeTab === 'departments'
                    ? 'bg-[#0f2d59] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Add Department</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('password')}
                className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl font-bold transition text-left cursor-pointer ${
                  activeTab === 'password'
                    ? 'bg-[#0f2d59] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Change Password</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('mailbox')}
                className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl font-bold transition text-left cursor-pointer ${
                  activeTab === 'mailbox'
                    ? 'bg-[#0f2d59] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <Mail className="w-4 h-4" />
                <div className="flex-1">
                  <span>Official Mailbox</span>
                  {isMailboxConfigured && (
                    <span className="block text-[10px] text-emerald-400 font-semibold">✓ Active</span>
                  )}
                </div>
              </button>
            </nav>
          </div>

          {/* User Info Capsule */}
          <div className="pt-4 border-t border-slate-200 text-xs">
            <div className="font-bold text-slate-900 truncate">{currentUserName || 'Official User'}</div>
            <div className="text-[10px] text-slate-500 font-mono truncate">{currentUserEmail}</div>
            <div className="text-[10px] font-semibold text-blue-700 mt-0.5">{currentUserDesignation}</div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Header Bar */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {activeTab === 'departments'
                  ? 'Academic Faculties & Departments'
                  : activeTab === 'password'
                  ? 'Security & Access Credentials'
                  : 'Official Outgoing Mailbox (Google Workspace)'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeTab === 'departments'
                  ? 'Register new faculties or departments for appointments and recruitment.'
                  : activeTab === 'password'
                  ? 'Update your institutional sign-in password.'
                  : 'Configure and test your personal official email for dispatching appointment letters.'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab 1: Departments */}
          {activeTab === 'departments' && (
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)] text-xs">
              {deptSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{deptSuccessMsg}</span>
                </div>
              )}

              {deptErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{deptErrorMsg}</span>
                </div>
              )}

              {/* Add New Department Form */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4.5 space-y-3.5">
                <div className="flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Register New Department / Faculty
                  </span>
                </div>

                <form onSubmit={handleAddDepartment} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Department / Faculty Name: <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newDeptName}
                        onChange={(e) => setNewDeptName(e.target.value)}
                        placeholder="e.g. Faculty of Artificial Intelligence & Robotics"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Code (optional):
                      </label>
                      <input
                        type="text"
                        value={newDeptCode}
                        onChange={(e) => setNewDeptCode(e.target.value)}
                        placeholder="e.g. FAIR"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isDeptSubmitting || !newDeptName.trim()}
                      className="px-4 py-2 bg-[#0f2d59] hover:bg-[#163f7a] text-white rounded-xl font-bold transition disabled:opacity-50 cursor-pointer shadow-xs inline-flex items-center space-x-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isDeptSubmitting ? 'Registering...' : 'Add Department'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Departments Registry */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-bold text-slate-900 text-xs">
                    Existing University Departments ({departments.length})
                  </div>

                  <div className="relative max-w-xs w-full">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search departments..."
                      value={deptSearch}
                      onChange={(e) => setDeptSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
                  {filteredDepts.map((dept, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-2xs hover:border-slate-300 transition"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {dept.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-800 text-xs truncate">{dept}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">Active</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Change Password */}
          {activeTab === 'password' && (
            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-80px)] text-xs">
              {passSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{passSuccessMsg}</span>
                </div>
              )}

              {passErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{passErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Institutional Email:
                  </label>
                  <input
                    type="email"
                    disabled
                    value={currentUserEmail}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-500 cursor-not-allowed text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Current Password: <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full p-2.5 pr-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    New Password: <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full p-2.5 pr-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Confirm New Password: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isPassSubmitting}
                    className="px-5 py-2.5 bg-[#0f2d59] hover:bg-[#163f7a] text-white rounded-xl font-bold transition disabled:opacity-50 cursor-pointer shadow-xs inline-flex items-center space-x-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isPassSubmitting ? 'Updating...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 3: Official Outgoing Mailbox (Google Workspace) */}
          {activeTab === 'mailbox' && (
            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-80px)] text-xs">
              {/* Mailbox Status Header */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isMailboxConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">{currentUserEmail}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isMailboxConfigured
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {isMailboxConfigured ? '✓ Connected & Active' : 'Not Configured'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {mailboxTestedAt
                        ? `Last verified on ${new Date(mailboxTestedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`
                        : 'Google Workspace SMTP: smtp.gmail.com (Port 465 SSL)'}
                    </p>
                  </div>
                </div>

                {isMailboxConfigured && (
                  <button
                    type="button"
                    onClick={() => handleSaveMailbox(undefined, true)}
                    disabled={isMailboxSubmitting}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-bold transition cursor-pointer text-xs flex items-center space-x-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isMailboxSubmitting ? 'animate-spin' : ''}`} />
                    <span>Test Connection</span>
                  </button>
                )}
              </div>

              {/* Security / Permission Check */}
              {!canUseOfficialEmail ? (
                <div className="p-5 bg-amber-50/70 border border-amber-200/90 rounded-2xl text-amber-900 space-y-3">
                  <div className="flex items-start space-x-2.5">
                    <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs">Personal Mailbox Dispatch Restricted</h4>
                      <p className="text-[11px] text-amber-800/90 mt-1 leading-relaxed">
                        To maintain strict university compliance and corporate privacy, sending appointment letters directly from personal institutional mailboxes is restricted to authorized Corporate Heads and Executive Officers.
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-[11px] text-slate-600 flex items-center justify-between">
                    <span>Permission Required: <strong className="font-mono text-slate-800">canUseOfficialEmail</strong></span>
                    <span className="font-semibold text-blue-700">Contact Portal Admin</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Step-by-Step Google Workspace Guide */}
                  <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 font-bold text-blue-950 text-xs">
                        <HelpCircle className="w-4 h-4 text-blue-600" />
                        <span>How to Generate Your 16-Letter Google App Password (Takes 1 min)</span>
                      </div>
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-[11px] text-blue-700 hover:text-blue-900 font-bold underline"
                      >
                        <span>Open Google App Passwords</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <ol className="space-y-2 text-[11px] text-slate-600 list-decimal list-inside pl-1">
                      <li>
                        Sign in to your GKU Google account at{' '}
                        <a
                          href="https://myaccount.google.com/security"
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 font-medium underline"
                        >
                          myaccount.google.com/security
                        </a>
                      </li>
                      <li>Ensure <strong>2-Step Verification</strong> is turned <strong>ON</strong>.</li>
                      <li>
                        Search for or click <strong>&ldquo;App passwords&rdquo;</strong> (under 2-Step Verification).
                      </li>
                      <li>
                        Type App Name as <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-blue-900 font-semibold">GKU Recruitment</code> and click <strong>Create</strong>.
                      </li>
                      <li>Copy the yellow-highlighted 16-character code (e.g. <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-slate-700">abcd efgh ijkl mnop</code>) and paste it below.</li>
                    </ol>
                  </div>

                  {mailboxSuccessMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{mailboxSuccessMsg}</span>
                    </div>
                  )}

                  {mailboxErrorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{mailboxErrorMsg}</span>
                    </div>
                  )}

                  {/* Mailbox Credentials Form */}
                  <form onSubmit={(e) => handleSaveMailbox(e, false)} className="space-y-4 max-w-lg">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Your Official University Email (Sender Account):
                      </label>
                      <input
                        type="email"
                        disabled
                        value={currentUserEmail}
                        className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-600 cursor-not-allowed text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Sender Display Name on Offer Emails: <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={mailboxSenderName}
                        onChange={(e) => setMailboxSenderName(e.target.value)}
                        placeholder="e.g. Nancy Sharma (Head - Corporate HR)"
                        className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">This name will appear in candidate inboxes as the email sender.</p>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Google 16-Character App Password: <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showMailboxPass ? 'text' : 'password'}
                          value={mailboxPass}
                          onChange={(e) => setMailboxPass(e.target.value)}
                          placeholder={isMailboxConfigured ? '•••• •••• •••• •••• (Saved - enter to change)' : 'Paste 16-character code'}
                          className="w-full p-2.5 pr-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs tracking-wider"
                        />
                        <button
                          type="button"
                          onClick={() => setShowMailboxPass(!showMailboxPass)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showMailboxPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Never enter your main Google password. Use the unique 16-letter App Password.
                      </p>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Verification Test Recipient Email:
                      </label>
                      <input
                        type="email"
                        value={testRecipient}
                        onChange={(e) => setTestRecipient(e.target.value)}
                        placeholder="Your email to receive test message"
                        className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono"
                      />
                    </div>

                    <div className="pt-2 flex flex-wrap gap-2.5">
                      <button
                        type="submit"
                        disabled={isMailboxSubmitting}
                        className="px-5 py-2.5 bg-[#0f2d59] hover:bg-[#163f7a] text-white rounded-xl font-bold transition disabled:opacity-50 cursor-pointer shadow-xs inline-flex items-center space-x-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{isMailboxSubmitting ? 'Authenticating...' : 'Save & Verify Mailbox'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveMailbox(undefined, true)}
                        disabled={isMailboxSubmitting || (!mailboxPass.trim() && !isMailboxConfigured)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition disabled:opacity-50 cursor-pointer text-xs inline-flex items-center space-x-1.5"
                      >
                        <Send className="w-3.5 h-3.5 text-blue-600" />
                        <span>Send Test Email</span>
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
