export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'gif' | 'sticker';
export type MessageStatus = 'sent' | 'delivered' | 'read';
export type CallType = 'voice' | 'video';
export type CallDirection = 'incoming' | 'outgoing' | 'missed';
export type CallStatus = 'completed' | 'missed' | 'declined' | 'busy' | 'ongoing';
export type PlanType = 'messaging' | 'calling' | 'all_in_one';

export interface UserPrivacy {
  lastSeen: 'everyone' | 'contacts' | 'nobody';
  profilePhoto: 'everyone' | 'contacts' | 'nobody';
  status: 'everyone' | 'contacts' | 'nobody';
  readReceipts: boolean;
}

export interface EncryptedMessagePayload {
  version: number;
  algorithm: 'Signal-DoubleRatchet-AES-256-GCM';
  ciphertext: string; // Base64
  iv: string; // Base64
  ratchetStep: number;
  senderEphemeralPublicKey: string; // JWK / Base64
  timestamp: string;
}

export interface PreKeyBundle {
  userId: string;
  identityPublicKey: string; // Base64
  signedPreKey: string; // Base64
  preKeySignature: string; // Base64
  oneTimePreKey?: string; // Base64
  createdAt: string;
}

export interface UserSecurityFingerprint {
  safetyNumberFormatted: string; // 60 digits (12 groups of 5)
  safetyNumberRaw: string;
  isVerified: boolean;
  verifiedAt?: string;
  identityKeyFingerprint: string;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  phoneNumber: string;
  avatarUrl: string;
  bio: string;
  countryCode: string;
  isOnline: boolean;
  lastSeen: string;
  role: 'user' | 'admin';
  privacy: UserPrivacy;
  isBlocked?: boolean;
  createdAt: string;
  preKeyBundle?: PreKeyBundle;
  securityFingerprint?: UserSecurityFingerprint;
}

export interface MessageMediaMeta {
  fileName?: string;
  fileSize?: string;
  duration?: number;
  waveform?: number[];
  dimensions?: { width: number; height: number };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  type: MessageType;
  mediaUrl?: string;
  mediaMeta?: MessageMediaMeta;
  replyToId?: string;
  replyToMessage?: {
    id: string;
    senderName: string;
    text?: string;
    type: MessageType;
  };
  status: MessageStatus;
  isDeleted: boolean;
  forwarded?: boolean;
  createdAt: string;
  // Signal Protocol End-to-End Encryption metadata
  encryptedPayload?: EncryptedMessagePayload;
  isEncrypted?: boolean;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'community_announcement';
  title: string;
  avatarUrl?: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
  isMuted: boolean;
  typingUsers?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StatusView {
  viewerId: string;
  viewerName: string;
  viewerAvatar: string;
  viewedAt: string;
}

export interface StatusUpdate {
  id: string;
  userId: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl: string;
  };
  type: 'text' | 'image' | 'video';
  content?: string;
  mediaUrl?: string;
  backgroundColor?: string;
  fontStyle?: string;
  viewers: StatusView[];
  createdAt: string;
  expiresAt: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  createdBy: string;
  inviteCode: string;
  memberCount: number;
  groups: {
    id: string;
    title: string;
    isAnnouncement?: boolean;
    lastMessage?: string;
  }[];
  createdAt: string;
}

export interface CallLog {
  id: string;
  callerId: string;
  caller: User;
  receiverId: string;
  receiver: User;
  callType: CallType;
  direction: CallDirection;
  status: CallStatus;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
}

export interface ActiveCallState {
  callId: string;
  targetUser: User;
  callType: CallType;
  isIncoming: boolean;
  status: 'ringing' | 'connected' | 'ended';
  isMuted: boolean;
  isSpeaker: boolean;
  isVideoMuted: boolean;
  isCameraFront: boolean;
  duration: number;
  callEncryption?: {
    isE2EE: boolean;
    callMasterKeyHash: string;
    shortAuthString: string; // 4-digit SAS e.g. "7291"
    authEmoji: string; // e.g. "🔒 🛡️ ⚡ 💎"
    safetyWord: string; // e.g. "Falcon-Emerald-Shield"
    protocol: string;
  };
}

export interface Subscription {
  id: string;
  userId: string;
  planType: PlanType;
  planName: string;
  status: 'active' | 'expired';
  amount: number;
  currency: string;
  startedAt: string;
  expiresAt: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  planType: PlanType;
  price: number;
  currency: string;
  durationDays: number;
  features: string[];
  popular?: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  reference: string;
  amount: number;
  currency: string;
  planType: PlanType;
  channel: 'card' | 'bank_transfer' | 'ussd';
  status: 'success' | 'failed' | 'pending';
  paidAt: string;
}

export interface UserReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  reason: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}
