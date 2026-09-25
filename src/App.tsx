/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { TabsNav, MainTabType } from './components/common/TabsNav';
import { FloatingActionButton } from './components/common/FloatingActionButton';
import { ChatsList } from './components/chats/ChatsList';
import { ChatRoom } from './components/chats/ChatRoom';
import { NewChatModal } from './components/chats/NewChatModal';
import { NewGroupModal } from './components/chats/NewGroupModal';
import { ForwardModal } from './components/chats/ForwardModal';
import { UpdatesTab } from './components/updates/UpdatesTab';
import { StatusViewerModal } from './components/updates/StatusViewerModal';
import { CreateStatusModal } from './components/updates/CreateStatusModal';
import { CommunitiesTab } from './components/communities/CommunitiesTab';
import { CreateCommunityModal } from './components/communities/CreateCommunityModal';
import { CallsTab } from './components/calls/CallsTab';
import { ActiveCallOverlay } from './components/calls/ActiveCallOverlay';
import { NewCallModal } from './components/calls/NewCallModal';
import { SubscriptionModal } from './components/subscription/SubscriptionModal';
import { AdminPanelModal } from './components/admin/AdminPanelModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { ProfileModal } from './components/settings/ProfileModal';
import { SecurityModal } from './components/settings/SecurityModal';
import { SupabaseConfigModal } from './components/settings/SupabaseConfigModal';
import { ReportModal } from './components/common/ReportModal';
import { AuthModal } from './components/auth/AuthModal';

import {
  User,
  Conversation,
  StatusUpdate,
  Community,
  CallLog,
  Message,
  CallType,
  ActiveCallState,
} from './types';
import { chatStore } from './services/store';

export default function App() {
  // Global Store State
  const [currentUser, setCurrentUser] = useState<User | null>(chatStore.currentUser);
  const [conversations, setConversations] = useState<Conversation[]>([...chatStore.conversations]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([...chatStore.callLogs]);
  const [statuses, setStatuses] = useState<StatusUpdate[]>([...chatStore.statuses]);
  const [communities, setCommunities] = useState<Community[]>([...chatStore.communities]);
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(chatStore.activeCall);

  // App Navigation & Modals State
  const [activeTab, setActiveTab] = useState<MainTabType>('chats');
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Modals
  const [viewingStatus, setViewingStatus] = useState<StatusUpdate | null>(null);
  const [createStatusMode, setCreateStatusMode] = useState<'text' | 'media' | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showNewCommunity, setShowNewCommunity] = useState(false);
  const [showNewCall, setShowNewCall] = useState(false);
  const [forwardingMsg, setForwardingMsg] = useState<Message | null>(null);
  const [reportingUserId, setReportingUserId] = useState<string | null>(null);

  // Settings & System Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSupabaseConfig, setShowSupabaseConfig] = useState(false);
  const [showAuth, setShowAuth] = useState(!chatStore.currentUser);

  // Dark Mode Theme
  const [isDark, setIsDark] = useState(() => {
    return (
      localStorage.getItem('chat_theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('chat_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('chat_theme', 'light');
    }
  }, [isDark]);

  // Synchronize store updates
  useEffect(() => {
    const unsub = chatStore.subscribe(() => {
      setCurrentUser(chatStore.currentUser ? { ...chatStore.currentUser } : null);
      setConversations([...chatStore.conversations]);
      setCallLogs([...chatStore.callLogs]);
      setStatuses([...chatStore.statuses]);
      setCommunities([...chatStore.communities]);
      setActiveCall(chatStore.activeCall ? { ...chatStore.activeCall } : null);

      if (activeConversation) {
        const updated = chatStore.conversations.find((c) => c.id === activeConversation.id);
        if (updated) setActiveConversation({ ...updated });
      }
    });

    return () => unsub();
  }, [activeConversation]);

  // Badges counts
  const unreadChatsCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const unviewedUpdatesCount = statuses.filter(
    (s) => !s.viewers.some((v) => v.viewerId === currentUser?.id)
  ).length;
  const missedCallsCount = callLogs.filter(
    (c) => c.status === 'missed' || c.direction === 'missed'
  ).length;

  // Handlers
  const handleSelectContactForChat = (user: User) => {
    const conv = chatStore.getOrCreateConversation(user);
    setShowNewChat(false);
    setActiveConversation(conv);
  };

  const handleStartCall = (targetUser: User, type: CallType) => {
    setShowNewCall(false);
    chatStore.startCall(targetUser, type);
  };

  const handleReplyToStatus = (authorUserId: string, text: string) => {
    const user = chatStore.contacts.find((c) => c.id === authorUserId);
    if (!user) return;
    const conv = chatStore.getOrCreateConversation(user);
    chatStore.sendMessage(conv.id, { text });
    setActiveConversation(conv);
  };

  const handleSelectCommunityGroup = (groupId: string, title: string) => {
    let conv = chatStore.conversations.find((c) => c.id === groupId);
    if (!conv) {
      conv = {
        id: groupId,
        type: 'community_announcement',
        title,
        participants: chatStore.contacts,
        unreadCount: 0,
        isPinned: false,
        isArchived: false,
        isMuted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      chatStore.conversations.unshift(conv);
      chatStore.messages[groupId] = [];
    }
    setActiveConversation(conv);
  };

  return (
    <div className="flex justify-center bg-slate-200 dark:bg-black min-h-screen text-slate-900 dark:text-slate-100">
      {/* Mobile-Targeted Canvas Frame (375px-480px on desktop or fluid full width on mobile devices) */}
      <div className="w-full max-w-md bg-white dark:bg-[#0b141a] min-h-screen flex flex-col relative shadow-2xl overflow-hidden border-x border-slate-200 dark:border-slate-800">
        {/* Top Header */}
        <Header
          currentUser={currentUser}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenSettings={() => setShowSettings(true)}
          onOpenSubscriptions={() => setShowSubscriptions(true)}
          onOpenAdmin={() => setShowAdmin(true)}
          onNewGroup={() => setShowNewGroup(true)}
          onNewCommunity={() => setShowNewCommunity(true)}
          isSearching={isSearching}
          setIsSearching={setIsSearching}
        />

        {/* 4 Main Tabs Nav */}
        <TabsNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSearchQuery('');
            setIsSearching(false);
          }}
          unreadChatsCount={unreadChatsCount}
          unreadUpdatesCount={unviewedUpdatesCount}
          missedCallsCount={missedCallsCount}
        />

        {/* Active Tab View */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === 'chats' && (
            <ChatsList
              conversations={conversations}
              searchQuery={searchQuery}
              onSelectConversation={(conv) => setActiveConversation(conv)}
              onTogglePin={(id) => chatStore.togglePinConversation(id)}
              onToggleArchive={(id) => chatStore.toggleArchiveConversation(id)}
              onDeleteConversation={(id) => {
                chatStore.conversations = chatStore.conversations.filter((c) => c.id !== id);
                chatStore.notify();
              }}
              showArchived={showArchived}
              setShowArchived={setShowArchived}
            />
          )}

          {activeTab === 'updates' && (
            <UpdatesTab
              statuses={statuses}
              currentUser={currentUser}
              onViewStatus={(status) => setViewingStatus(status)}
              onNewTextStatus={() => setCreateStatusMode('text')}
              onNewMediaStatus={() => setCreateStatusMode('media')}
            />
          )}

          {activeTab === 'communities' && (
            <CommunitiesTab
              communities={communities}
              onSelectCommunityGroup={handleSelectCommunityGroup}
              onNewCommunity={() => setShowNewCommunity(true)}
            />
          )}

          {activeTab === 'calls' && (
            <CallsTab
              callLogs={callLogs}
              onStartCall={handleStartCall}
              onNewCall={() => setShowNewCall(true)}
            />
          )}
        </main>

        {/* Floating Action Button */}
        <FloatingActionButton
          activeTab={activeTab}
          onNewChat={() => setShowNewChat(true)}
          onNewMediaStatus={() => setCreateStatusMode('media')}
          onNewTextStatus={() => setCreateStatusMode('text')}
          onNewCall={() => setShowNewCall(true)}
        />

        {/* --- MODALS & OVERLAYS --- */}

        {/* 1. Active Chat Room */}
        {activeConversation && (
          <ChatRoom
            conversation={activeConversation}
            currentUser={currentUser}
            onBack={() => setActiveConversation(null)}
            onStartCall={handleStartCall}
            onForwardMessage={(msg) => setForwardingMsg(msg)}
            onOpenSubscriptions={() => setShowSubscriptions(true)}
            onReportUser={(userId) => setReportingUserId(userId)}
            onOpenSecurity={() => setShowSecurity(true)}
          />
        )}

        {/* 2. Status Viewer Modal */}
        {viewingStatus && (
          <StatusViewerModal
            status={viewingStatus}
            currentUser={currentUser}
            onClose={() => setViewingStatus(null)}
            onReply={handleReplyToStatus}
          />
        )}

        {/* 3. Create Status Modal */}
        {createStatusMode && (
          <CreateStatusModal
            initialMode={createStatusMode}
            onClose={() => setCreateStatusMode(null)}
          />
        )}

        {/* 4. New Chat Modal */}
        {showNewChat && (
          <NewChatModal
            contacts={chatStore.contacts}
            onSelectUser={handleSelectContactForChat}
            onClose={() => setShowNewChat(false)}
            onNewGroup={() => {
              setShowNewChat(false);
              setShowNewGroup(true);
            }}
            onNewCommunity={() => {
              setShowNewChat(false);
              setShowNewCommunity(true);
            }}
          />
        )}

        {/* 5. New Group Modal */}
        {showNewGroup && (
          <NewGroupModal
            contacts={chatStore.contacts}
            onGroupCreated={(group) => {
              setShowNewGroup(false);
              setActiveConversation(group);
            }}
            onClose={() => setShowNewGroup(false)}
          />
        )}

        {/* 6. Forward Message Modal */}
        {forwardingMsg && (
          <ForwardModal
            message={forwardingMsg}
            conversations={conversations}
            onForward={(targetId, msg) => {
              chatStore.forwardMessage(targetId, msg);
              setForwardingMsg(null);
            }}
            onClose={() => setForwardingMsg(null)}
          />
        )}

        {/* 7. New Call Contacts Modal */}
        {showNewCall && (
          <NewCallModal
            contacts={chatStore.contacts}
            onStartCall={handleStartCall}
            onClose={() => setShowNewCall(false)}
          />
        )}

        {/* 8. Active Voice & Video Call Overlay */}
        {activeCall && (
          <ActiveCallOverlay
            call={activeCall}
            onEndCall={() => chatStore.endCall()}
            onAcceptCall={() => chatStore.acceptCall()}
          />
        )}

        {/* 9. Create Community Modal */}
        {showNewCommunity && (
          <CreateCommunityModal
            onCommunityCreated={() => setShowNewCommunity(false)}
            onClose={() => setShowNewCommunity(false)}
          />
        )}

        {/* 10. Subscriptions & Paystack Modal */}
        {showSubscriptions && (
          <SubscriptionModal
            currentUser={currentUser}
            onClose={() => setShowSubscriptions(false)}
          />
        )}

        {/* 11. Admin Panel Modal */}
        {showAdmin && <AdminPanelModal onClose={() => setShowAdmin(false)} />}

        {/* 12. Settings Modal */}
        {showSettings && (
          <SettingsModal
            currentUser={currentUser}
            isDark={isDark}
            onToggleTheme={() => setIsDark(!isDark)}
            onOpenProfile={() => {
              setShowSettings(false);
              setShowProfile(true);
            }}
            onOpenSecurity={() => {
              setShowSettings(false);
              setShowSecurity(true);
            }}
            onOpenSubscriptions={() => {
              setShowSettings(false);
              setShowSubscriptions(true);
            }}
            onOpenSupabaseConfig={() => {
              setShowSettings(false);
              setShowSupabaseConfig(true);
            }}
            onLogout={() => {
              chatStore.logout();
              setShowSettings(false);
              setShowAuth(true);
            }}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* 13. Profile Modal */}
        {showProfile && (
          <ProfileModal
            currentUser={currentUser}
            onClose={() => setShowProfile(false)}
          />
        )}

        {/* 14. Security Modal */}
        {showSecurity && (
          <SecurityModal
            currentUser={currentUser}
            targetUser={activeConversation?.participants[0] || null}
            onClose={() => setShowSecurity(false)}
          />
        )}

        {/* 15. Supabase & API Config Modal */}
        {showSupabaseConfig && (
          <SupabaseConfigModal onClose={() => setShowSupabaseConfig(false)} />
        )}

        {/* 16. Report User Modal */}
        {reportingUserId && (
          <ReportModal
            reportedUserId={reportingUserId}
            onClose={() => setReportingUserId(null)}
          />
        )}

        {/* 17. Authentication & OTP Modal */}
        {showAuth && (
          <AuthModal
            onClose={() => setShowAuth(false)}
            onSuccess={() => setShowAuth(false)}
          />
        )}
      </div>
    </div>
  );
}
