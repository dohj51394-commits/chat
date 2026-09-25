import React, { useState } from 'react';
import { ArrowLeft, Search, Phone, Video, X, Lock } from 'lucide-react';
import { User, CallType } from '../../types';
import { chatStore } from '../../services/store';

interface NewCallModalProps {
  contacts: User[];
  onStartCall: (targetUser: User, type: CallType) => void;
  onClose: () => void;
  onOpenSubscriptions?: () => void;
}

export const NewCallModal: React.FC<NewCallModalProps> = ({
  contacts,
  onStartCall,
  onClose,
  onOpenSubscriptions,
}) => {
  const [search, setSearch] = useState('');
  const hasCallingAccess = chatStore.hasCallingAccess();

  // Combine contacts and registered users
  const currentUserId = chatStore.currentUser?.id;
  const allKnownUsersMap = new Map<string, User>();
  contacts.forEach((c) => {
    if (c.id !== currentUserId) allKnownUsersMap.set(c.id, c);
  });
  chatStore.registeredUsers.forEach((u) => {
    if (u.id !== currentUserId && !allKnownUsersMap.has(u.id)) {
      allKnownUsersMap.set(u.id, u);
    }
  });

  const allAvailableUsers = Array.from(allKnownUsersMap.values());

  const filtered = allAvailableUsers.filter((c) =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.phoneNumber.includes(search) ||
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleInitiateCall = (user: User, type: CallType) => {
    if (!hasCallingAccess) {
      onClose();
      onOpenSubscriptions?.();
      return;
    }
    onClose();
    onStartCall(user, type);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-[#0b141a] flex flex-col animate-in slide-in-from-right duration-200">
      <header className="bg-[#008069] dark:bg-[#1f2c34] text-white px-3 py-2 flex items-center gap-3 shadow-sm">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-black/10 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h2 className="text-sm font-semibold leading-tight">New call</h2>
          <p className="text-[11px] text-white/80">{allAvailableUsers.length} available contacts</p>
        </div>
      </header>

      {/* Subscription Lock Notice */}
      {!hasCallingAccess && (
        <div className="p-3 bg-amber-50 dark:bg-[#182229] border-b border-amber-200 dark:border-amber-900/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
              An active Calling Plan is required to place voice or video calls.
            </p>
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenSubscriptions?.();
            }}
            className="px-3 py-1 bg-[#00a884] text-white text-xs font-bold rounded-lg shadow-sm whitespace-nowrap"
          >
            Subscribe
          </button>
        </div>
      )}

      {/* Search */}
      <div className="p-3 bg-slate-50 dark:bg-[#182229] border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#202c33] rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contact..."
            className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        {filtered.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#182229] transition-colors"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-full object-cover ring-1 ring-black/5"
              />
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user.fullName}
                </h4>
                <p className="text-xs text-slate-400 font-mono">{user.phoneNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleInitiateCall(user, 'voice')}
                className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 transition-colors"
                title="Voice call"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleInitiateCall(user, 'video')}
                className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 transition-colors"
                title="Video call"
              >
                <Video className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
