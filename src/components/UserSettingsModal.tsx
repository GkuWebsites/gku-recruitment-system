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
  EyeOff
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
  const [activeTab, setActiveTab] = useState<'departments' | 'password'>('departments');

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
      setDeptSuccessMsg('');
      setDeptErrorMsg('');
      setPassSuccessMsg('');
      setPassErrorMsg('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

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
                {activeTab === 'departments' ? 'Academic Faculties & Departments' : 'Security & Access Credentials'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeTab === 'departments'
                  ? 'Register new faculties or departments for appointments and recruitment.'
                  : 'Update your institutional sign-in password.'}
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
        </div>
      </div>
    </div>
  );
}
