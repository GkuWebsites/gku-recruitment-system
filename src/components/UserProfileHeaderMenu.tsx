'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, ChevronDown, Building2, KeyRound } from 'lucide-react';
import { UserSettingsModal } from './UserSettingsModal';

interface UserProfileHeaderMenuProps {
  name: string;
  email: string;
  designation: string;
  department?: string;
  onLogout: () => void;
  badgeText?: string;
  badgeBgColor?: string;
  badgeTextColor?: string;
}

export function UserProfileHeaderMenu({
  name,
  email,
  designation,
  department = '',
  onLogout,
  badgeText,
  badgeBgColor = 'bg-blue-600',
  badgeTextColor = 'text-white'
}: UserProfileHeaderMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayInitials = badgeText || (name ? name.charAt(0).toUpperCase() : 'U');

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Clickable Profile Capsule */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 p-1.5 pr-3 rounded-2xl shadow-2xs transition cursor-pointer"
        title="View Profile & Settings"
      >
        <div
          className={`w-8 h-8 rounded-xl ${badgeBgColor} ${badgeTextColor} flex items-center justify-center font-bold text-xs shadow-2xs shrink-0`}
        >
          {displayInitials}
        </div>
        <div className="text-left hidden sm:block">
          <div className="font-bold text-slate-900 text-xs leading-tight truncate max-w-[150px]">
            {name}
          </div>
          <div className="text-[10px] font-semibold text-slate-500 truncate max-w-[150px]">
            {designation}
          </div>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-slate-700' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
          {/* User Profile Summary */}
          <div className="p-4 bg-slate-50/70">
            <div className="font-bold text-slate-900 text-sm truncate">{name}</div>
            <div className="text-xs text-slate-500 font-mono truncate">{email}</div>
            <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-blue-900 border border-slate-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="truncate">{designation} {department ? `• ${department}` : ''}</span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2 space-y-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsSettingsOpen(true);
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition font-medium cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Settings className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-900 text-xs">Settings</div>
                <div className="text-[10px] text-slate-500">Add department, change password</div>
              </div>
            </button>
          </div>

          {/* Sign Out Button */}
          <div className="p-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-50 transition font-medium cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                <LogOut className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-bold text-rose-900 text-xs">Sign Out</div>
                <div className="text-[10px] text-rose-500">End your active portal session</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <UserSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUserEmail={email}
        currentUserName={name}
        currentUserDesignation={designation}
      />
    </div>
  );
}
