import React, { useState } from 'react';
import { ArrowLeft, Search, UserPlus, Users, Sparkles, X, Check } from 'lucide-react';
import { User } from '../../types';
import { chatStore } from '../../services/store';

interface NewChatModalProps {
  contacts: User[];
  onSelectUser: (user: User) => void;
  onClose: () => void;
  onNewGroup: () => void;
  onNewCommunity: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  contacts,
  onSelectUser,
  onClose,
  onNewGroup,
  onNewCommunity,
}) => {
  const [search, setSearch] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  // Combine saved contacts and registered users
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

  const filtered = allAvailableUsers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.username.toLowerCase().includes(q) ||
      c.phoneNumber.includes(q)
    );
  });

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;

    const contact = chatStore.addContact(newContactName.trim(), newContactPhone.trim());
    onSelectUser(contact);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-[#0b141a] flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <header className="bg-[#008069] dark:bg-[#1f2c34] text-white px-3 py-2 flex items-center gap-3 shadow-sm">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-black/10 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h2 className="text-sm font-semibold leading-tight">Select contact</h2>
          <p className="text-[11px] text-white/80">{contacts.length} contacts</p>
        </div>
      </header>

      {/* Search Bar */}
      <div className="p-3 bg-slate-50 dark:bg-[#182229] border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#202c33] rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, username, or phone..."
            className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Action shortcuts */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        <button
          onClick={() => {
            onClose();
            onNewGroup();
          }}
          className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#182229] transition-colors text-slate-800 dark:text-slate-100"
        >
          <div className="w-10 h-10 rounded-full bg-[#00a884] text-white flex items-center justify-center shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <span className="font-semibold text-sm">New group</span>
        </button>

        <button
          onClick={() => setShowAddContact(!showAddContact)}
          className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#182229] transition-colors text-slate-800 dark:text-slate-100"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <UserPlus className="w-5 h-5" />
          </div>
          <span className="font-semibold text-sm">New contact</span>
        </button>

        <button
          onClick={() => {
            onClose();
            onNewCommunity();
          }}
          className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#182229] transition-colors text-slate-800 dark:text-slate-100"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-semibold text-sm">New community</span>
        </button>
      </div>

      {/* Inline Add Contact Form */}
      {showAddContact && (
        <form
          onSubmit={handleCreateContact}
          className="p-4 bg-slate-100 dark:bg-[#1f2c34] border-y border-slate-200 dark:border-slate-700 space-y-3 animate-in slide-in-from-top duration-150"
        >
          <h3 className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            Quick Add Contact
          </h3>
          <input
            type="text"
            required
            value={newContactName}
            onChange={(e) => setNewContactName(e.target.value)}
            placeholder="Full Name (e.g. Michael Scott)"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-[#2a3942] text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="tel"
            required
            value={newContactPhone}
            onChange={(e) => setNewContactPhone(e.target.value)}
            placeholder="Phone number (e.g. +1 555 0199)"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-[#2a3942] text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddContact(false)}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-[#00a884] text-white rounded-lg shadow-sm hover:bg-[#008f70]"
            >
              Save & Chat
            </button>
          </div>
        </form>
      )}

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        <div className="px-4 py-2 bg-slate-50 dark:bg-[#182229] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Contacts on Chat ({filtered.length})
        </div>

        {filtered.map((user) => (
          <div
            key={user.id}
            onClick={() => onSelectUser(user)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#182229] cursor-pointer transition-colors"
          >
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-full object-cover ring-1 ring-black/5"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {user.fullName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.bio}</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{user.phoneNumber}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
