import React, { useState } from 'react';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Link2, PhoneCall, Lock, Check } from 'lucide-react';
import { CallLog, User, CallType } from '../../types';
import { chatStore } from '../../services/store';

interface CallsTabProps {
  callLogs: CallLog[];
  currentUser?: User | null;
  onStartCall: (targetUser: User, type: CallType) => void;
  onNewCall: () => void;
  onOpenSubscriptions: () => void;
}

export const CallsTab: React.FC<CallsTabProps> = ({
  callLogs,
  currentUser,
  onStartCall,
  onNewCall,
  onOpenSubscriptions,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const hasCallingAccess = chatStore.hasCallingAccess(currentUser?.id);
  const callingSubInfo = chatStore.getSubscriptionInfo('calling', currentUser?.id);

  const formatCallTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
    if (diff === 1) return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleCallClick = (target: User, type: CallType) => {
    if (!hasCallingAccess) {
      onOpenSubscriptions();
      return;
    }
    onStartCall(target, type);
  };

  const handleCopyLink = () => {
    if (!hasCallingAccess) {
      onOpenSubscriptions();
      return;
    }
    navigator.clipboard.writeText('https://chat.app/call/' + Math.random().toString(36).substring(7));
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 divide-y divide-slate-100 dark:divide-slate-800">
      {/* 0. SUBSCRIPTION STATUS BANNER */}
      {!hasCallingAccess ? (
        <div className="p-3 bg-amber-50 dark:bg-[#182229] border-b border-amber-200 dark:border-amber-900/40 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                Calling Locked · Subscription Required
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Active Calling Plan required to make voice & video calls.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSubscriptions}
            className="px-3 py-1.5 bg-[#00a884] hover:bg-[#008f70] text-white text-xs font-bold rounded-xl shadow-md whitespace-nowrap active:scale-95 transition-all"
          >
            ⚡ Subscribe
          </button>
        </div>
      ) : (
        <div className="px-4 py-2 bg-emerald-50/60 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold">Calling Subscription Active</span>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            {callingSubInfo?.formattedTime || 'Unlimited HD Calls'}
          </span>
        </div>
      )}

      {/* 1. CREATE CALL LINK BANNER */}
      <div className="p-4 bg-white dark:bg-[#111b21]">
        <button
          onClick={handleCopyLink}
          className="w-full flex items-center gap-4 text-left group"
        >
          <div className="w-13 h-13 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            {copiedLink ? (
              <Check className="w-6 h-6 text-emerald-600 stroke-[2.5]" />
            ) : (
              <Link2 className="w-6 h-6 rotate-45 stroke-[2.5]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
              {copiedLink ? 'Link copied to clipboard!' : 'Create call link'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {copiedLink ? 'Share with anyone to start an encrypted call' : 'Share a link for your voice or video call'}
            </p>
          </div>
        </button>
      </div>

      {/* 2. RECENT CALLS LIST */}
      <div className="py-2">
        <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Recent calls ({callLogs.length})
        </div>

        {callLogs.length === 0 ? (
          <div className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
            <PhoneCall className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p>To start calling contacts who have Chat, tap the phone icon at the bottom of your screen.</p>
          </div>
        ) : (
          callLogs.map((log) => {
            const partner = log.direction === 'outgoing' ? log.receiver : log.caller;
            const isMissed = log.status === 'missed' || log.direction === 'missed';

            return (
              <div
                key={log.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#182229] active:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={partner.avatarUrl}
                    alt={partner.fullName}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover ring-1 ring-black/5"
                  />
                  <div className="min-w-0">
                    <h4
                      className={`text-sm font-semibold truncate ${
                        isMissed ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {partner.fullName}
                    </h4>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {isMissed ? (
                        <PhoneMissed className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      ) : log.direction === 'incoming' ? (
                        <PhoneIncoming className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <PhoneOutgoing className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      )}
                      <span className="truncate">{formatCallTime(log.startedAt)}</span>
                      {log.durationSeconds > 0 && (
                        <span className="tabular-nums">
                          · {Math.floor(log.durationSeconds / 60)}m {log.durationSeconds % 60}s
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Call back action button */}
                <button
                  onClick={() => handleCallClick(partner, log.callType)}
                  className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#202c33] text-emerald-600 dark:text-emerald-400 active:scale-95 transition-transform shrink-0"
                  title={`Call back with ${log.callType}`}
                >
                  {log.callType === 'video' ? (
                    <Video className="w-5 h-5" />
                  ) : (
                    <Phone className="w-5 h-5" />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
