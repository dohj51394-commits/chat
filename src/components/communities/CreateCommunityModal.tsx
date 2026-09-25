import React, { useState } from 'react';
import { ArrowLeft, Camera, Sparkles, Check } from 'lucide-react';
import { Community } from '../../types';
import { chatStore } from '../../services/store';

interface CreateCommunityModalProps {
  onCommunityCreated: (comm: Community) => void;
  onClose: () => void;
}

export const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({
  onCommunityCreated,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const comm = chatStore.createCommunity(name.trim(), description.trim(), avatarUrl);
    onCommunityCreated(comm);
  };

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=150&auto=format&fit=crop',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-[#0b141a] flex flex-col animate-in slide-in-from-right duration-200">
      <header className="bg-[#008069] dark:bg-[#1f2c34] text-white px-3 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/10 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-sm font-semibold">New Community</h2>
        </div>

        {name.trim() && (
          <button
            onClick={handleSubmit}
            className="px-3.5 py-1.5 bg-white text-emerald-800 font-bold rounded-lg text-xs hover:bg-emerald-50 shadow-sm"
          >
            Create
          </button>
        )}
      </header>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 max-w-lg mx-auto w-full">
        {/* Community icon selector */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <img
              src={avatarUrl}
              alt="Community avatar"
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-emerald-500 shadow-md"
            />
            <button
              type="button"
              onClick={() => {
                const next = sampleAvatars[(sampleAvatars.indexOf(avatarUrl) + 1) % sampleAvatars.length];
                setAvatarUrl(next);
              }}
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#00a884] text-white shadow"
              title="Next avatar"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <span className="text-xs text-slate-500">Tap icon to change community logo</span>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Community Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Flutter & Android Engineers"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#202c33] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Community Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what this community is for and the group guidelines..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#202c33] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Automatic Groups Creation
          </p>
          <p>
            An official announcement channel and a general discussions group will be created automatically. You can add more topic groups anytime.
          </p>
        </div>
      </form>
    </div>
  );
};
