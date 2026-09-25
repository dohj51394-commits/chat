import React, { useState } from 'react';
import { ArrowLeft, Search, Check, Send } from 'lucide-react';
import { Conversation, Message, User } from '../../types';

interface ForwardModalProps {
  message: Message;
  conversations: Conversation[];
  onForward: (targetConvId: string, msg: Message) => void;
  onClose: () => void;
}

export const ForwardModal: React.FC<ForwardModalProps> = ({
  message,
  conversations,
  onForward,
  onClose,
}) => {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#202c33] rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#008069] dark:bg-[#1f2c34] text-white flex items-center justify-between">
          <h3 className="font-semibold text-sm">Forward to...</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xs">
            Cancel
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-[#2a3942] rounded-xl text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chat..."
              className="w-full bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Message preview snippet */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-[#182229] border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 italic truncate">
          Forwarding: "{message.text || message.type + ' attachment'}"
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((c) => {
            const isSelected = selectedConvId === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedConvId(c.id)}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/30'
                    : 'hover:bg-slate-50 dark:hover:bg-[#182229]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={
                      c.avatarUrl ||
                      c.participants[0]?.avatarUrl ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop'
                    }
                    alt={c.title}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{c.title}</p>
                    <p className="text-xs text-slate-400 truncate">{c.type === 'group' ? 'Group' : 'Direct'}</p>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[#00a884] text-white flex items-center justify-center">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-[#182229] border-t border-slate-200 dark:border-slate-700/60 flex justify-end">
          <button
            disabled={!selectedConvId}
            onClick={() => {
              if (selectedConvId) {
                onForward(selectedConvId, message);
                onClose();
              }
            }}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#00a884] hover:bg-[#008f70] text-white text-xs font-semibold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <span>Forward</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
