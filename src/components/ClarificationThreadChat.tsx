'use client';

import React, { useState } from 'react';
import { IHiringRequest, IClarificationThread, IClarificationRecipient } from '@/lib/types';
import { canUserViewThread } from '@/lib/clarificationPermissions';
import {
  MessageSquare,
  Send,
  Plus,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lock,
  CornerDownRight,
  Shield,
  GraduationCap,
  Building2
} from 'lucide-react';

interface ClarificationThreadChatProps {
  request: IHiringRequest;
  currentUser?: {
    name: string;
    email: string;
    designation: string;
    department?: string;
  } | null;
  onRefresh: () => void;
  allowCreateThread?: boolean;
}

export function ClarificationThreadChat({
  request,
  currentUser,
  onRefresh,
  allowCreateThread = false
}: ClarificationThreadChatProps) {
  const allThreads = request.clarificationThreads || [];

  // Filter threads visible to this user
  const visibleThreads = allThreads.filter((t) =>
    canUserViewThread(t, currentUser, request)
  );

  const [selectedThreadId, setSelectedThreadId] = useState<string>(
    visibleThreads[0]?.id || ''
  );
  const [replyText, setReplyText] = useState<{ [threadId: string]: string }>({});
  const [isReplying, setIsReplying] = useState(false);
  const [replyError, setReplyError] = useState('');

  // New Thread Form State
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newPrimaryRole, setNewPrimaryRole] = useState<'Department / Dean' | 'Dean Academic' | 'Both'>(
    currentUser?.designation === 'VC / Registrar' ? 'Dean Academic' : 'Department / Dean'
  );
  const [newInitialMessage, setNewInitialMessage] = useState('');
  const [isSubmittingNewThread, setIsSubmittingNewThread] = useState(false);
  const [newThreadError, setNewThreadError] = useState('');

  const activeThread =
    visibleThreads.find((t) => t.id === selectedThreadId) || visibleThreads[0];

  const handleSendReply = async (threadId: string) => {
    const text = replyText[threadId]?.trim();
    if (!text) return;

    setIsReplying(true);
    setReplyError('');

    try {
      const res = await fetch(`/api/requests/${request.requestId}/clarifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply_message',
          threadId,
          senderName: currentUser?.name || 'Authorized Officer',
          senderRole: currentUser?.designation || 'Officer',
          senderEmail: currentUser?.email || 'officer@gku.ac.in',
          messageText: text
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send reply');
      }

      setReplyText((prev) => ({ ...prev, [threadId]: '' }));
      onRefresh();
    } catch (err: unknown) {
      setReplyError((err as Error).message || 'Failed to send reply');
    } finally {
      setIsReplying(false);
    }
  };

  const handleCreateThreadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newInitialMessage.trim()) {
      setNewThreadError('Please enter a subject and clarification message.');
      return;
    }

    setIsSubmittingNewThread(true);
    setNewThreadError('');

    try {
      const res = await fetch(`/api/requests/${request.requestId}/clarifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_thread',
          subject: newSubject.trim(),
          creatorName: currentUser?.name || 'University Authority',
          creatorRole: currentUser?.designation || 'Officer',
          creatorEmail: currentUser?.email || 'officer@gku.ac.in',
          primaryRecipientRole: newPrimaryRole,
          primaryRecipientEmail:
            newPrimaryRole === 'Department / Dean' || newPrimaryRole === 'Both'
              ? request.creator.email
              : undefined,
          primaryRecipientName:
            newPrimaryRole === 'Department / Dean' || newPrimaryRole === 'Both'
              ? request.creator.name
              : undefined,
          ccRecipients: [],
          messageText: newInitialMessage.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create clarification conversation');
      }

      setIsCreatingThread(false);
      setNewSubject('');
      setNewInitialMessage('');
      if (data.thread?.id) {
        setSelectedThreadId(data.thread.id);
      }
      onRefresh();
    } catch (err: unknown) {
      setNewThreadError((err as Error).message || 'Failed to create conversation');
    } finally {
      setIsSubmittingNewThread(false);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role.includes('VC')) {
      return 'bg-purple-100 text-purple-900 border-purple-200';
    }
    if (role.includes('Dean Academic')) {
      return 'bg-amber-100 text-amber-900 border-amber-200';
    }
    return 'bg-blue-100 text-blue-900 border-blue-200';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Top Header Bar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-xs">
              Role-Based Clarification Dialogue & Threading
            </h3>
            <p className="text-[11px] text-slate-500">
              Targeted Q&A threads with recipient privacy, CC routing, and chat loops.
            </p>
          </div>
        </div>

        {allowCreateThread && !isCreatingThread && (
          <button
            type="button"
            onClick={() => setIsCreatingThread(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Clarification Query</span>
          </button>
        )}
      </div>

      {/* NEW THREAD CREATION FORM (VC / DEAN ACADEMIC) */}
      {isCreatingThread && (
        <form onSubmit={handleCreateThreadSubmit} className="p-5 border-b border-blue-200 bg-blue-50/30 space-y-4">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2">
            <div className="text-xs font-bold text-blue-950 flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Initiate Independent Clarification Conversation</span>
            </div>
            <button
              type="button"
              onClick={() => setIsCreatingThread(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕ Cancel
            </button>
          </div>

          {newThreadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{newThreadError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Subject */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Conversation Subject / Topic <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Workload Breakdown & Student-to-Faculty Ratio"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
              />
            </div>

            {/* Primary Recipient Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Primary Recipient <span className="text-rose-600">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setNewPrimaryRole('Department / Dean')}
                  className={`p-2 rounded-xl text-center text-[11px] font-bold border transition cursor-pointer ${
                    newPrimaryRole === 'Department / Dean'
                      ? 'border-blue-600 bg-blue-100 text-blue-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Original Dean
                  <span className="block text-[9px] font-normal text-slate-500 truncate">
                    {request.creator.name}
                  </span>
                </button>

                {currentUser?.designation === 'VC / Registrar' && (
                  <button
                    type="button"
                    onClick={() => setNewPrimaryRole('Dean Academic')}
                    className={`p-2 rounded-xl text-center text-[11px] font-bold border transition cursor-pointer ${
                      newPrimaryRole === 'Dean Academic'
                        ? 'border-amber-600 bg-amber-100 text-amber-900 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Dean Academic
                    <span className="block text-[9px] font-normal text-slate-500">
                      Private Scrutiny
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setNewPrimaryRole('Both')}
                  className={`p-2 rounded-xl text-center text-[11px] font-bold border transition cursor-pointer ${
                    newPrimaryRole === 'Both'
                      ? 'border-purple-600 bg-purple-100 text-purple-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Both
                  <span className="block text-[9px] font-normal text-slate-500">
                    Joint Channel
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Initial Clarification Question */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Clarification Question / Query <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="State the specific questions or clarifications required for this requisition..."
              value={newInitialMessage}
              onChange={(e) => setNewInitialMessage(e.target.value)}
              className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreatingThread(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingNewThread}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center space-x-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmittingNewThread ? 'Dispatching...' : 'Dispatch Clarification Thread'}</span>
            </button>
          </div>
        </form>
      )}

      {/* THREADS CONTENT AREA */}
      {visibleThreads.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <div className="font-bold text-slate-700 text-xs">No Active Clarification Conversations</div>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
            {allowCreateThread
              ? 'Click "New Clarification Query" above to start a targeted conversation.'
              : 'There are currently no clarification questions raised for this requisition.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 min-h-[360px]">
          {/* LEFT: THREADS LIST */}
          <div className="p-3 space-y-2 bg-slate-50/50 max-h-[460px] overflow-y-auto">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
              Conversations ({visibleThreads.length})
            </div>

            {visibleThreads.map((thread) => {
              const isSelected = thread.id === activeThread?.id;
              const lastMsg = thread.messages[thread.messages.length - 1];

              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`w-full p-3 rounded-xl text-left border transition cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                      : 'bg-white border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {thread.subject}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {new Date(thread.updatedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className={`px-2 py-0.5 rounded font-bold border ${getRoleBadge(thread.creatorRole)}`}>
                      By {thread.creatorRole}
                    </span>

                    <span className="text-slate-500 font-medium">
                      &rarr;{' '}
                      {thread.primaryRecipientRole === 'Both'
                        ? 'Both'
                        : thread.primaryRecipientRole === 'Dean Academic'
                        ? 'Dean Academic'
                        : thread.primaryRecipientName || 'Original Dean'}
                    </span>

                    {thread.ccRecipients?.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold border border-slate-200">
                        {thread.ccRecipients.length} CC
                      </span>
                    )}
                  </div>

                  {lastMsg && (
                    <p className="text-[11px] text-slate-500 line-clamp-1 italic pt-0.5">
                      {lastMsg.senderName}: &ldquo;{lastMsg.text}&rdquo;
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* RIGHT: CHAT BUBBLE STREAM & INLINE REPLY */}
          {activeThread && (
            <div className="md:col-span-2 flex flex-col justify-between max-h-[460px]">
              {/* Thread Meta Bar */}
              <div className="p-3.5 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    {activeThread.subject}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>
                      Initiated by: <strong className="text-slate-800">{activeThread.creatorName}</strong> ({activeThread.creatorRole})
                    </span>
                    <span>•</span>
                    <span>
                      Primary Recipient:{' '}
                      <strong className="text-blue-800">
                        {activeThread.primaryRecipientRole === 'Both'
                          ? 'Both (Dean Academic & Submitting Dean)'
                          : activeThread.primaryRecipientRole === 'Dean Academic'
                          ? 'Dean Academic'
                          : activeThread.primaryRecipientName || 'Submitting Dean'}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* CC Recipients Chips */}
                {activeThread.ccRecipients?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400">CC:</span>
                    {activeThread.ccRecipients.map((cc) => (
                      <span
                        key={cc.email}
                        className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200"
                        title={cc.email}
                      >
                        {cc.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Chat Messages Stream */}
              <div className="p-4 overflow-y-auto space-y-3.5 flex-1 bg-slate-50/30">
                {activeThread.messages.map((msg, index) => {
                  const isCurrentUserMsg =
                    currentUser && msg.senderEmail.toLowerCase() === currentUser.email.toLowerCase();

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex flex-col space-y-1 ${
                        isCurrentUserMsg ? 'items-end' : 'items-start'
                      }`}
                    >
                      {/* Author Header */}
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-medium px-1">
                        <span className="font-bold text-slate-800">{msg.senderName}</span>
                        <span className={`px-1.5 py-0.2 rounded font-bold border ${getRoleBadge(msg.senderRole)}`}>
                          {msg.senderRole}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(msg.timestamp).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Chat Bubble */}
                      <div
                        className={`p-3 rounded-2xl text-xs max-w-lg leading-relaxed shadow-xs ${
                          isCurrentUserMsg
                            ? 'bg-[#0f2d59] text-white rounded-tr-none'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Inline Reply Form */}
              <div className="p-3 border-t border-slate-200 bg-white">
                {replyError && (
                  <div className="mb-2 p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium">
                    {replyError}
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <textarea
                    rows={2}
                    placeholder={`Reply in thread "${activeThread.subject}"...`}
                    value={replyText[activeThread.id] || ''}
                    onChange={(e) =>
                      setReplyText({ ...replyText, [activeThread.id]: e.target.value })
                    }
                    className="flex-1 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendReply(activeThread.id)}
                    disabled={isReplying || !replyText[activeThread.id]?.trim()}
                    className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isReplying ? 'Sending...' : 'Reply'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
