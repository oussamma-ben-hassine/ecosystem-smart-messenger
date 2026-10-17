/**
 * Core User Profile interface
 */
export interface UserProfile {
  id: string;
  ssoSub: string;
  matrixUserId: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  statusMessage?: string;
  isOnline: boolean;
  roles?: string[];
  isSuperAdmin?: boolean;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Contact interface
 */
export interface Contact {
  id: string;
  userId: string;
  contactUser: UserProfile;
  isFavorite: boolean;
  isBlocked: boolean;
  createdAt: string;
}

/**
 * Custom contact list (for AI actions like "send to all my friends")
 */
export interface ContactList {
  id: string;
  userId: string;
  name: string;
  description?: string;
  members: UserProfile[];
  createdAt: string;
}

/**
 * Conversation metadata
 */
export interface ConversationMeta {
  roomId: string;
  name: string;
  isDirect: boolean;
  isEncrypted: boolean;
  avatarUrl?: string;
  lastMessage?: {
    id: string;
    sender: string;
    content: string;
    timestamp: number;
    isEncrypted: boolean;
  };
  unreadCount: number;
  participants: UserProfile[];
}

/**
 * Encrypted attachment metadata
 */
export interface EncryptedMediaPayload {
  driveFileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageUrl: string;
  encryptionMeta: {
    algorithm: string;
    key: string;
    iv: string;
    hashes: Record<string, string>;
  };
}

/**
 * LiveKit Call Session
 */
export interface CallSession {
  roomName: string;
  callType: 'audio' | 'video';
  initiatorId: string;
  participants: string[];
  token: string;
  livekitUrl: string;
  startedAt: string;
}

/**
 * AI Tool Call Definition
 */
export interface AIToolExecutionRequest {
  id: string;
  userId: string;
  toolName: string;
  parameters: Record<string, any>;
  requiresConfirmation: boolean;
  status: 'pending' | 'confirmed' | 'executed' | 'rejected';
  previewText: string;
  result?: any;
}
