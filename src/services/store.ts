import {
  User,
  Conversation,
  Message,
  StatusUpdate,
  Community,
  CallLog,
  ActiveCallState,
  Subscription,
  PricingPlan,
  Transaction,
  UserReport,
  MessageType,
  CallType,
  PlanType,
} from '../types';
import { sounds } from '../utils/audio';
import { pushService } from './fcm';
import { signalCrypto } from './crypto/signalProtocol';

// Production Pricing Plans (Admin configurable)
export const DEFAULT_PRICING_PLANS: PricingPlan[] = [
  {
    id: 'plan_msg',
    name: 'Messaging Plan',
    planType: 'messaging',
    price: 1500,
    currency: 'NGN',
    durationDays: 30,
    features: [
      'Unlimited encrypted text messaging',
      'High-resolution photos & video sharing',
      'Voice notes & waveform playback',
      'Document, PDF & file transfer',
      'GIFs, stickers & rich emojis',
      'Group chats & Community discussions',
      'Delivery ticks & read receipts',
    ],
  },
  {
    id: 'plan_call',
    name: 'Voice and Video Calling Plan',
    planType: 'calling',
    price: 2500,
    currency: 'NGN',
    durationDays: 30,
    popular: true,
    features: [
      'Unlimited HD voice calls',
      'Crystal clear video calls',
      'WebRTC low-latency audio/video engine',
      'E2EE Short Authentication String (SAS)',
      'Speaker & Camera mute controls',
      'Full call history & logs tracking',
    ],
  },
  {
    id: 'plan_bundle',
    name: 'All-In-One Ultimate Plan',
    planType: 'all_in_one',
    price: 3500,
    currency: 'NGN',
    durationDays: 30,
    features: [
      'Full Messaging Plan features',
      'Full Voice & Video Calling Plan features',
      'Unlimited group & community creation',
      '24/7 Priority encryption key rotation',
      'Full device session security management',
    ],
  },
];

// Helper to save/load from LocalStorage
const loadLocal = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(`chat_app_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const saveLocal = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(`chat_app_${key}`, JSON.stringify(value));
  } catch {}
};

// Cross-tab real-time communication bus for multi-user testing & live device sync
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('chat_network_bus')
  : null;

class ChatStore {
  // Authentication & Users (No fake users, starts clean or loaded from persistent registered users)
  public currentUser: User | null = loadLocal<User | null>('current_user', null);
  public registeredUsers: User[] = loadLocal<User[]>('registered_users', []);
  public contacts: User[] = loadLocal<User[]>('contacts', []);

  // Real-time Chat Data (No fake conversations, messages, or calls)
  public conversations: Conversation[] = loadLocal<Conversation[]>('conversations', []);
  public messages: Record<string, Message[]> = loadLocal<Record<string, Message[]>>('messages', {});
  public callLogs: CallLog[] = loadLocal<CallLog[]>('call_logs', []);
  public statuses: StatusUpdate[] = loadLocal<StatusUpdate[]>('statuses', []);
  public communities: Community[] = loadLocal<Community[]>('communities', []);

  // Subscriptions & Paystack Transactions
  public subscriptions: Subscription[] = loadLocal<Subscription[]>('subscriptions', []);
  public pricingPlans: PricingPlan[] = loadLocal<PricingPlan[]>('pricing_plans', DEFAULT_PRICING_PLANS);
  public transactions: Transaction[] = loadLocal<Transaction[]>('transactions', []);
  public reports: UserReport[] = loadLocal<UserReport[]>('reports', []);
  public blockedUserIds: string[] = loadLocal<string[]>('blocked_users', []);

  // Active Call State
  public activeCall: ActiveCallState | null = null;

  // Reactivity Listeners
  private listeners: (() => void)[] = [];

  constructor() {
    this.initRealtimeListeners();
  }

  private initRealtimeListeners() {
    if (broadcastChannel) {
      broadcastChannel.onmessage = (event) => {
        const { type, data } = event.data || {};
        if (type === 'NEW_MESSAGE') {
          this.handleIncomingBroadcastMessage(data);
        } else if (type === 'INCOMING_CALL') {
          this.handleIncomingBroadcastCall(data);
        } else if (type === 'CALL_ENDED') {
          this.handleBroadcastCallEnded(data);
        } else if (type === 'CALL_ACCEPTED') {
          this.handleBroadcastCallAccepted(data);
        } else if (type === 'SYNC_DATA') {
          this.reloadAllLocalData();
        }
      };
    }

    // Storage event for fallback cross-tab updates
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key?.startsWith('chat_app_')) {
          this.reloadAllLocalData();
        }
      });
    }
  }

  private reloadAllLocalData() {
    this.currentUser = loadLocal<User | null>('current_user', this.currentUser);
    this.registeredUsers = loadLocal<User[]>('registered_users', []);
    this.contacts = loadLocal<User[]>('contacts', []);
    this.conversations = loadLocal<Conversation[]>('conversations', []);
    this.messages = loadLocal<Record<string, Message[]>>('messages', {});
    this.callLogs = loadLocal<CallLog[]>('call_logs', []);
    this.statuses = loadLocal<StatusUpdate[]>('statuses', []);
    this.communities = loadLocal<Community[]>('communities', []);
    this.subscriptions = loadLocal<Subscription[]>('subscriptions', []);
    this.pricingPlans = loadLocal<PricingPlan[]>('pricing_plans', DEFAULT_PRICING_PLANS);
    this.transactions = loadLocal<Transaction[]>('transactions', []);
    this.notify();
  }

  private handleIncomingBroadcastMessage(msg: Message) {
    if (!this.currentUser) return;
    const convId = msg.conversationId;
    const currentList = this.messages[convId] || [];
    if (currentList.some((m) => m.id === msg.id)) return;

    this.messages[convId] = [...currentList, msg];
    saveLocal('messages', this.messages);

    const conv = this.conversations.find((c) => c.id === convId);
    if (conv) {
      conv.lastMessage = msg;
      conv.updatedAt = msg.createdAt;
      if (msg.senderId !== this.currentUser.id) {
        conv.unreadCount = (conv.unreadCount || 0) + 1;
        sounds.playReceived();
        pushService.showNotification({
          title: conv.title,
          body: msg.text || 'New message attachment',
          icon: conv.avatarUrl,
        });
      }
      saveLocal('conversations', this.conversations);
    }
    this.notify();
  }

  private handleIncomingBroadcastCall(callData: { callId: string; caller: User; receiverId: string; callType: CallType }) {
    if (!this.currentUser || this.currentUser.id !== callData.receiverId) return;
    sounds.startIncomingRing();

    signalCrypto.generateCallEncryption(callData.callId, callData.caller.id, this.currentUser.id).then((encryption) => {
      this.activeCall = {
        callId: callData.callId,
        targetUser: callData.caller,
        callType: callData.callType,
        isIncoming: true,
        status: 'ringing',
        isMuted: false,
        isSpeaker: true,
        isVideoMuted: false,
        isCameraFront: true,
        duration: 0,
        callEncryption: encryption,
      };

      pushService.showNotification({
        title: `Incoming ${callData.callType} call`,
        body: `${callData.caller.fullName} is calling you...`,
        icon: callData.caller.avatarUrl,
      });

      this.notify();
    });
  }

  private handleBroadcastCallAccepted(data: { callId: string }) {
    if (this.activeCall && this.activeCall.callId === data.callId) {
      sounds.stopRing();
      this.activeCall.status = 'connected';
      this.notify();
    }
  }

  private handleBroadcastCallEnded(data: { callId: string }) {
    if (this.activeCall && this.activeCall.callId === data.callId) {
      this.endCall(false);
    }
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach((l) => l());
  }

  // --- AUTHENTICATION & REGISTRATION ---
  register(fullName: string, username: string, phoneNumber: string, countryCode: string): User {
    const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `${countryCode} ${phoneNumber.trim()}`;
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');

    const newUser: User = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      fullName: fullName.trim(),
      username: cleanUsername,
      phoneNumber: cleanPhone,
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop`,
      bio: 'Hey there! I am using Chat.',
      countryCode,
      isOnline: true,
      lastSeen: 'online',
      role: this.registeredUsers.length === 0 ? 'admin' : 'user', // first user can be admin
      privacy: { lastSeen: 'everyone', profilePhoto: 'everyone', status: 'everyone', readReceipts: true },
      createdAt: new Date().toISOString(),
    };

    this.currentUser = newUser;
    this.registeredUsers.push(newUser);
    saveLocal('current_user', this.currentUser);
    saveLocal('registered_users', this.registeredUsers);

    // Initialize cryptographic keys for this registered user
    signalCrypto.initializeIdentity(newUser.id);

    broadcastChannel?.postMessage({ type: 'SYNC_DATA' });
    this.notify();
    return newUser;
  }

  login(phoneNumberOrUsername: string, _password?: string): boolean {
    const clean = phoneNumberOrUsername.trim().toLowerCase();
    const found = this.registeredUsers.find(
      (u) =>
        u.phoneNumber.toLowerCase() === clean ||
        u.username.toLowerCase() === clean ||
        u.phoneNumber.replace(/\s+/g, '') === clean.replace(/\s+/g, '')
    );

    if (found) {
      this.currentUser = { ...found, isOnline: true, lastSeen: 'online' };
      saveLocal('current_user', this.currentUser);
      signalCrypto.initializeIdentity(this.currentUser.id);
      this.notify();
      return true;
    }

    return false;
  }

  logout() {
    this.currentUser = null;
    saveLocal('current_user', null);
    this.notify();
  }

  updateProfile(updates: Partial<User>) {
    if (!this.currentUser) return;
    this.currentUser = { ...this.currentUser, ...updates };
    // update in registered users list
    this.registeredUsers = this.registeredUsers.map((u) =>
      u.id === this.currentUser?.id ? { ...u, ...updates } : u
    );
    saveLocal('current_user', this.currentUser);
    saveLocal('registered_users', this.registeredUsers);
    this.notify();
  }

  // --- SUBSCRIPTION & STRICT ACCESS CONTROL ---

  // Sweep and auto-expire outdated subscriptions
  sweepExpiredSubscriptions() {
    const now = Date.now();
    let changed = false;
    this.subscriptions.forEach((sub) => {
      if (sub.status === 'active' && new Date(sub.expiresAt).getTime() <= now) {
        sub.status = 'expired';
        changed = true;
      }
    });
    if (changed) {
      saveLocal('subscriptions', this.subscriptions);
      this.notify();
    }
  }

  // Check if messaging subscription is active
  hasMessagingAccess(userId?: string): boolean {
    const id = userId || this.currentUser?.id;
    if (!id) return false;

    this.sweepExpiredSubscriptions();
    const now = Date.now();
    return this.subscriptions.some(
      (s) =>
        s.userId === id &&
        (s.planType === 'messaging' || s.planType === 'all_in_one') &&
        s.status === 'active' &&
        new Date(s.expiresAt).getTime() > now
    );
  }

  // Check if calling subscription is active
  hasCallingAccess(userId?: string): boolean {
    const id = userId || this.currentUser?.id;
    if (!id) return false;

    this.sweepExpiredSubscriptions();
    const now = Date.now();
    return this.subscriptions.some(
      (s) =>
        s.userId === id &&
        (s.planType === 'calling' || s.planType === 'all_in_one') &&
        s.status === 'active' &&
        new Date(s.expiresAt).getTime() > now
    );
  }

  // Get active subscription info with remaining time
  getSubscriptionInfo(planType: PlanType, userId?: string) {
    const id = userId || this.currentUser?.id;
    if (!id) return null;

    this.sweepExpiredSubscriptions();

    const sub = this.subscriptions.find(
      (s) => (s.planType === planType || s.planType === 'all_in_one') && s.userId === id && s.status === 'active'
    );
    if (!sub) return null;

    const diff = new Date(sub.expiresAt).getTime() - Date.now();
    const isExpired = diff <= 0;

    const remainingDays = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    const remainingHours = Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    const remainingMinutes = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
    const remainingSeconds = Math.max(0, Math.floor((diff % (1000 * 60)) / 1000));

    return {
      sub,
      isExpired,
      remainingDays,
      remainingHours,
      remainingMinutes,
      remainingSeconds,
      formattedTime: isExpired
        ? 'Expired'
        : remainingDays > 0
        ? `${remainingDays}d ${remainingHours}h remaining`
        : `${remainingHours}h ${remainingMinutes}m ${remainingSeconds}s remaining`,
    };
  }

  // Activate / Renew subscription after Paystack payment verification
  activateSubscription(
    planType: PlanType,
    amount: number,
    reference: string,
    channel: 'card' | 'bank_transfer',
    targetUserId?: string
  ) {
    const targetUser = targetUserId
      ? this.registeredUsers.find((u) => u.id === targetUserId) || this.currentUser
      : this.currentUser;

    if (!targetUser) return;

    const plan = this.pricingPlans.find((p) => p.planType === planType) || {
      name: planType === 'messaging' ? 'Messaging Plan' : planType === 'calling' ? 'Calling Plan' : 'All-In-One Plan',
      durationDays: 30,
    };

    const now = Date.now();
    const expiresAt = new Date(now + 1000 * 60 * 60 * 24 * plan.durationDays).toISOString();

    const newSub: Subscription = {
      id: 'sub_' + Math.random().toString(36).substring(2, 9),
      userId: targetUser.id,
      planType,
      planName: plan.name,
      status: 'active',
      amount,
      currency: 'NGN',
      startedAt: new Date(now).toISOString(),
      expiresAt,
    };

    // Replace or renew existing subscription for this plan type
    this.subscriptions = this.subscriptions.filter(
      (s) => !(s.userId === targetUser.id && (s.planType === planType || (planType === 'all_in_one' && (s.planType === 'messaging' || s.planType === 'calling'))))
    );
    this.subscriptions.push(newSub);
    saveLocal('subscriptions', this.subscriptions);

    // Record verified transaction receipt
    const newTx: Transaction = {
      id: 'tx_' + Math.random().toString(36).substring(2, 9),
      userId: targetUser.id,
      userName: targetUser.fullName,
      reference,
      amount,
      currency: 'NGN',
      planType,
      channel,
      status: 'success',
      paidAt: new Date().toISOString(),
    };
    this.transactions.unshift(newTx);
    saveLocal('transactions', this.transactions);

    broadcastChannel?.postMessage({ type: 'SYNC_DATA' });
    this.notify();
  }

  // Switch between registered accounts seamlessly
  switchAccount(userId: string) {
    const user = this.registeredUsers.find((u) => u.id === userId);
    if (user) {
      this.currentUser = { ...user, isOnline: true, lastSeen: 'online' };
      saveLocal('current_user', this.currentUser);
      signalCrypto.initializeIdentity(user.id);
      this.notify();
    }
  }

  // --- CONTACTS MANAGEMENT ---
  addContact(name: string, phoneNumber: string): User {
    const cleanPhone = phoneNumber.trim();
    // Check if phone belongs to an existing registered user
    const registered = this.registeredUsers.find(
      (u) => u.phoneNumber.replace(/\s+/g, '') === cleanPhone.replace(/\s+/g, '')
    );

    const contactUser: User = registered || {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      username: name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      fullName: name,
      phoneNumber: cleanPhone,
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop`,
      bio: 'Available',
      countryCode: cleanPhone.split(' ')[0] || '+1',
      isOnline: false,
      lastSeen: 'offline',
      role: 'user',
      privacy: { lastSeen: 'everyone', profilePhoto: 'everyone', status: 'everyone', readReceipts: true },
      createdAt: new Date().toISOString(),
    };

    if (!this.contacts.some((c) => c.phoneNumber === cleanPhone)) {
      this.contacts.push(contactUser);
      saveLocal('contacts', this.contacts);
    }

    if (!this.registeredUsers.some((u) => u.id === contactUser.id)) {
      this.registeredUsers.push(contactUser);
      saveLocal('registered_users', this.registeredUsers);
    }

    this.notify();
    return contactUser;
  }

  // Search registered users by username or phone
  searchRegisteredUser(query: string): User | null {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return (
      this.registeredUsers.find(
        (u) =>
          u.id !== this.currentUser?.id &&
          (u.username.toLowerCase() === q ||
            u.phoneNumber.toLowerCase().includes(q) ||
            u.fullName.toLowerCase().includes(q))
      ) || null
    );
  }

  // --- CONVERSATIONS & END-TO-END ENCRYPTED MESSAGING ---
  getOrCreateConversation(user: User): Conversation {
    const existing = this.conversations.find(
      (c) => c.type === 'direct' && c.participants.some((p) => p.id === user.id)
    );
    if (existing) return existing;

    const newConv: Conversation = {
      id: 'conv_' + Math.random().toString(36).substring(2, 9),
      type: 'direct',
      title: user.fullName,
      participants: [user],
      unreadCount: 0,
      isPinned: false,
      isArchived: false,
      isMuted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.conversations.unshift(newConv);
    this.messages[newConv.id] = [];
    saveLocal('conversations', this.conversations);
    saveLocal('messages', this.messages);
    this.notify();
    return newConv;
  }

  createGroupConversation(title: string, participantIds: string[], avatarUrl?: string): Conversation {
    const participants = this.contacts.filter((c) => participantIds.includes(c.id));
    const newConv: Conversation = {
      id: 'grp_' + Math.random().toString(36).substring(2, 9),
      type: 'group',
      title,
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop',
      participants,
      unreadCount: 0,
      isPinned: false,
      isArchived: false,
      isMuted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.conversations.unshift(newConv);
    this.messages[newConv.id] = [];
    saveLocal('conversations', this.conversations);
    saveLocal('messages', this.messages);
    this.notify();
    return newConv;
  }

  sendMessage(
    conversationId: string,
    payload: {
      text?: string;
      type?: MessageType;
      mediaUrl?: string;
      mediaMeta?: Message['mediaMeta'];
      replyToId?: string;
    }
  ): Message {
    if (!this.currentUser) throw new Error('User not authenticated');

    // Strict messaging plan verification
    if (!this.hasMessagingAccess(this.currentUser.id)) {
      throw new Error('Active messaging subscription required');
    }

    const conv = this.conversations.find((c) => c.id === conversationId);
    if (!conv) throw new Error('Conversation not found');

    const replyMsg = payload.replyToId
      ? this.messages[conversationId]?.find((m) => m.id === payload.replyToId)
      : undefined;

    const newMessage: Message = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      conversationId,
      senderId: this.currentUser.id,
      text: payload.text,
      type: payload.type || 'text',
      mediaUrl: payload.mediaUrl,
      mediaMeta: payload.mediaMeta,
      replyToId: payload.replyToId,
      replyToMessage: replyMsg
        ? {
            id: replyMsg.id,
            senderName: replyMsg.senderId === this.currentUser.id ? 'You' : conv.title,
            text: replyMsg.text,
            type: replyMsg.type,
          }
        : undefined,
      status: 'sent',
      isDeleted: false,
      isEncrypted: true,
      createdAt: new Date().toISOString(),
    };

    // Encrypt payload using Signal Protocol
    signalCrypto
      .encryptPayload(conversationId, {
        text: payload.text,
        type: payload.type,
        mediaUrl: payload.mediaUrl,
      })
      .then((encrypted) => {
        newMessage.encryptedPayload = encrypted;
        saveLocal('messages', this.messages);
      });

    if (!this.messages[conversationId]) {
      this.messages[conversationId] = [];
    }
    this.messages[conversationId].push(newMessage);

    conv.lastMessage = newMessage;
    conv.updatedAt = newMessage.createdAt;

    sounds.playSent();

    saveLocal('conversations', this.conversations);
    saveLocal('messages', this.messages);

    // Broadcast across real-time channel to other active devices/tabs
    broadcastChannel?.postMessage({
      type: 'NEW_MESSAGE',
      data: newMessage,
    });

    this.notify();
    return newMessage;
  }

  deleteMessage(conversationId: string, messageId: string, deleteForEveryone: boolean = false) {
    const list = this.messages[conversationId];
    if (!list) return;

    if (deleteForEveryone) {
      const target = list.find((m) => m.id === messageId);
      if (target) {
        target.isDeleted = true;
        target.text = 'This message was deleted';
        target.mediaUrl = undefined;
      }
    } else {
      this.messages[conversationId] = list.filter((m) => m.id !== messageId);
    }

    saveLocal('messages', this.messages);
    broadcastChannel?.postMessage({ type: 'SYNC_DATA' });
    this.notify();
  }

  forwardMessage(targetConversationId: string, message: Message) {
    this.sendMessage(targetConversationId, {
      text: message.text,
      type: message.type,
      mediaUrl: message.mediaUrl,
      mediaMeta: message.mediaMeta,
    });
  }

  togglePinConversation(conversationId: string) {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.isPinned = !conv.isPinned;
      this.conversations.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
      saveLocal('conversations', this.conversations);
      this.notify();
    }
  }

  toggleMuteConversation(conversationId: string) {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.isMuted = !conv.isMuted;
      saveLocal('conversations', this.conversations);
      this.notify();
    }
  }

  toggleArchiveConversation(conversationId: string) {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.isArchived = !conv.isArchived;
      saveLocal('conversations', this.conversations);
      this.notify();
    }
  }

  markConversationAsRead(conversationId: string) {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv && conv.unreadCount > 0) {
      conv.unreadCount = 0;
      saveLocal('conversations', this.conversations);
      this.notify();
    }
  }

  // --- CALLS & E2EE MEDIA STREAMS ---
  async startCall(targetUser: User, callType: CallType) {
    if (!this.currentUser) return;

    // Strict calling plan verification
    if (!this.hasCallingAccess(this.currentUser.id)) {
      throw new Error('Active calling subscription required');
    }

    sounds.startOutgoingRing();
    const callId = 'call_' + Math.random().toString(36).substring(2, 9);
    const encryption = await signalCrypto.generateCallEncryption(
      callId,
      this.currentUser.id,
      targetUser.id
    );

    this.activeCall = {
      callId,
      targetUser,
      callType,
      isIncoming: false,
      status: 'ringing',
      isMuted: false,
      isSpeaker: true,
      isVideoMuted: false,
      isCameraFront: true,
      duration: 0,
      callEncryption: encryption,
    };

    // Broadcast incoming call to receiver across tabs / devices
    broadcastChannel?.postMessage({
      type: 'INCOMING_CALL',
      data: {
        callId,
        caller: this.currentUser,
        receiverId: targetUser.id,
        callType,
      },
    });

    this.notify();
  }

  acceptCall() {
    if (!this.activeCall) return;
    sounds.stopRing();
    this.activeCall.status = 'connected';

    broadcastChannel?.postMessage({
      type: 'CALL_ACCEPTED',
      data: { callId: this.activeCall.callId },
    });

    this.notify();
  }

  endCall(shouldBroadcast: boolean = true) {
    if (!this.activeCall) return;
    sounds.playCallEnd();

    const callId = this.activeCall.callId;

    // Record authentic call log
    const newLog: CallLog = {
      id: callId,
      callerId: this.activeCall.isIncoming ? this.activeCall.targetUser.id : (this.currentUser?.id || ''),
      caller: this.activeCall.isIncoming ? this.activeCall.targetUser : (this.currentUser as User),
      receiverId: this.activeCall.isIncoming ? (this.currentUser?.id || '') : this.activeCall.targetUser.id,
      receiver: this.activeCall.isIncoming ? (this.currentUser as User) : this.activeCall.targetUser,
      callType: this.activeCall.callType,
      direction: this.activeCall.isIncoming ? 'incoming' : 'outgoing',
      status: this.activeCall.status === 'connected' ? 'completed' : 'missed',
      startedAt: new Date(Date.now() - this.activeCall.duration * 1000).toISOString(),
      endedAt: new Date().toISOString(),
      durationSeconds: this.activeCall.duration,
    };

    this.callLogs.unshift(newLog);
    saveLocal('call_logs', this.callLogs);

    if (shouldBroadcast) {
      broadcastChannel?.postMessage({
        type: 'CALL_ENDED',
        data: { callId },
      });
    }

    this.activeCall = null;
    this.notify();
  }

  updateCallState(updates: Partial<ActiveCallState>) {
    if (!this.activeCall) return;
    this.activeCall = { ...this.activeCall, ...updates };
    this.notify();
  }

  // --- UPDATES (24-HOUR STATUS) ---
  postStatus(payload: {
    type: 'text' | 'image' | 'video';
    content?: string;
    mediaUrl?: string;
    backgroundColor?: string;
    fontStyle?: string;
  }) {
    if (!this.currentUser) return;

    const newStatus: StatusUpdate = {
      id: 'st_' + Math.random().toString(36).substring(2, 9),
      userId: this.currentUser.id,
      user: {
        id: this.currentUser.id,
        fullName: this.currentUser.fullName,
        avatarUrl: this.currentUser.avatarUrl,
      },
      type: payload.type,
      content: payload.content,
      mediaUrl: payload.mediaUrl,
      backgroundColor: payload.backgroundColor || '#008069',
      fontStyle: payload.fontStyle || 'sans-serif',
      viewers: [],
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
    };

    this.statuses.unshift(newStatus);
    saveLocal('statuses', this.statuses);
    broadcastChannel?.postMessage({ type: 'SYNC_DATA' });
    this.notify();
  }

  viewStatus(statusId: string) {
    const status = this.statuses.find((s) => s.id === statusId);
    if (!status || !this.currentUser) return;

    const alreadyViewed = status.viewers.some((v) => v.viewerId === this.currentUser?.id);
    if (!alreadyViewed && status.userId !== this.currentUser.id) {
      status.viewers.push({
        viewerId: this.currentUser.id,
        viewerName: this.currentUser.fullName,
        viewerAvatar: this.currentUser.avatarUrl,
        viewedAt: new Date().toISOString(),
      });
      saveLocal('statuses', this.statuses);
      this.notify();
    }
  }

  // --- COMMUNITIES ---
  createCommunity(name: string, description: string, avatarUrl: string): Community {
    if (!this.currentUser) throw new Error('Not authenticated');

    const newCommunity: Community = {
      id: 'cm_' + Math.random().toString(36).substring(2, 9),
      name,
      description,
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop',
      createdBy: this.currentUser.id,
      inviteCode: name.toUpperCase().replace(/[^A-Z0-9]/g, '') + Math.floor(Math.random() * 900 + 100),
      memberCount: 1,
      groups: [
        {
          id: 'grp_ann_' + Date.now(),
          title: '📢 Announcements',
          isAnnouncement: true,
          lastMessage: 'Welcome to our official announcements channel.',
        },
        {
          id: 'grp_gen_' + Date.now(),
          title: '💬 General',
          isAnnouncement: false,
          lastMessage: 'Feel free to introduce yourself.',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    this.communities.unshift(newCommunity);
    saveLocal('communities', this.communities);
    broadcastChannel?.postMessage({ type: 'SYNC_DATA' });
    this.notify();
    return newCommunity;
  }

  // --- ADMIN & MODERATION ---
  blockUser(userId: string) {
    if (!this.blockedUserIds.includes(userId)) {
      this.blockedUserIds.push(userId);
      saveLocal('blocked_users', this.blockedUserIds);
      this.notify();
    }
  }

  unblockUser(userId: string) {
    this.blockedUserIds = this.blockedUserIds.filter((id) => id !== userId);
    saveLocal('blocked_users', this.blockedUserIds);
    this.notify();
  }

  reportUser(reportedUserId: string, reason: string, details?: string) {
    const reported = this.registeredUsers.find((c) => c.id === reportedUserId);
    const newReport: UserReport = {
      id: 'rep_' + Math.random().toString(36).substring(2, 9),
      reporterId: this.currentUser?.id || '',
      reporterName: this.currentUser?.fullName || 'Anonymous',
      reportedUserId,
      reportedUserName: reported?.fullName || 'Unknown User',
      reason,
      details,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.reports.unshift(newReport);
    saveLocal('reports', this.reports);
    this.notify();
  }

  updatePlanPrice(planType: PlanType, newPrice: number) {
    const plan = this.pricingPlans.find((p) => p.planType === planType);
    if (plan) {
      plan.price = newPrice;
      saveLocal('pricing_plans', this.pricingPlans);
      broadcastChannel?.postMessage({ type: 'SYNC_DATA' });
      this.notify();
    }
  }

  // --- BACKUP & RESTORE ---
  exportBackupData(): string {
    const payload = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      user: this.currentUser,
      conversations: this.conversations,
      messages: this.messages,
      callLogs: this.callLogs,
      statuses: this.statuses,
      communities: this.communities,
      subscriptions: this.subscriptions,
      transactions: this.transactions,
    };
    return JSON.stringify(payload, null, 2);
  }

  importBackupData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.conversations && data.messages) {
        this.conversations = data.conversations;
        this.messages = data.messages;
        if (data.callLogs) this.callLogs = data.callLogs;
        if (data.statuses) this.statuses = data.statuses;
        if (data.communities) this.communities = data.communities;
        if (data.subscriptions) this.subscriptions = data.subscriptions;
        if (data.transactions) this.transactions = data.transactions;

        saveLocal('conversations', this.conversations);
        saveLocal('messages', this.messages);
        saveLocal('call_logs', this.callLogs);
        saveLocal('statuses', this.statuses);
        saveLocal('communities', this.communities);
        saveLocal('subscriptions', this.subscriptions);
        saveLocal('transactions', this.transactions);

        this.notify();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const chatStore = new ChatStore();
