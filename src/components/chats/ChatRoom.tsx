import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
  Mic,
  Square,
  Play,
  Pause,
  Reply,
  Forward,
  Trash2,
  Copy,
  Check,
  CheckCheck,
  Image as ImageIcon,
  FileText,
  Camera,
  X,
  Lock,
  Download,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { Conversation, Message, User, CallType } from '../../types';
import { chatStore } from '../../services/store';

interface ChatRoomProps {
  conversation: Conversation;
  currentUser: User | null;
  onBack: () => void;
  onStartCall: (targetUser: User, callType: CallType) => void;
  onForwardMessage: (msg: Message) => void;
  onOpenSubscriptions: () => void;
  onReportUser: (userId: string) => void;
  onOpenSecurity: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  conversation,
  currentUser,
  onBack,
  onStartCall,
  onForwardMessage,
  onOpenSubscriptions,
  onReportUser,
  onOpenSecurity,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [subscriptionWarning, setSubscriptionWarning] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const targetUser = conversation.participants[0] || currentUser;

  // Refresh messages from store
  useEffect(() => {
    chatStore.markConversationAsRead(conversation.id);
    const update = () => {
      setMessages([...(chatStore.messages[conversation.id] || [])]);
    };
    update();
    const unsub = chatStore.subscribe(update);
    return () => unsub();
  }, [conversation.id]);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, replyingTo]);

  // Check messaging plan before sending
  const handleSendMessage = (
    type: Message['type'] = 'text',
    mediaUrl?: string,
    mediaMeta?: Message['mediaMeta']
  ) => {
    if (type === 'text' && !inputText.trim()) return;

    if (!chatStore.hasMessagingAccess(currentUser?.id)) {
      setSubscriptionWarning('An active Messaging Plan is required to send messages. Tap to subscribe via Paystack.');
      return;
    }

    chatStore.sendMessage(conversation.id, {
      text: type === 'text' ? inputText.trim() : undefined,
      type,
      mediaUrl,
      mediaMeta,
      replyToId: replyingTo?.id,
    });

    setInputText('');
    setReplyingTo(null);
    setShowAttachmentMenu(false);
    setShowEmojiPicker(false);
    setSubscriptionWarning(null);
  };

  // Voice recording
  const startRecording = async () => {
    if (!chatStore.hasMessagingAccess(currentUser?.id)) {
      setSubscriptionWarning('An active Messaging Plan is required to send voice notes.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        handleSendMessage('audio', audioUrl, { duration: recordingDuration });
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingVoice(true);
      setRecordingDuration(0);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch {
      // Fallback: simulated voice note
      setIsRecordingVoice(true);
      setRecordingDuration(0);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    }
  };

  const stopAndSendRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Fallback voice note
      handleSendMessage('audio', 'voice_simulated', { duration: Math.max(recordingDuration, 2) });
    }

    setIsRecordingVoice(false);
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingVoice(false);
  };

  // Call triggers with calling plan gatekeeper
  const handleInitiateCall = (type: CallType) => {
    if (!targetUser) return;
    if (!chatStore.hasCallingAccess(currentUser?.id)) {
      onOpenSubscriptions();
      return;
    }
    onStartCall(targetUser, type);
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    handleSendMessage(type, fileUrl, {
      fileName: file.name,
      fileSize: (file.size / 1024).toFixed(1) + ' KB',
    });
    e.target.value = '';
  };

  // Audio waveform playback simulation
  const togglePlayAudio = (msgId: string) => {
    setPlayingAudioId(playingAudioId === msgId ? null : msgId);
  };

  const quickEmojis = ['👍', '❤️', '😂', '🔥', '👏', '🙏', '🎉', '🚀', '💯', '✨', '😍', '🙌', '😎', '💡', '🌟', '🥳'];

  const [pickerTab, setPickerTab] = useState<'emojis' | 'stickers' | 'gifs'>('emojis');

  const SAMPLE_GIFS = [
    { id: 'g1', title: 'Thumbs Up', url: 'https://images.unsplash.com/photo-1584441405886-bc91be61e56a?w=400&auto=format&fit=crop' },
    { id: 'g2', title: 'Celebrate Party', url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&auto=format&fit=crop' },
    { id: 'g3', title: 'Heart Love', url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&auto=format&fit=crop' },
    { id: 'g4', title: 'Applause Cheer', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop' },
    { id: 'g5', title: 'Smile Laugh', url: 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?w=400&auto=format&fit=crop' },
    { id: 'g6', title: 'Fire Energy', url: 'https://images.unsplash.com/photo-1520690214124-2405c5217036?w=400&auto=format&fit=crop' },
  ];

  const SAMPLE_STICKERS = [
    { id: 's1', name: 'Cool Mascot', url: 'https://cdn-icons-png.flaticon.com/512/9308/9308891.png' },
    { id: 's2', name: 'Red Heart', url: 'https://cdn-icons-png.flaticon.com/512/833/833472.png' },
    { id: 's3', name: 'Hot Fire', url: 'https://cdn-icons-png.flaticon.com/512/785/785116.png' },
    { id: 's4', name: 'Celebration Popper', url: 'https://cdn-icons-png.flaticon.com/512/3815/3815049.png' },
    { id: 's5', name: 'Gold Trophy', url: 'https://cdn-icons-png.flaticon.com/512/3112/3112946.png' },
    { id: 's6', name: 'Rocket Launch', url: 'https://cdn-icons-png.flaticon.com/512/1356/1356479.png' },
    { id: 's7', name: 'Verified Shield', url: 'https://cdn-icons-png.flaticon.com/512/1067/1067566.png' },
    { id: 's8', name: 'High Clapping', url: 'https://cdn-icons-png.flaticon.com/512/2620/2620582.png' },
  ];

  const hasMessagingAccess = chatStore.hasMessagingAccess(currentUser?.id);

  return (
    <div className="fixed inset-0 z-40 bg-[#efeae2] dark:bg-[#0b141a] flex flex-col justify-between overflow-hidden">
      {/* 1. TOP BAR */}
      <header className="sticky top-0 z-30 bg-[#008069] dark:bg-[#1f2c34] text-white px-2 py-2 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-black/10 active:scale-95 transition-transform"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <div
            onClick={onOpenSecurity}
            className="flex items-center gap-2.5 cursor-pointer min-w-0 pr-2 hover:opacity-90"
          >
            <div className="relative shrink-0">
              <img
                src={
                  conversation.avatarUrl ||
                  targetUser?.avatarUrl ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop'
                }
                alt={conversation.title}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover ring-1 ring-white/20"
              />
              {conversation.type === 'direct' && targetUser?.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#008069] dark:border-[#1f2c34] rounded-full" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-semibold text-white truncate leading-tight">
                  {conversation.title}
                </h2>
                <span title="Signal Protocol E2EE Active">
                  <Lock className="w-3 h-3 text-emerald-300 shrink-0" />
                </span>
              </div>
              <p className="text-[11px] text-white/80 truncate">
                {conversation.typingUsers && conversation.typingUsers.length > 0 ? (
                  <span className="text-white font-medium animate-pulse">typing...</span>
                ) : conversation.type === 'direct' ? (
                  targetUser?.isOnline ? (
                    'online'
                  ) : (
                    targetUser?.lastSeen || 'offline'
                  )
                ) : (
                  `${conversation.participants.length} members`
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Call & More Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => handleInitiateCall('video')}
            className="p-2 rounded-full hover:bg-black/10 active:scale-95 transition-transform text-white"
            title="Video call"
          >
            <Video className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleInitiateCall('voice')}
            className="p-2 rounded-full hover:bg-black/10 active:scale-95 transition-transform text-white"
            title="Voice call"
          >
            <Phone className="w-5 h-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 rounded-full hover:bg-black/10 active:scale-95 transition-transform text-white"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 top-11 w-48 bg-white dark:bg-[#233138] rounded-xl shadow-xl border border-slate-200 dark:border-slate-700/60 py-1.5 z-50 text-slate-800 dark:text-slate-100 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onOpenSecurity();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-[#182229] flex items-center gap-2"
                >
                  <Lock className="w-4 h-4 text-emerald-500" />
                  <span>Verify encryption</span>
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    chatStore.toggleMuteConversation?.(conversation.id);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-[#182229]"
                >
                  Mute notifications
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    if (targetUser) onReportUser(targetUser.id);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-[#182229] text-rose-500"
                >
                  Report contact
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    if (targetUser) chatStore.blockUser(targetUser.id);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-[#182229] text-rose-500"
                >
                  Block contact
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. SUBSCRIPTION BANNER (if triggered) */}
      {subscriptionWarning && (
        <div className="bg-amber-500 text-white px-4 py-2 text-xs flex items-center justify-between gap-2 shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{subscriptionWarning}</span>
          </div>
          <button
            onClick={onOpenSubscriptions}
            className="px-2.5 py-1 bg-white text-amber-700 font-bold rounded shadow-sm text-xs hover:bg-amber-50 whitespace-nowrap"
          >
            Subscribe
          </button>
        </div>
      )}

      {/* 3. MESSAGES SCROLL AREA */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2.5">
        {/* End-to-End Encryption Notice Badge */}
        <div
          onClick={onOpenSecurity}
          className="mx-auto max-w-sm bg-[#ffeecd] dark:bg-[#182229] border border-amber-200 dark:border-amber-900/30 rounded-lg p-2.5 text-center text-[11px] text-amber-950 dark:text-amber-200/90 shadow-sm cursor-pointer hover:opacity-90 flex items-center gap-2"
        >
          <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them.
          </span>
        </div>

        {messages.map((msg) => {
          const isMe = msg.senderId === 'me' || msg.senderId === currentUser?.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group select-text`}
              onContextMenu={(e) => {
                e.preventDefault();
                setSelectedMessage(msg);
              }}
            >
              <div
                className={`relative max-w-[85%] sm:max-w-md rounded-2xl px-3 py-1.5 shadow-sm text-sm transition-all ${
                  isMe
                    ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 rounded-tr-none'
                    : 'bg-white dark:bg-[#202c33] text-slate-900 dark:text-slate-100 rounded-tl-none'
                }`}
              >
                {/* Quoted Message preview if replied */}
                {msg.replyToMessage && (
                  <div
                    className={`mb-1.5 p-2 rounded-lg border-l-4 text-xs ${
                      isMe
                        ? 'bg-emerald-100/60 dark:bg-emerald-950/40 border-[#00a884]'
                        : 'bg-slate-100 dark:bg-slate-800 border-emerald-500'
                    }`}
                  >
                    <span className="font-bold text-[#008069] dark:text-[#00a884] block">
                      {msg.replyToMessage.senderName}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 line-clamp-1">
                      {msg.replyToMessage.text || 'Media attachment'}
                    </span>
                  </div>
                )}

                {/* Content according to type */}
                {msg.isDeleted ? (
                  <p className="italic text-slate-400 dark:text-slate-500 text-xs py-1">
                    🚫 This message was deleted
                  </p>
                ) : (
                  <>
                    {/* PHOTO */}
                    {msg.type === 'image' && (
                      <div className="mb-1 rounded-xl overflow-hidden cursor-pointer">
                        <img
                          src={msg.mediaUrl}
                          alt="Attachment"
                          referrerPolicy="no-referrer"
                          onClick={() => setPreviewImage(msg.mediaUrl || null)}
                          className="max-h-72 w-full object-cover rounded-xl hover:opacity-95 transition-opacity"
                        />
                      </div>
                    )}

                    {/* VIDEO */}
                    {msg.type === 'video' && (
                      <div className="mb-1 rounded-xl overflow-hidden">
                        <video src={msg.mediaUrl} controls className="max-h-72 w-full rounded-xl" />
                      </div>
                    )}

                    {/* AUDIO / VOICE NOTE */}
                    {msg.type === 'audio' && (
                      <div className="flex items-center gap-3 py-1 min-w-[200px]">
                        <button
                          onClick={() => togglePlayAudio(msg.id)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            isMe ? 'bg-[#00a884] text-white' : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {playingAudioId === msg.id ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
                        </button>
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="flex items-center gap-1 h-5">
                            {[12, 24, 18, 28, 14, 20, 26, 16, 22, 10, 18, 24].map((h, i) => (
                              <span
                                key={i}
                                style={{ height: `${h}px` }}
                                className={`w-1 rounded-full transition-all duration-150 ${
                                  playingAudioId === msg.id && i % 3 === 0
                                    ? 'bg-emerald-500 animate-pulse'
                                    : 'bg-slate-400/60 dark:bg-slate-500'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                            0:{msg.mediaMeta?.duration?.toString().padStart(2, '0') || '04'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* DOCUMENT */}
                    {msg.type === 'document' && (
                      <div className="flex items-center gap-3 p-2 bg-black/5 dark:bg-white/5 rounded-xl mb-1">
                        <FileText className="w-8 h-8 text-rose-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate">{msg.mediaMeta?.fileName || 'Document.pdf'}</p>
                          <p className="text-[10px] text-slate-500">{msg.mediaMeta?.fileSize || '142 KB'}</p>
                        </div>
                        <a
                          href={msg.mediaUrl || '#'}
                          download={msg.mediaMeta?.fileName || 'document'}
                          className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    )}

                    {/* GIF */}
                    {msg.type === 'gif' && (
                      <div className="mb-1 rounded-xl overflow-hidden relative cursor-pointer" onClick={() => setPreviewImage(msg.mediaUrl || null)}>
                        <img src={msg.mediaUrl} alt="GIF" className="max-h-60 w-full object-cover rounded-xl" />
                        <span className="absolute bottom-2 left-2 bg-black/75 text-white font-bold text-[9px] px-1.5 py-0.5 rounded tracking-wider uppercase">
                          GIF
                        </span>
                      </div>
                    )}

                    {/* STICKER */}
                    {msg.type === 'sticker' && (
                      <div className="py-1">
                        <img src={msg.mediaUrl} alt="Sticker" className="w-28 h-28 object-contain" />
                      </div>
                    )}

                    {/* TEXT */}
                    {msg.text && (
                      <p className="leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </>
                )}

                {/* Footer: timestamp & read receipt ticks */}
                <div className="flex items-center justify-end gap-1 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 select-none">
                  {msg.isEncrypted && (
                    <span title="Signal Protocol AES-256-GCM Encrypted">
                      <Lock className="w-2.5 h-2.5 text-slate-400/80 mr-0.5" />
                    </span>
                  )}
                  <span className="tabular-nums">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && !msg.isDeleted && (
                    <span>
                      {msg.status === 'read' ? (
                        <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                      ) : msg.status === 'delivered' ? (
                        <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick action buttons on message hover/tap */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-slate-500 mt-0.5 px-1">
                <button
                  onClick={() => setReplyingTo(msg)}
                  className="p-1 hover:text-emerald-600 rounded"
                  title="Reply"
                >
                  <Reply className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onForwardMessage(msg)}
                  className="p-1 hover:text-emerald-600 rounded"
                  title="Forward"
                >
                  <Forward className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setSelectedMessage(msg)}
                  className="p-1 hover:text-slate-800 rounded"
                  title="Options"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. REPLYING BANNER */}
      {replyingTo && (
        <div className="bg-slate-200 dark:bg-[#1f2c34] px-4 py-2 flex items-center justify-between border-l-4 border-emerald-500 animate-in slide-in-from-bottom duration-150">
          <div className="min-w-0">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">
              Replying to {replyingTo.senderId === 'me' ? 'yourself' : conversation.title}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-300 truncate block">
              {replyingTo.text || 'Media attachment'}
            </span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 5. ATTACHMENT MODAL SHEET */}
      {showAttachmentMenu && (
        <div className="p-3 bg-white dark:bg-[#202c33] border-t border-slate-200 dark:border-slate-800 grid grid-cols-4 gap-2 text-center animate-in slide-in-from-bottom duration-150">
          <label className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#182229] cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow">
              <ImageIcon className="w-5 h-5" />
            </div>
            <span className="text-xs text-slate-700 dark:text-slate-200">Gallery</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 'image')}
            />
          </label>

          <label className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#182229] cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center shadow">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-xs text-slate-700 dark:text-slate-200">Camera</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 'image')}
            />
          </label>

          <label className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#182229] cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center shadow">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs text-slate-700 dark:text-slate-200">Document</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 'document')}
            />
          </label>

          <label className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#182229] cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shadow">
              <Video className="w-5 h-5" />
            </div>
            <span className="text-xs text-slate-700 dark:text-slate-200">Video</span>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, 'video')}
            />
          </label>
        </div>
      )}

      {/* 6. RICH EMOJIS, STICKERS & GIFS PICKER */}
      {showEmojiPicker && (
        <div className="bg-white dark:bg-[#202c33] border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom duration-150">
          {/* Picker Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setPickerTab('emojis')}
              className={`flex-1 py-2 text-center transition-colors border-b-2 ${
                pickerTab === 'emojis'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'border-transparent text-slate-400'
              }`}
            >
              Emojis
            </button>
            <button
              onClick={() => setPickerTab('stickers')}
              className={`flex-1 py-2 text-center transition-colors border-b-2 ${
                pickerTab === 'stickers'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'border-transparent text-slate-400'
              }`}
            >
              Stickers
            </button>
            <button
              onClick={() => setPickerTab('gifs')}
              className={`flex-1 py-2 text-center transition-colors border-b-2 ${
                pickerTab === 'gifs'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'border-transparent text-slate-400'
              }`}
            >
              GIFs
            </button>
          </div>

          {/* Emojis View */}
          {pickerTab === 'emojis' && (
            <div className="p-3 grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
              {quickEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setInputText((t) => t + emoji);
                  }}
                  className="text-2xl p-1.5 hover:scale-125 transition-transform flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Stickers View */}
          {pickerTab === 'stickers' && (
            <div className="p-3 grid grid-cols-4 gap-3 max-h-48 overflow-y-auto">
              {SAMPLE_STICKERS.map((stk) => (
                <button
                  key={stk.id}
                  onClick={() => handleSendMessage('sticker', stk.url)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-transform active:scale-90 flex flex-col items-center gap-1 group"
                >
                  <img src={stk.url} alt={stk.name} className="w-14 h-14 object-contain group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] text-slate-500 truncate max-w-full">{stk.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* GIFs View */}
          {pickerTab === 'gifs' && (
            <div className="p-3 grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {SAMPLE_GIFS.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => handleSendMessage('gif', gif.url)}
                  className="relative rounded-xl overflow-hidden group shadow-sm active:scale-95 transition-transform h-24"
                >
                  <img src={gif.url} alt={gif.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent text-white text-[10px] p-1 font-semibold truncate text-left">
                    {gif.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. INPUT BAR / SUBSCRIPTION LOCK */}
      {!hasMessagingAccess ? (
        <div className="p-3 bg-amber-50 dark:bg-[#182229] border-t border-amber-200 dark:border-amber-900/40 flex items-center justify-between gap-3 shadow-md animate-in slide-in-from-bottom duration-150">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                Messaging Locked · Subscription Required
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Active plan required to send text, audio notes, media, GIFs & stickers.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSubscriptions}
            className="px-3.5 py-2 bg-[#00a884] hover:bg-[#008f70] text-white text-xs font-bold rounded-xl shadow-md whitespace-nowrap active:scale-95 transition-all"
          >
            ⚡ Subscribe via Paystack
          </button>
        </div>
      ) : (
        <div className="p-2 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center gap-2">
          {isRecordingVoice ? (
            <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-full px-4 py-2.5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-semibold text-rose-500">
                  Recording 0:{recordingDuration.toString().padStart(2, '0')}
                </span>
              </div>
              <button
                onClick={cancelRecording}
                className="text-xs font-semibold text-slate-500 hover:text-rose-500"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-2xl px-3 py-2 flex items-center gap-2 shadow-sm">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                title="Emojis, Stickers, GIFs"
              >
                <Smile className="w-5 h-5" />
              </button>

              <textarea
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage('text');
                  }
                }}
                placeholder="Message"
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none max-h-24 py-1"
              />

              <button
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                title="Attach"
              >
                <Paperclip className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Primary Action Button (Send or Record Voice) */}
          {inputText.trim() ? (
            <button
              onClick={() => handleSendMessage('text')}
              className="w-11 h-11 rounded-full bg-[#00a884] text-white flex items-center justify-center hover:bg-[#008f70] active:scale-95 shadow-md transition-all shrink-0"
              title="Send"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          ) : isRecordingVoice ? (
            <button
              onClick={stopAndSendRecording}
              className="w-11 h-11 rounded-full bg-rose-500 text-white flex items-center justify-center active:scale-95 shadow-md transition-all shrink-0 animate-pulse"
              title="Stop & Send"
            >
              <Square className="w-5 h-5 fill-current" />
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="w-11 h-11 rounded-full bg-[#00a884] text-white flex items-center justify-center hover:bg-[#008f70] active:scale-95 shadow-md transition-all shrink-0"
              title="Record voice note"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* 8. MESSAGE CONTEXT MENU MODAL */}
      {selectedMessage && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setSelectedMessage(null)}
        >
          <div
            className="bg-white dark:bg-[#233138] rounded-2xl w-full max-w-xs shadow-2xl p-2 divide-y divide-slate-100 dark:divide-slate-700 text-sm text-slate-800 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-1">
              <button
                onClick={() => {
                  setReplyingTo(selectedMessage);
                  setSelectedMessage(null);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-[#182229] flex items-center gap-3 rounded-lg"
              >
                <Reply className="w-4 h-4 text-emerald-500" />
                <span>Reply</span>
              </button>
              <button
                onClick={() => {
                  onForwardMessage(selectedMessage);
                  setSelectedMessage(null);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-[#182229] flex items-center gap-3 rounded-lg"
              >
                <Forward className="w-4 h-4 text-emerald-500" />
                <span>Forward</span>
              </button>
              {selectedMessage.text && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedMessage.text || '');
                    setSelectedMessage(null);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-[#182229] flex items-center gap-3 rounded-lg"
                >
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copy text</span>
                </button>
              )}
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  chatStore.deleteMessage(conversation.id, selectedMessage.id, false);
                  setSelectedMessage(null);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-3 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete for me</span>
              </button>
              {(selectedMessage.senderId === 'me' || selectedMessage.senderId === currentUser?.id) && (
                <button
                  onClick={() => {
                    chatStore.deleteMessage(conversation.id, selectedMessage.id, true);
                    setSelectedMessage(null);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-3 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete for everyone</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 9. IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            referrerPolicy="no-referrer"
            className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
