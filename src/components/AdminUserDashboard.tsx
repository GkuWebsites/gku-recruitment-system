'use client';

import React, { useState, useEffect } from 'react';
import { IUserProfile, UserDesignation } from '@/lib/models/UserProfile';
import { UNIVERSITY_DEPARTMENTS } from '@/lib/constants';
import {
  UserPlus,
  Search,
  Users,
  Building2,
  Landmark,
  Briefcase,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Trash2,
  Edit,
  X
} from 'lucide-react';

export function AdminUserDashboard() {
  const [users, setUsers] = useState<IUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [designationFilter, setDesignationFilter] = useState<string>('All');

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('password123');
  const [createDesignation, setCreateDesignation] = useState<UserDesignation>('Dean');
  const [createDepartment, setCreateDepartment] = useState(UNIVERSITY_DEPARTMENTS[0]);
  const [createPhone, setCreatePhone] = useState('');

  // Edit User Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string>('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editDesignation, setEditDesignation] = useState<UserDesignation>('Dean');
  const [editDepartment, setEditDepartment] = useState(UNIVERSITY_DEPARTMENTS[0]);
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>('Active');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          email: createEmail.trim(),
          password: createPassword.trim() || 'password123',
          designation: createDesignation,
          department: createDesignation === 'Dean' || createDesignation === 'Director' ? createDepartment : '',
          phone: createPhone.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create user');
      }

      setSuccessMsg(`✓ Successfully created user profile for ${createName} (${createDesignation}).`);
      setIsCreateModalOpen(false);
      setCreateName('');
      setCreateEmail('');
      setCreatePassword('password123');
      setCreatePhone('');
      fetchUsers();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (user: IUserProfile) => {
    setErrorMsg('');
    setSuccessMsg('');
    const uid = (user as any)._id || user.email;
    setEditingUserId(uid);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPassword('');
    setEditDesignation(user.designation);
    setEditDepartment((user.department as any) || UNIVERSITY_DEPARTMENTS[0]);
    setEditPhone(user.phone || '');
    setEditStatus(user.status || 'Active');
    setIsEditModalOpen(true);
  };

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const updates: Record<string, any> = {
        name: editName.trim(),
        email: editEmail.trim(),
        designation: editDesignation,
        department: editDesignation === 'Dean' || editDesignation === 'Director' ? editDepartment : '',
        phone: editPhone.trim(),
        status: editDesignation === 'Admin' ? 'Active' : editStatus
      };

      if (editPassword.trim()) {
        updates.password = editPassword.trim();
      }

      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUserId,
          updates
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update user profile');
      }

      setSuccessMsg(`✓ Successfully updated profile for ${editName}.`);
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active/Inactive for Non-Admin
  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          updates: { status: newStatus }
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user ${userName}?`)) return;
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Metrics
  const totalCount = users.length;
  const deansCount = users.filter((u) => u.designation === 'Dean').length;
  const deanAcademicCount = users.filter((u) => u.designation === 'Dean Academic').length;
  const directorsCount = users.filter((u) => u.designation === 'Director').length;
  const vcCount = users.filter((u) => u.designation === 'VC / Registrar').length;
  const hrCount = users.filter((u) => u.designation === 'HR').length;

  const filtered = users.filter((u) => {
    if (designationFilter !== 'All' && u.designation !== designationFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-7">
      {/* 1. Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Administrator User Provisioning Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Create, edit, and manage official university user profiles by designation.
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreateModalOpen(true);
            setErrorMsg('');
          }}
          className="inline-flex items-center space-x-2 bg-[#0f2d59] hover:bg-[#163f7a] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Create New User</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* 2. Designation KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3.5">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Total Users</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Active in system</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-blue-700 uppercase">Deans</div>
          <div className="text-2xl font-extrabold text-blue-900 mt-1">{deansCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Faculty Deans</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-cyan-700 uppercase">Dean Academic</div>
          <div className="text-2xl font-extrabold text-cyan-900 mt-1">{deanAcademicCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Academic Scrutiny</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-indigo-700 uppercase">Directors</div>
          <div className="text-2xl font-extrabold text-indigo-900 mt-1">{directorsCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">School Directors</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-purple-700 uppercase">VC / Registrar</div>
          <div className="text-2xl font-extrabold text-purple-900 mt-1">{vcCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Executive Sanction</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase">HR Officers</div>
          <div className="text-2xl font-extrabold text-emerald-900 mt-1">{hrCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Talent Acquisition</div>
        </div>
      </div>

      {/* 3. Main Users Registry Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search user by name, email, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium placeholder:text-slate-400"
              />
            </div>

            {/* Filter by Designation */}
            <select
              value={designationFilter}
              onChange={(e) => setDesignationFilter(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">All Designations</option>
              <option value="Dean">Dean</option>
              <option value="Dean Academic">Dean Academic</option>
              <option value="Director">Director</option>
              <option value="VC / Registrar">VC / Registrar</option>
              <option value="HR">HR</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div className="text-xs font-bold text-slate-600">
            Showing <span className="text-blue-600">{filtered.length}</span> of {totalCount} users
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">User Name</th>
                <th className="py-3.5 px-6">Official Email</th>
                <th className="py-3.5 px-6">Designation</th>
                <th className="py-3.5 px-6">Assigned Faculty / Dept</th>
                <th className="py-3.5 px-6">Phone Number</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No users found matching your search. Click &ldquo;+ Create New User&rdquo; to add.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const uid = (u as any)._id || u.email;
                  const isAdminUser = u.designation === 'Admin';

                  return (
                    <tr key={uid} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                        {u.name}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-600">
                        {u.email}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            u.designation === 'Dean'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : u.designation === 'Dean Academic'
                              ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                              : u.designation === 'Director'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : u.designation === 'VC / Registrar'
                              ? 'bg-purple-50 text-purple-900 border-purple-200'
                              : u.designation === 'HR'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-800 border-slate-300'
                          }`}
                        >
                          {u.designation}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-700">
                        {u.department || 'Central University'}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-mono">
                        {u.phone || '—'}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>

                      {/* Actions Column: Edit on all users; Deactivate/Delete ONLY on non-admin */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition cursor-pointer"
                            title="Edit user profile"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          {!isAdminUser && (
                            <>
                              <button
                                onClick={() => handleToggleStatus(uid, u.status)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                                  u.status === 'Active'
                                    ? 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                                }`}
                              >
                                {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                              </button>

                              <button
                                onClick={() => handleDeleteUser(uid, u.name)}
                                className="px-2 py-1 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg font-semibold transition cursor-pointer"
                                title="Delete user"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create Official University User</h3>
                <p className="text-xs text-slate-500">
                  Select designation: Dean, Director, VC / Registrar, or HR.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name:</label>
                  <input
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Dr. Harpreet Singh"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Institutional Email:
                  </label>
                  <input
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="e.g. dean.engg@gku.ac.in"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation:</label>
                  <select
                    value={createDesignation}
                    onChange={(e) => setCreateDesignation(e.target.value as UserDesignation)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
                  >
                    <option value="Dean">Dean</option>
                    <option value="Dean Academic">Dean Academic</option>
                    <option value="Director">Director</option>
                    <option value="VC / Registrar">VC / Registrar</option>
                    <option value="HR">HR</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Password:</label>
                  <input
                    type="text"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="password123"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>
              </div>

              {(createDesignation === 'Dean' || createDesignation === 'Director') && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Faculty / Department:
                  </label>
                  <select
                    value={createDepartment}
                    onChange={(e) => setCreateDepartment(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    {UNIVERSITY_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number:</label>
                <input
                  type="text"
                  value={createPhone}
                  onChange={(e) => setCreatePhone(e.target.value)}
                  placeholder="+91 98721 00000"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#0f2d59] hover:bg-[#163f7a] text-white rounded-xl font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit User Profile</h3>
                <p className="text-xs text-slate-500">
                  Update personal details, designation, or access credentials.
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name:</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Institutional Email:
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation:</label>
                  <select
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value as UserDesignation)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
                  >
                    <option value="Dean">Dean</option>
                    <option value="Dean Academic">Dean Academic</option>
                    <option value="Director">Director</option>
                    <option value="VC / Registrar">VC / Registrar</option>
                    <option value="HR">HR</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Reset Password (optional):
                  </label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono placeholder:text-slate-400"
                  />
                </div>
              </div>

              {(editDesignation === 'Dean' || editDesignation === 'Director') && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Faculty / Department:
                  </label>
                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    {UNIVERSITY_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number:</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91 98721 00000"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Profile Status:</label>
                  {editDesignation === 'Admin' ? (
                    <input
                      type="text"
                      disabled
                      value="Active (Admin status is locked)"
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 font-medium"
                    />
                  ) : (
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as 'Active' | 'Inactive')}
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-semibold"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
