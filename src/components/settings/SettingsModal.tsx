import React, { useState } from 'react';
import {
  ArrowLeft,
  Moon,
  Sun,
  Lock,
  Database,
  Crown,
  Bell,
  HardDriveDownload,
  Upload,
  UserX,
  LogOut,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { User } from '../../types';
import { chatStore } from '../../services/store';
import { pushService } from '../../services/fcm';

interface SettingsModalProps {
  currentUser: User | null;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenProfile: () => void;
  onOpenSecurity: () => void;
  onOpenSubscriptions: () => void;
  onOpenSupabaseConfig: () => void;
  onLogout: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentUser,
  isDark,
  onToggleTheme,
  onOpenProfile,
  onOpenSecurity,
  onOpenSubscriptions,
  onOpenSupabaseConfig,
  onLogout,
  onClose,
}) => {
  const [readReceipts, setReadReceipts] = useState(currentUser?.privacy?.readReceipts ?? true);
  const [conversationTones, setConversationTones] = useState(true);
  const [notificationsGranted, setNotificationsGranted] = useState(pushService.isPermissionGranted());
  const [settingsToast, setSettingsToast] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const showToast = (msg: string) => {
    setSettingsToast(msg);
    setTimeout(() => setSettingsToast(null), 3000);
  };

  const otherUsers = chatStore.registeredUsers.filter((u) => u.id !== currentUser?.id);

  const handleExportBackup = () => {
    const json = chatStore.exportBackupData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup JSON downloaded successfully.');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = chatStore.importBackupData(content);
      if (success) {
        showToast('Chat backup restored successfully!');
      } else {
        showToast('Failed to parse chat backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleEnablePush = async () => {
    const granted = await pushService.requestPermission();
    setNotificationsGranted(granted);
    if (granted) {
      showToast('Push notifications enabled for Chat.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-[#0b141a] flex flex-col animate-in slide-in-from-right duration-200 select-none">
      <header className="bg-[#008069] dark:bg-[#1f2c34] text-white px-3 py-2 flex items-center gap-3 shadow-sm">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-black/10 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-sm font-semibold">Settings</h2>
      </header>

      {settingsToast && (
        <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 text-center shadow-md animate-in slide-in-from-top duration-150">
          {settingsToast}
        </div>
      )}

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pb-12">
        {/* Profile Card Summary */}
        <div
          onClick={onOpenProfile}
          className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#182229] cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-4 min-w-0">
            <img
              src={currentUser?.avatarUrl}
              alt={currentUser?.fullName}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-500/20"
            />
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                {currentUser?.fullName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {currentUser?.bio}
              </p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {currentUser?.phoneNumber}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
        </div>

        {/* 1. Theme Toggle */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#202c33] flex items-center justify-center text-slate-600 dark:text-slate-300">
              {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Appearance
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isDark ? 'Dark mode enabled' : 'Light mode enabled'}
              </p>
            </div>
          </div>

          <button
            onClick={onToggleTheme}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              isDark ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
          </button>
        </div>

        {/* 2. Subscriptions & Paystack */}
        <div
          onClick={onOpenSubscriptions}
          className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#182229] cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Subscriptions & Payments
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Messaging Pro, Calling Plan, Paystack receipts
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
        </div>

        {/* 3. Security & Signal Protocol */}
        <div
          onClick={onOpenSecurity}
          className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#182229] cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Security & Encryption
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                60-digit safety numbers, active device sessions
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
        </div>

        {/* 4. Privacy & Read Receipts */}
        <div className="p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Privacy & Read Receipts
          </h4>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200 block">
                Read Receipts
              </span>
              <span className="text-xs text-slate-400">
                If turned off, you won't send or receive read receipts (blue ticks).
              </span>
            </div>
            <button
              onClick={() => {
                const next = !readReceipts;
                setReadReceipts(next);
                chatStore.updateProfile({
                  privacy: { ...(currentUser?.privacy || { lastSeen: 'everyone', profilePhoto: 'everyone', status: 'everyone', readReceipts: true }), readReceipts: next },
                });
              }}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                readReceipts ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
            </button>
          </div>
        </div>

        {/* 5. Notifications & Push FCM */}
        <div className="p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Notifications & Sounds
          </h4>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200 block">
                Conversation Tones
              </span>
              <span className="text-xs text-slate-400">Play sounds for incoming and outgoing messages</span>
            </div>
            <button
              onClick={() => setConversationTones(!conversationTones)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                conversationTones ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200 block">
                Push Notifications
              </span>
              <span className="text-xs text-slate-400">
                {notificationsGranted ? 'Enabled (FCM Token active)' : 'Notifications disabled'}
              </span>
            </div>
            {!notificationsGranted && (
              <button
                onClick={handleEnablePush}
                className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Enable
              </button>
            )}
          </div>
        </div>

        {/* 6. Chat Backup & Restore */}
        <div className="p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Chats Backup & Data
          </h4>
          <div className="flex gap-2">
            <button
              onClick={handleExportBackup}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-100 dark:bg-[#1f2c34] hover:bg-slate-200 dark:hover:bg-[#283842] rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors"
            >
              <HardDriveDownload className="w-4 h-4 text-emerald-500" />
              <span>Export JSON Backup</span>
            </button>

            <label className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-100 dark:bg-[#1f2c34] hover:bg-slate-200 dark:hover:bg-[#283842] rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-emerald-500" />
              <span>Restore Backup</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportBackup}
              />
            </label>
          </div>
        </div>

        {/* 7. Backend & Supabase Config */}
        <div
          onClick={onOpenSupabaseConfig}
          className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#182229] cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Supabase & API Credentials
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connect your live Supabase project & Paystack keys
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
        </div>

        {/* 8. Account Switcher (Live Multi-User Switching) */}
        {otherUsers.length > 0 && (
          <div className="p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Switch Registered Account ({otherUsers.length})
            </h4>
            <div className="space-y-2">
              {otherUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#182229]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={u.avatarUrl} alt={u.fullName} className="w-8 h-8 rounded-full object-cover" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{u.fullName}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{u.phoneNumber}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      chatStore.switchAccount(u.id);
                      showToast(`Switched account to ${u.fullName}`);
                      setTimeout(() => onClose(), 800);
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs active:scale-95 transition-all"
                  >
                    Switch
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. Log out & Delete Account */}
        <div className="p-4 space-y-3">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 text-left text-rose-600 dark:text-rose-400 text-sm font-semibold py-2 hover:opacity-80"
          >
            <LogOut className="w-5 h-5" />
            <span>Log out</span>
          </button>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-3 text-left text-slate-400 text-xs py-2 hover:text-rose-500"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete my account</span>
            </button>
          ) : (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl space-y-2">
              <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                Are you sure? This will remove your device session and clear active subscriptions.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    chatStore.logout();
                    onClose();
                  }}
                  className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
                >
                  Yes, delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
