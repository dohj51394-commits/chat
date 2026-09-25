import React, { useState } from 'react';
import { Pin, Archive, Check, CheckCheck, Trash2, VolumeX, MessageSquareOff, ArchiveRestore } from 'lucide-react';
import { Conversation, Message, User } from '../../types';

interface ChatsListProps {
  conversations: Conversation[];
  currentUser?: User | null;
  searchQuery: string;
  onSelectConversation: (conv: Conversation) => void;
  onTogglePin: (convId: string) => void;
  onToggleArchive: (convId: string) => void;
  onDeleteConversation: (convId: string) => void;
  showArchived: boolean;
  setShowArchived: (show: boolean) => void;
}

export const ChatsList: React.FC<ChatsListProps> = ({
  conversations,
  currentUser,
  searchQuery,
  onSelectConversation,
  onTogglePin,
  onToggleArchive,
  onDeleteConversation,
  showArchived,
  setShowArchived,
}) => {
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);

  // Format message timestamp
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' });
  };

  // Render message status tick
  const renderStatus = (msg?: Message) => {
    if (!msg) return null;
    const isMe = msg.senderId === 'me' || msg.senderId === currentUser?.id;
    if (!isMe) return null;

    if (msg.status === 'read') {
      return <CheckCheck className="w-4 h-4 text-sky-500 inline-block mr-1 shrink-0" />;
    }
    if (msg.status === 'delivered') {
      return <CheckCheck className="w-4 h-4 text-slate-400 dark:text-slate-400 inline-block mr-1 shrink-0" />;
    }
    return <Check className="w-4 h-4 text-slate-400 dark:text-slate-400 inline-block mr-1 shrink-0" />;
  };

  // Filter conversations
  const filtered = conversations.filter((c) => {
    // Check archive state
    if (showArchived ? !c.isArchived : c.isArchived) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = c.title.toLowerCase().includes(query);
    const lastMsgMatch = c.lastMessage?.text?.toLowerCase().includes(query);
    const participantMatch = c.participants.some(
      (p) =>
        p.fullName.toLowerCase().includes(query) ||
        p.username.toLowerCase().includes(query) ||
        p.phoneNumber.includes(query)
    );
    return titleMatch || lastMsgMatch || participantMatch;
  });

  const archivedCount = conversations.filter((c) => c.isArchived).length;

  return (
    <div className="flex-1 overflow-y-auto pb-24 divide-y divide-slate-100 dark:divide-[#222d34]">
      {/* Archived Chats Row (if not currently in archived view) */}
      {!showArchived && archivedCount > 0 && !searchQuery && (
        <button
          onClick={() => setShowArchived(true)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#182229] transition-colors text-slate-700 dark:text-slate-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Archive className="w-5 h-5" />
            </div>
            <span className="font-semibold text-sm">Archived</span>
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40">
            {archivedCount}
          </span>
        </button>
      )}

      {showArchived && (
        <div className="px-4 py-3 bg-slate-100 dark:bg-[#182229] flex items-center justify-between">
          <button
            onClick={() => setShowArchived(false)}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 hover:underline"
          >
            <ArchiveRestore className="w-4 h-4" />
            <span>Back to all chats</span>
          </button>
          <span className="text-xs text-slate-500">{archivedCount} archived</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 dark:text-slate-500">
          <MessageSquareOff className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
          <p className="text-sm font-medium">No chats found</p>
          <p className="text-xs mt-1 text-slate-400">
            {searchQuery ? 'Try a different search query' : 'Tap the message icon to start a new chat'}
          </p>
        </div>
      ) : (
        filtered.map((conv) => {
          const avatar =
            conv.avatarUrl ||
            conv.participants[0]?.avatarUrl ||
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop';
          const isOnline = conv.type === 'direct' && conv.participants[0]?.isOnline;
          const isTyping = conv.typingUsers && conv.typingUsers.length > 0;

          return (
            <div
              key={conv.id}
              className="relative group flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#182229] active:bg-slate-100 dark:active:bg-[#1c2830] transition-colors cursor-pointer select-none"
              onClick={() => onSelectConversation(conv)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenuId(contextMenuId === conv.id ? null : conv.id);
              }}
            >
              {/* Avatar with optional online dot */}
              <div className="relative shrink-0">
                <img
                  src={avatar}
                  alt={conv.title}
                  referrerPolicy="no-referrer"
                  className="w-13 h-13 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10"
                />
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#0b141a] rounded-full" />
                )}
              </div>

              {/* Chat details */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {conv.title}
                  </h3>
                  <span
                    className={`text-[11px] tabular-nums whitespace-nowrap ml-2 ${
                      conv.unreadCount > 0
                        ? 'text-[#00a884] font-semibold'
                        : 'text-slate-400 dark:text-slate-400'
                    }`}
                  >
                    {formatTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center truncate pr-2">
                    {isTyping ? (
                      <span className="text-[#00a884] font-medium animate-pulse">
                        typing...
                      </span>
                    ) : (
                      <>
                        {renderStatus(conv.lastMessage)}
                        <span className="truncate">
                          {conv.lastMessage?.isDeleted
                            ? '🚫 This message was deleted'
                            : conv.lastMessage?.type === 'audio'
                            ? '🎤 Voice note'
                            : conv.lastMessage?.type === 'image'
                            ? '📷 Photo'
                            : conv.lastMessage?.type === 'video'
                            ? '📹 Video'
                            : conv.lastMessage?.type === 'document'
                            ? '📄 Document'
                            : conv.lastMessage?.text || 'Tap to chat'}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {conv.isMuted && <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                    {conv.isPinned && <Pin className="w-3.5 h-3.5 text-slate-400 rotate-45" />}
                    {conv.unreadCount > 0 && (
                      <span className="min-w-4 h-4 px-1.5 flex items-center justify-center text-[10px] font-bold rounded-full bg-[#00a884] text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Long-press / Context action buttons */}
              {contextMenuId === conv.id && (
                <div
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white dark:bg-[#233138] p-1 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-10 animate-in fade-in zoom-in-95 duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      onTogglePin(conv.id);
                      setContextMenuId(null);
                    }}
                    title={conv.isPinned ? 'Unpin' : 'Pin'}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg text-slate-600 dark:text-slate-300"
                  >
                    <Pin className={`w-4 h-4 ${conv.isPinned ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => {
                      onToggleArchive(conv.id);
                      setContextMenuId(null);
                    }}
                    title={conv.isArchived ? 'Unarchive' : 'Archive'}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg text-slate-600 dark:text-slate-300"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      onDeleteConversation(conv.id);
                      setContextMenuId(null);
                    }}
                    title="Delete"
                    className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-rose-600 dark:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
