import React, { useState } from 'react';
import { ArrowLeft, Check, Search, Users, Camera, X, Lock } from 'lucide-react';
import { User, Conversation } from '../../types';
import { chatStore } from '../../services/store';

interface NewGroupModalProps {
  contacts: User[];
  onGroupCreated: (conv: Conversation) => void;
  onClose: () => void;
  onOpenSubscriptions?: () => void;
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({
  contacts,
  onGroupCreated,
  onClose,
  onOpenSubscriptions,
}) => {
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop'
  );

  const hasMessagingAccess = chatStore.hasMessagingAccess();

  const toggleSelect = (userId: string) => {
    if (selectedIds.includes(userId)) {
      setSelectedIds(selectedIds.filter((id) => id !== userId));
    } else {
      setSelectedIds([...selectedIds, userId]);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasMessagingAccess) {
      onOpenSubscriptions?.();
      return;
    }
    if (!groupTitle.trim() || selectedIds.length === 0) return;

    const newGroup = chatStore.createGroupConversation(groupTitle.trim(), selectedIds, avatarUrl);
    onGroupCreated(newGroup);
  };

  const filtered = contacts.filter((c) =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-[#0b141a] flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <header className="bg-[#008069] dark:bg-[#1f2c34] text-white px-3 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/10 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h2 className="text-sm font-semibold leading-tight">New group</h2>
            <p className="text-[11px] text-white/80">{selectedIds.length} selected</p>
          </div>
        </div>
      </header>

      {/* Subscription Lock Notice */}
      {!hasMessagingAccess && (
        <div className="p-3 bg-amber-50 dark:bg-[#182229] border-b border-amber-200 dark:border-amber-900/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
              An active Messaging Plan is required to create group chats.
            </p>
          </div>
          <button
            onClick={onOpenSubscriptions}
            className="px-3 py-1 bg-[#00a884] text-white text-xs font-bold rounded-lg shadow-sm whitespace-nowrap"
          >
            Subscribe
          </button>
        </div>
      )}

        {selectedIds.length > 0 && groupTitle.trim() && (
          <button
            onClick={handleCreate}
            className="px-3 py-1 bg-white text-emerald-800 font-bold rounded-lg text-xs shadow-sm hover:bg-emerald-50"
          >
            Create
          </button>
        )}
      </header>

      {/* Form: Group Subject */}
      <div className="p-4 bg-slate-50 dark:bg-[#182229] border-b border-slate-200 dark:border-slate-800 flex items-center gap-4">
        <div className="relative">
          <img
            src={avatarUrl}
            alt="Group avatar"
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-500"
          />
          <button
            type="button"
            onClick={() => {
              const avatars = [
                'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=150&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop',
              ];
              const next = avatars[(avatars.indexOf(avatarUrl) + 1) % avatars.length];
              setAvatarUrl(next);
            }}
            className="absolute bottom-0 right-0 p-1 rounded-full bg-[#00a884] text-white shadow-xs"
            title="Change photo"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1">
          <input
            type="text"
            required
            value={groupTitle}
            onChange={(e) => setGroupTitle(e.target.value)}
            placeholder="Type group subject..."
            className="w-full bg-transparent border-b-2 border-emerald-500 pb-1 text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <span className="text-[10px] text-slate-400 block mt-1">Provide a group name and optional icon</span>
        </div>
      </div>

      {/* Selected chips row */}
      {selectedIds.length > 0 && (
        <div className="px-4 py-2 bg-slate-100 dark:bg-[#1f2c34] flex items-center gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
          {selectedIds.map((id) => {
            const user = contacts.find((c) => c.id === id);
            if (!user) return null;
            return (
              <div
                key={id}
                onClick={() => toggleSelect(id)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-[#2a3942] rounded-full text-xs text-slate-800 dark:text-slate-200 shadow-xs cursor-pointer shrink-0"
              >
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded-full object-cover"
                />
                <span className="font-medium">{user.fullName.split(' ')[0]}</span>
                <X className="w-3 h-3 text-slate-400 hover:text-slate-600" />
              </div>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-[#202c33] rounded-xl text-xs">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Contacts selection */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        {filtered.map((user) => {
          const isSelected = selectedIds.includes(user.id);
          return (
            <div
              key={user.id}
              onClick={() => toggleSelect(user.id)}
              className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#182229] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user.fullName}</p>
                  <p className="text-xs text-slate-400 truncate">{user.bio}</p>
                </div>
              </div>

              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-[#00a884] border-[#00a884] text-white'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
