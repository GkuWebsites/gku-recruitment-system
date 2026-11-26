'use client';

import React, { useState, useEffect } from 'react';
import { IUserProfile, UserDesignation } from '@/lib/models/UserProfile';
import { UNIVERSITY_DEPARTMENTS } from '@/lib/constants';
import {
  UserPlus,
  Plus,
  Search,
  Users,
  Building2,
  Trash2,
  Edit,
  X,
  Mail,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

export function AdminUserDashboard() {
  const [users, setUsers] = useState<IUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [designationFilter, setDesignationFilter] = useState<string>('All');

  // Dynamic Departments State
  const [departments, setDepartments] = useState<string[]>(UNIVERSITY_DEPARTMENTS);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [isDeptSubmitting, setIsDeptSubmitting] = useState(false);
  const [deptModalError, setDeptModalError] = useState('');

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('password123');
  const [createDesignation, setCreateDesignation] = useState<UserDesignation>('Dean');
  const [createDepartment, setCreateDepartment] = useState<string>(UNIVERSITY_DEPARTMENTS[0]);
  const [createPhone, setCreatePhone] = useState('');
  const [createCanUseOfficialEmail, setCreateCanUseOfficialEmail] = useState(false);

  // Edit User Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string>('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editDesignation, setEditDesignation] = useState<UserDesignation>('Dean');
  const [editDepartment, setEditDepartment] = useState<string>(UNIVERSITY_DEPARTMENTS[0]);
  const [editPhone, setEditPhone] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>('Active');
  const [editCanUseOfficialEmail, setEditCanUseOfficialEmail] = useState(false);

  // Notification and Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Database Clear & Production Launch State
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ totalRequests: number; status: string } | null>(null);

  const fetchDbStatus = async () => {
    try {
      const res = await fetch('/api/seed');
      const data = await res.json();
      if (data.success) {
        setDbStatus({ totalRequests: data.totalRequests, status: data.status });
      }
    } catch (e) {
      console.error(e);
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
    fetchDepartments();
    fetchDbStatus();
  }, []);

  // Handle Create Department
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setIsDeptSubmitting(true);
    setDeptModalError('');

    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDeptName.trim(),
          code: newDeptCode.trim(),
          createdBy: 'System Administrator'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create department');
      }

      const created = newDeptName.trim();
      setSuccessMsg(`✓ Department "${created}" added successfully!`);
      setNewDeptName('');
      setNewDeptCode('');
      setIsDeptModalOpen(false);
      await fetchDepartments();
      setCreateDepartment(created);
      setEditDepartment(created);
    } catch (err: unknown) {
      setDeptModalError((err as Error).message);
    } finally {
      setIsDeptSubmitting(false);
    }
  };

  // Helper to determine assigned department
  const resolveAssignedDepartment = (des: UserDesignation, dept: string) => {
    if (des === 'Dean' || des === 'HOD' || des === 'Director') {
      return dept || departments[0] || 'Faculty of Engineering & Technology';
    }
    if (des === 'Vice Chancellor') return "Vice Chancellor's Secretariat";
    if (des === 'Registrar') return "Office of the Registrar";
    if (des === 'VC / Registrar') return "Vice Chancellor & Registrar Secretariat";
    if (des === 'Dean Academic') return "Office of Dean Academic Affairs";
    if (des === 'HR') return "Human Resources Directorate";
    if (des === 'Admin') return "Administration & IT Cell";
    return dept;
  };

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const deptToSave = resolveAssignedDepartment(createDesignation, createDepartment);

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          email: createEmail.trim(),
          password: createPassword.trim() || 'password123',
          designation: createDesignation,
          department: deptToSave,
          phone: createPhone.trim(),
          canUseOfficialEmail: createCanUseOfficialEmail
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create user');
      }

      setSuccessMsg(`✓ Successfully created official profile for ${createName} (${createDesignation}).`);
      setIsCreateModalOpen(false);
      setCreateName('');
      setCreateEmail('');
      setCreatePhone('');
      setCreatePassword('password123');
      setCreateCanUseOfficialEmail(false);
      fetchUsers();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit User
  const handleOpenEdit = (user: IUserProfile) => {
    setErrorMsg('');
    setSuccessMsg('');
    setEditingUserId((user as any)._id || '');
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPassword('');
    setEditDesignation(user.designation);
    setEditDepartment((user.department as any) || departments[0] || UNIVERSITY_DEPARTMENTS[0]);
    setEditPhone(user.phone || '');
    setEditStatus(user.status || 'Active');
    setEditCanUseOfficialEmail(Boolean(user.canUseOfficialEmail));
    setIsEditModalOpen(true);
  };

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const deptToSave = resolveAssignedDepartment(editDesignation, editDepartment);

      const updates: Record<string, any> = {
        name: editName.trim(),
        email: editEmail.trim(),
        designation: editDesignation,
        department: deptToSave,
        phone: editPhone.trim(),
        status: editDesignation === 'Admin' ? 'Active' : editStatus,
        canUseOfficialEmail: editCanUseOfficialEmail
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

  // 1-Click Toggle for Mail Permission
  const handleToggleMailPermission = async (user: IUserProfile) => {
    const uid = (user as any)._id || user.email;
    const nextVal = !user.canUseOfficialEmail;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uid,
          updates: { canUseOfficialEmail: nextVal }
        })
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => ((u as any)._id === uid || u.email === user.email ? { ...u, canUseOfficialEmail: nextVal } : u))
        );
      }
    } catch (err) {
      console.error(err);
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
  const deansAndHodCount = users.filter((u) => u.designation === 'Dean' || u.designation === 'HOD').length;
  const deanAcademicCount = users.filter((u) => u.designation === 'Dean Academic').length;
  const directorsCount = users.filter((u) => u.designation === 'Director').length;
  const vcCount = users.filter((u) => u.designation === 'Vice Chancellor' || (u.designation === 'VC / Registrar' && u.email.includes('vc'))).length;
  const registrarCount = users.filter((u) => u.designation === 'Registrar' || (u.designation === 'VC / Registrar' && !u.email.includes('vc'))).length;
  const hrCount = users.filter((u) => u.designation === 'HR').length;

  const filtered = users.filter((u) => {
    if (designationFilter !== 'All') {
      if (designationFilter === 'Vice Chancellor') {
        const isVC = u.designation === 'Vice Chancellor' || (u.designation === 'VC / Registrar' && u.email.includes('vc'));
        if (!isVC) return false;
      } else if (designationFilter === 'Registrar') {
        const isReg = u.designation === 'Registrar' || (u.designation === 'VC / Registrar' && !u.email.includes('vc'));
        if (!isReg) return false;
      } else if (u.designation !== designationFilter) {
        return false;
      }
    }
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
            Create, edit, and manage official university user profiles, leadership roles, and faculties.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              fetchDbStatus();
              setIsClearModalOpen(true);
            }}
            className="inline-flex items-center space-x-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Clear Test Requisitions</span>
          </button>

          <button
            onClick={() => {
              setIsDeptModalOpen(true);
              setDeptModalError('');
            }}
            className="inline-flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>+ Add Department</span>
          </button>

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
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Total Users</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Active accounts</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-blue-700 uppercase">Deans & HODs</div>
          <div className="text-2xl font-extrabold text-blue-900 mt-1">{deansAndHodCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Academic Units</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-cyan-700 uppercase">Dean Academic</div>
          <div className="text-2xl font-extrabold text-cyan-900 mt-1">{deanAcademicCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Scrutiny Desk</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-indigo-700 uppercase">Directors</div>
          <div className="text-2xl font-extrabold text-indigo-900 mt-1">{directorsCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Institutes/Centers</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-purple-700 uppercase">Vice Chancellor</div>
          <div className="text-2xl font-extrabold text-purple-900 mt-1">{vcCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Executive Sanction</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-violet-700 uppercase">Registrar</div>
          <div className="text-2xl font-extrabold text-violet-900 mt-1">{registrarCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Statutory Officer</div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase">HR Officers</div>
          <div className="text-2xl font-extrabold text-emerald-900 mt-1">{hrCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Talent Directorate</div>
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
              <option value="HOD">HOD (Head of Department)</option>
              <option value="Dean Academic">Dean Academic</option>
              <option value="Director">Director</option>
              <option value="Vice Chancellor">Vice Chancellor (VC)</option>
              <option value="Registrar">Registrar</option>
              <option value="VC / Registrar">VC / Registrar (Combined)</option>
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
                <th className="py-3.5 px-6 whitespace-nowrap">User Name</th>
                <th className="py-3.5 px-6 whitespace-nowrap">Official Email</th>
                <th className="py-3.5 px-6 whitespace-nowrap">Designation</th>
                <th className="py-3.5 px-6 whitespace-nowrap">Assigned Faculty / Dept</th>
                <th className="py-3.5 px-6 whitespace-nowrap">Phone Number</th>
                <th className="py-3.5 px-6 text-center whitespace-nowrap">Status</th>
                <th className="py-3.5 px-6 text-center whitespace-nowrap">Personal Mailbox</th>
                <th className="py-3.5 px-6 text-right whitespace-nowrap">Actions</th>
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
                      <td className="py-4 px-6 font-bold text-slate-900 text-sm whitespace-nowrap">
                        {u.name}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-600 whitespace-nowrap">
                        {u.email}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${u.designation === 'Dean'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : u.designation === 'HOD'
                                ? 'bg-sky-50 text-sky-800 border-sky-200'
                                : u.designation === 'Dean Academic'
                                  ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                                  : u.designation === 'Director'
                                    ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                    : u.designation === 'Vice Chancellor'
                                      ? 'bg-purple-50 text-purple-900 border-purple-200'
                                      : u.designation === 'Registrar'
                                        ? 'bg-violet-50 text-violet-900 border-violet-200'
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
                      <td className="py-4 px-6 font-medium text-slate-700 whitespace-nowrap">
                        {u.department || 'Central University'}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-mono whitespace-nowrap">
                        {u.phone || '—'}
                      </td>
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${u.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                        >
                          {u.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleMailPermission(u)}
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${u.canUseOfficialEmail
                              ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                            }`}
                          title="Click to toggle personal official mailbox dispatch permission"
                        >
                          <Mail className="w-3 h-3" />
                          <span>{u.canUseOfficialEmail ? '✓ Permitted' : 'Disabled'}</span>
                        </button>
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
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${u.status === 'Active'
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
                  Select designation, institutional email, and assigned academic faculty.
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
                    placeholder="e.g. Dr. Balraj Singh"
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
                    <option value="HOD">Head of Department (HOD)</option>
                    <option value="Dean Academic">Dean Academic</option>
                    <option value="Director">Director</option>
                    <option value="Vice Chancellor">Vice Chancellor (VC)</option>
                    <option value="Registrar">Registrar</option>
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

              {(createDesignation === 'Dean' || createDesignation === 'HOD' || createDesignation === 'Director') && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">
                      Assigned Faculty / Department:
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsDeptModalOpen(true)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                    >
                      + Add New Dept
                    </button>
                  </div>
                  <select
                    value={createDepartment}
                    onChange={(e) => setCreateDepartment(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {departments.map((dept) => (
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

              <div className="flex items-start space-x-2.5 p-3 bg-purple-50/70 border border-purple-200 rounded-xl">
                <input
                  type="checkbox"
                  id="createCanUseOfficialEmail"
                  checked={createCanUseOfficialEmail}
                  onChange={(e) => setCreateCanUseOfficialEmail(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer mt-0.5"
                />
                <label htmlFor="createCanUseOfficialEmail" className="text-xs font-bold text-purple-950 cursor-pointer">
                  Allow Personal Official Mailbox Dispatch (`canUseOfficialEmail`)
                </label>
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
                    <option value="HOD">Head of Department (HOD)</option>
                    <option value="Dean Academic">Dean Academic</option>
                    <option value="Director">Director</option>
                    <option value="Vice Chancellor">Vice Chancellor (VC)</option>
                    <option value="Registrar">Registrar</option>
                    <option value="VC / Registrar">VC / Registrar (Combined)</option>
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

              {(editDesignation === 'Dean' || editDesignation === 'HOD' || editDesignation === 'Director') && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">
                      Assigned Faculty / Department:
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsDeptModalOpen(true)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                    >
                      + Add New Dept
                    </button>
                  </div>
                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {departments.map((dept) => (
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

              <div className="flex items-start space-x-2.5 p-3 bg-purple-50/70 border border-purple-200 rounded-xl">
                <input
                  type="checkbox"
                  id="editCanUseOfficialEmail"
                  checked={editCanUseOfficialEmail}
                  onChange={(e) => setEditCanUseOfficialEmail(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer mt-0.5"
                />
                <label htmlFor="editCanUseOfficialEmail" className="text-xs font-bold text-purple-950 cursor-pointer">
                  Allow Personal Official Mailbox Dispatch (`canUseOfficialEmail`)
                  <span className="block text-[11px] text-purple-800/80 font-normal mt-0.5">
                    Permits this user (e.g. Nancy Sharma / Corporate Head) to connect their official Google Workspace mailbox for confidential offers.
                  </span>
                </label>
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

      {/* CREATE DEPARTMENT MODAL */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Academic Faculty / Department</h3>
                <p className="text-xs text-slate-500">
                  Register a new university department for user assignment and requisitions.
                </p>
              </div>
              <button
                onClick={() => setIsDeptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {deptModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                {deptModalError}
              </div>
            )}

            <form onSubmit={handleCreateDepartment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Department / Faculty Name: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Faculty of Artificial Intelligence & Data Science"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Department Code (optional):
                </label>
                <input
                  type="text"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  placeholder="e.g. FAIDS"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeptSubmitting || !newDeptName.trim()}
                  className="px-5 py-2 bg-[#0f2d59] hover:bg-[#163f7a] text-white rounded-xl font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {isDeptSubmitting ? 'Adding...' : 'Add Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear Test Data Modal for Live Launch */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Prepare for Live Launch
                  </h3>
                  <p className="text-xs text-slate-400">Clear test requisitions &amp; candidates</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between font-semibold">
                  <span>Current Requisitions in DB:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {dbStatus?.totalRequests ?? 'Checking...'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Status:</span>
                  <span className={`font-semibold ${dbStatus?.totalRequests === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {dbStatus?.totalRequests === 0 ? 'Clean / Production Ready' : 'Test Mode (Dummy Data Present)'}
                  </span>
                </div>
              </div>

              <p className="leading-relaxed">
                This will wipe all <strong>test recruitment requisitions</strong>, candidate applications, interview logs, and workflow history so real recruitment work can start fresh.
              </p>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 space-y-1">
                <p className="font-bold">What is kept safe:</p>
                <p className="text-[11px] text-blue-800">
                  All user logins (Admins, VC, Registrar, Deans, HR) and custom departments will <strong>not</strong> be deleted.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                disabled={isClearingData}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearingData}
                onClick={async () => {
                  setIsClearingData(true);
                  try {
                    const res = await fetch('/api/seed', { method: 'DELETE' });
                    const data = await res.json();
                    if (data.success) {
                      setSuccessMsg(`✓ Portal Cleaned: Successfully removed ${data.deletedCount} test requisitions. Portal is clean for real hiring!`);
                      setIsClearModalOpen(false);
                      fetchDbStatus();
                    } else {
                      setErrorMsg(data.error || 'Failed to clear database');
                    }
                  } catch (err: any) {
                    setErrorMsg(err.message || 'Error clearing database');
                  } finally {
                    setIsClearingData(false);
                  }
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition disabled:opacity-50 cursor-pointer shadow-xs text-xs"
              >
                {isClearingData ? 'Clearing...' : 'Clear All Test Data Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
