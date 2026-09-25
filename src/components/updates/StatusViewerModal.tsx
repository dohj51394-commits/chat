import React, { useState, useEffect } from 'react';
import { ArrowLeft, X, Eye, Send, Trash2, ChevronUp } from 'lucide-react';
import { StatusUpdate, User } from '../../types';
import { chatStore } from '../../services/store';

interface StatusViewerModalProps {
  status: StatusUpdate;
  currentUser: User | null;
  onClose: () => void;
  onReply: (userId: string, replyText: string) => void;
}

export const StatusViewerModal: React.FC<StatusViewerModalProps> = ({
  status,
  currentUser,
  onClose,
  onReply,
}) => {
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const isMe = status.userId === currentUser?.id || status.userId === 'me';

  // Mark status as viewed by current user
  useEffect(() => {
    chatStore.viewStatus(status.id);
  }, [status.id]);

  // Auto advance timer (5 seconds)
  useEffect(() => {
    if (isPaused || showViewersSheet) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          onClose();
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, showViewersSheet, onClose]);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReply(status.userId, `Replied to status: "${replyText.trim()}"`);
    setReplyText('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden animate-in fade-in select-none"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* 1. TOP PROGRESS BAR & HEADER */}
      <div className="absolute top-0 left-0 right-0 z-20 p-3 bg-gradient-to-b from-black/80 to-transparent">
        {/* Progress Bar */}
        <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* User Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-white hover:opacity-80 p-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <img
              src={status.user.avatarUrl}
              alt={status.user.fullName}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover ring-1 ring-white/50"
            />
            <div>
              <h3 className="text-sm font-semibold text-white leading-tight">
                {status.user.fullName}
              </h3>
              <p className="text-[11px] text-white/70">
                {new Date(status.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. MAIN STATUS CONTENT */}
      <div
        className="flex-1 flex items-center justify-center p-6 text-center"
        style={{
          backgroundColor: status.type === 'text' ? (status.backgroundColor || '#008069') : '#000',
        }}
      >
        {status.type === 'text' && (
          <p
            className="text-white text-2xl sm:text-3xl font-bold max-w-lg leading-relaxed select-text"
            style={{ fontFamily: status.fontStyle || 'sans-serif' }}
          >
            {status.content}
          </p>
        )}

        {status.type === 'image' && (
          <div className="relative max-h-full max-w-full flex items-center justify-center">
            <img
              src={status.mediaUrl}
              alt="Status"
              referrerPolicy="no-referrer"
              className="max-h-[75vh] max-w-full object-contain rounded-lg"
            />
            {status.content && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-xs text-white p-3 rounded-xl text-sm">
                {status.content}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. BOTTOM CONTROLS */}
      <div className="relative z-20 p-4 bg-gradient-to-t from-black/90 to-transparent">
        {isMe ? (
          /* Viewers counter for my status */
          <div className="flex flex-col items-center">
            <button
              onClick={() => setShowViewersSheet(true)}
              className="flex items-center gap-1.5 text-xs text-white/90 hover:text-white bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{status.viewers.length} views</span>
              <ChevronUp className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        ) : (
          /* Reply input for other's status */
          <form onSubmit={handleSendReply} className="flex items-center gap-2 max-w-lg mx-auto">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${status.user.fullName.split(' ')[0]}...`}
              className="flex-1 px-4 py-2.5 rounded-full bg-white/20 backdrop-blur-md text-white placeholder-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="w-10 h-10 rounded-full bg-[#00a884] text-white flex items-center justify-center hover:bg-[#008f70] disabled:opacity-40 transition-all shrink-0"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        )}
      </div>

      {/* 4. VIEWERS BOTTOM SHEET (If opened by author) */}
      {showViewersSheet && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in"
          onClick={() => setShowViewersSheet(false)}
        >
          <div
            className="bg-white dark:bg-[#202c33] rounded-t-3xl max-h-[60vh] flex flex-col p-4 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                Viewed by {status.viewers.length}
              </h4>
              <button
                onClick={() => setShowViewersSheet(false)}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-bold"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 py-2">
              {status.viewers.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">No views yet</p>
              ) : (
                status.viewers.map((v) => (
                  <div key={v.viewerId} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={v.viewerAvatar}
                        alt={v.viewerName}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {v.viewerName}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(v.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
