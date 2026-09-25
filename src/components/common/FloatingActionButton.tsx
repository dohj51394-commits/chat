import React from 'react';
import { MessageSquarePlus, Camera, PenSquare, PhoneCall } from 'lucide-react';
import { MainTabType } from './TabsNav';

interface FloatingActionButtonProps {
  activeTab: MainTabType;
  onNewChat: () => void;
  onNewMediaStatus: () => void;
  onNewTextStatus: () => void;
  onNewCall: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  activeTab,
  onNewChat,
  onNewMediaStatus,
  onNewTextStatus,
  onNewCall,
}) => {
  if (activeTab === 'communities') return null;

  return (
    <div className="fixed bottom-6 right-5 z-20 flex flex-col items-end gap-3 select-none pointer-events-auto">
      {activeTab === 'updates' && (
        <button
          onClick={onNewTextStatus}
          className="w-10 h-10 rounded-full bg-slate-200 dark:bg-[#233138] text-slate-700 dark:text-slate-200 shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          aria-label="New text status"
          title="Text Status"
        >
          <PenSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </button>
      )}

      <button
        onClick={() => {
          if (activeTab === 'chats') onNewChat();
          else if (activeTab === 'updates') onNewMediaStatus();
          else if (activeTab === 'calls') onNewCall();
        }}
        className="w-14 h-14 rounded-2xl bg-[#00a884] hover:bg-[#008f70] text-white shadow-lg shadow-emerald-900/20 flex items-center justify-center active:scale-90 transition-transform"
        aria-label="Action"
      >
        {activeTab === 'chats' && <MessageSquarePlus className="w-6 h-6" />}
        {activeTab === 'updates' && <Camera className="w-6 h-6" />}
        {activeTab === 'calls' && <PhoneCall className="w-6 h-6" />}
      </button>
    </div>
  );
};
