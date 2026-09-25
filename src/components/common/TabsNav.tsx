import React from 'react';
import { MessageSquare, CircleDashed, Users2, Phone } from 'lucide-react';

export type MainTabType = 'chats' | 'updates' | 'communities' | 'calls';

interface TabsNavProps {
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  unreadChatsCount: number;
  unreadUpdatesCount: number;
  missedCallsCount: number;
}

export const TabsNav: React.FC<TabsNavProps> = ({
  activeTab,
  onTabChange,
  unreadChatsCount,
  unreadUpdatesCount,
  missedCallsCount,
}) => {
  const tabs = [
    {
      id: 'chats' as MainTabType,
      label: 'Chats',
      icon: MessageSquare,
      badge: unreadChatsCount > 0 ? unreadChatsCount : null,
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'updates' as MainTabType,
      label: 'Updates',
      icon: CircleDashed,
      badge: unreadUpdatesCount > 0 ? '' : null, // dot badge
      badgeColor: 'bg-emerald-400',
    },
    {
      id: 'communities' as MainTabType,
      label: 'Communities',
      icon: Users2,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'calls' as MainTabType,
      label: 'Calls',
      icon: Phone,
      badge: missedCallsCount > 0 ? missedCallsCount : null,
      badgeColor: 'bg-rose-500 text-white',
    },
  ];

  return (
    <nav className="sticky top-14 z-20 bg-[#008069] dark:bg-[#1f2c34] text-white shadow-sm border-t border-white/10 select-none">
      <div className="grid grid-cols-4 text-center">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative py-3 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium transition-colors ${
                isActive
                  ? 'text-white font-semibold'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 sm:w-4 sm:h-4 ${isActive ? 'scale-105' : ''}`} />
                {tab.badge !== null && tab.badge === '' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#008069] dark:ring-[#1f2c34]" />
                )}
              </div>
              <span className="tracking-tight">{tab.label}</span>

              {typeof tab.badge === 'number' && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 h-4 flex items-center justify-center ${tab.badgeColor}`}
                >
                  {tab.badge}
                </span>
              )}

              {/* Active Tab Underline Indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t-full transition-all duration-200" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
