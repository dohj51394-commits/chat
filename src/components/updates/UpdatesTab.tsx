import React from 'react';
import { Camera, Plus, Eye, Lock, ChevronDown, ChevronRight, PenSquare } from 'lucide-react';
import { StatusUpdate, User } from '../../types';

interface UpdatesTabProps {
  statuses: StatusUpdate[];
  currentUser: User | null;
  onViewStatus: (status: StatusUpdate) => void;
  onNewTextStatus: () => void;
  onNewMediaStatus: () => void;
}

export const UpdatesTab: React.FC<UpdatesTabProps> = ({
  statuses,
  currentUser,
  onViewStatus,
  onNewTextStatus,
  onNewMediaStatus,
}) => {
  // Separate my status vs contacts' statuses
  const myStatus = statuses.find((s) => s.userId === currentUser?.id || s.userId === 'me');
  const contactsStatuses = statuses.filter((s) => s.userId !== currentUser?.id && s.userId !== 'me');

  const formatTimeAgo = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} minutes ago`;
    const hours = Math.floor(diff / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 divide-y divide-slate-100 dark:divide-slate-800">
      {/* 1. MY STATUS ROW */}
      <div className="p-4 bg-white dark:bg-[#111b21] flex items-center justify-between">
        <div
          onClick={() => {
            if (myStatus) onViewStatus(myStatus);
            else onNewMediaStatus();
          }}
          className="flex items-center gap-3.5 cursor-pointer flex-1 min-w-0"
        >
          <div className="relative">
            <img
              src={
                currentUser?.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop'
              }
              alt="My Status"
              referrerPolicy="no-referrer"
              className={`w-13 h-13 rounded-full object-cover p-0.5 ${
                myStatus
                  ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-[#111b21]'
                  : ''
              }`}
            />
            {!myStatus && (
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#00a884] text-white flex items-center justify-center border-2 border-white dark:border-[#111b21]">
                <Plus className="w-3 h-3 stroke-[3]" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
              My status
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {myStatus
                ? `${formatTimeAgo(myStatus.createdAt)} · ${myStatus.viewers.length} views`
                : 'Tap to add status update'}
            </p>
          </div>
        </div>

        {/* Quick create shortcuts */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onNewTextStatus}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#202c33] text-slate-600 dark:text-slate-300 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            title="Text status"
          >
            <PenSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </button>
          <button
            onClick={onNewMediaStatus}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#202c33] text-slate-600 dark:text-slate-300 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            title="Photo status"
          >
            <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </button>
        </div>
      </div>

      {/* 2. RECENT UPDATES SECTION */}
      <div className="py-2">
        <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Recent updates
        </div>

        {contactsStatuses.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            No updates right now. Tap the camera to share your day!
          </div>
        ) : (
          contactsStatuses.map((status) => {
            const hasViewed = status.viewers.some((v) => v.viewerId === currentUser?.id);
            return (
              <div
                key={status.id}
                onClick={() => onViewStatus(status)}
                className="flex items-center gap-3.5 px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#182229] active:bg-slate-100 dark:active:bg-[#1c2830] cursor-pointer transition-colors"
              >
                <div className="relative">
                  <div
                    className={`p-0.5 rounded-full ring-2 ${
                      hasViewed
                        ? 'ring-slate-300 dark:ring-slate-600'
                        : 'ring-[#00a884] ring-offset-2 ring-offset-white dark:ring-offset-[#111b21]'
                    }`}
                  >
                    <img
                      src={status.user.avatarUrl}
                      alt={status.user.fullName}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {status.user.fullName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatTimeAgo(status.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. SECURITY FOOTER */}
      <div className="p-4 flex items-center justify-center gap-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
        <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Your status updates are end-to-end encrypted and disappear after 24 hours</span>
      </div>
    </div>
  );
};
