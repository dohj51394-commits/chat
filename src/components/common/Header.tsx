import React, { useState, useRef, useEffect } from 'react';
import { Search, MoreVertical, ShieldCheck, Crown, X, Settings, Users, Sparkles, CreditCard, Shield } from 'lucide-react';
import { User } from '../../types';

interface HeaderProps {
  currentUser: User | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenSettings: () => void;
  onOpenSubscriptions: () => void;
  onOpenAdmin: () => void;
  onNewGroup: () => void;
  onNewCommunity: () => void;
  isSearching: boolean;
  setIsSearching: (s: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  searchQuery,
  onSearchChange,
  onOpenSettings,
  onOpenSubscriptions,
  onOpenAdmin,
  onNewGroup,
  onNewCommunity,
  isSearching,
  setIsSearching,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSearching && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearching]);

  return (
    <header className="sticky top-0 z-30 bg-[#008069] dark:bg-[#1f2c34] text-white shadow-sm transition-colors duration-200">
      <div className="flex items-center justify-between px-4 h-14">
        {isSearching ? (
          <div className="flex items-center w-full gap-2 animate-in fade-in duration-150">
            <button
              onClick={() => {
                setIsSearching(false);
                onSearchChange('');
              }}
              className="p-1 rounded-full hover:bg-black/10 active:scale-95 transition-all text-white"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search chats, contacts, numbers..."
              className="w-full bg-transparent text-white placeholder-white/70 text-sm focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="p-1 text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Brand Title Zone */}
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white select-none">
                Chat
              </span>
              {currentUser?.role === 'admin' && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Admin
                </span>
              )}
            </div>

            {/* Actions Zone */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsSearching(true)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/10 active:scale-95 transition-all text-white"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              <button
                onClick={onOpenSubscriptions}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/10 active:scale-95 transition-all text-white relative"
                aria-label="Subscriptions"
                title="Subscriptions & Plans"
              >
                <CreditCard className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              </button>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/10 active:scale-95 transition-all text-white"
                  aria-label="Menu"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-11 w-56 bg-white dark:bg-[#233138] rounded-xl shadow-xl border border-slate-200 dark:border-slate-700/60 py-1.5 z-50 text-slate-800 dark:text-slate-100 text-sm animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onNewGroup();
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-[#182229] flex items-center gap-3 transition-colors"
                    >
                      <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>New group</span>
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onNewCommunity();
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-[#182229] flex items-center gap-3 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>New community</span>
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenSubscriptions();
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-[#182229] flex items-center gap-3 transition-colors"
                    >
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span>Subscriptions & Plans</span>
                    </button>
                    <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onOpenAdmin();
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-[#182229] flex items-center gap-3 text-amber-600 dark:text-amber-400 font-medium transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Admin Console</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-[#182229] flex items-center gap-3 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>Settings</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
