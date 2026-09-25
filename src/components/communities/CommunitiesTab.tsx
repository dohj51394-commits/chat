import React, { useState } from 'react';
import { Users2, Plus, Megaphone, MessageSquare, ChevronRight, Share2, Copy, Check } from 'lucide-react';
import { Community, Conversation } from '../../types';

interface CommunitiesTabProps {
  communities: Community[];
  onSelectCommunityGroup: (groupId: string, title: string) => void;
  onNewCommunity: () => void;
}

export const CommunitiesTab: React.FC<CommunitiesTabProps> = ({
  communities,
  onSelectCommunityGroup,
  onNewCommunity,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyInvite = (code: string) => {
    navigator.clipboard.writeText(`https://chat.app/join/${code}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 divide-y divide-slate-100 dark:divide-slate-800">
      {/* 1. NEW COMMUNITY PROMPT */}
      <div className="p-4 bg-white dark:bg-[#111b21]">
        <button
          onClick={onNewCommunity}
          className="w-full flex items-center gap-4 text-left group"
        >
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-dashed border-emerald-500 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
              New community
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bring your members together in topic-based groups and announcement channels
            </p>
          </div>
        </button>
      </div>

      {/* 2. COMMUNITIES LIST */}
      <div className="space-y-4 py-2">
        {communities.map((comm) => (
          <div
            key={comm.id}
            className="bg-white dark:bg-[#111b21] border-y border-slate-100 dark:border-slate-800"
          >
            {/* Community Header */}
            <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-3.5 min-w-0">
                <img
                  src={comm.avatarUrl}
                  alt={comm.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-2xl object-cover ring-1 ring-black/5"
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {comm.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {comm.memberCount} members · {comm.description}
                  </p>
                </div>
              </div>

              {/* Share invite code */}
              <button
                onClick={() => handleCopyInvite(comm.inviteCode)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600 transition-colors shrink-0"
                title="Copy Invite Link"
              >
                {copiedCode === comm.inviteCode ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Sub-groups */}
            <div className="divide-y divide-slate-50 dark:divide-slate-800/40">
              {comm.groups.map((grp) => (
                <div
                  key={grp.id}
                  onClick={() => onSelectCommunityGroup(grp.id, `${comm.name} · ${grp.title}`)}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#182229] active:bg-slate-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        grp.isAnnouncement
                          ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                          : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {grp.isAnnouncement ? (
                        <Megaphone className="w-4 h-4" />
                      ) : (
                        <MessageSquare className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {grp.title}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{grp.lastMessage || 'Tap to open chat'}</p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
