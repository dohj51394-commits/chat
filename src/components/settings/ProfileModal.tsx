import React, { useState } from 'react';
import { ArrowLeft, Camera, Check, User, Phone, HelpCircle } from 'lucide-react';
import { User as UserType } from '../../types';
import { chatStore } from '../../services/store';

interface ProfileModalProps {
  currentUser: UserType | null;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ currentUser, onClose }) => {
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop',
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    chatStore.updateProfile({
      fullName: fullName.trim(),
      username: username.trim(),
      bio: bio.trim(),
      avatarUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-[#0b141a] flex flex-col animate-in slide-in-from-right duration-200 select-none">
      <header className="bg-[#008069] dark:bg-[#1f2c34] text-white px-3 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/10 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-sm font-semibold">Profile</h2>
        </div>

        <button
          onClick={handleSave}
          className="px-3.5 py-1.5 bg-white text-emerald-800 font-bold rounded-lg text-xs hover:bg-emerald-50 shadow-sm"
        >
          Save
        </button>
      </header>

      <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-6 max-w-md mx-auto w-full">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <img
              src={avatarUrl}
              alt="Profile"
              referrerPolicy="no-referrer"
              className="w-28 h-28 rounded-full object-cover ring-4 ring-[#00a884] shadow-md"
            />
            <button
              type="button"
              onClick={() => {
                const next = sampleAvatars[(sampleAvatars.indexOf(avatarUrl) + 1) % sampleAvatars.length];
                setAvatarUrl(next);
              }}
              className="absolute bottom-1 right-1 p-2 rounded-full bg-[#00a884] text-white shadow hover:scale-105 active:scale-95 transition-transform"
              title="Change photo"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <span className="text-xs text-slate-500">Tap icon to choose new profile photo</span>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <User className="w-5 h-5 text-slate-400 mt-2 shrink-0" />
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                This is not your username. This name will be visible to your Chat contacts.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <span className="w-5 text-center text-slate-400 font-bold mt-2">@</span>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-start gap-4">
            <HelpCircle className="w-5 h-5 text-slate-400 mt-2 shrink-0" />
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">About / Bio</label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Phone className="w-5 h-5 text-slate-400 mt-2 shrink-0" />
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
              <p className="text-sm font-mono font-semibold text-slate-900 dark:text-white pb-1">
                {currentUser?.phoneNumber}
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
