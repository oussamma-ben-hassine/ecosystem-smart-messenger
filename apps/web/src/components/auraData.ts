export interface ChatMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  type: 'text' | 'voice' | 'image' | 'poll' | 'aura-note';
  voiceDuration?: string;
  voiceCurrent?: string;
  imageUrl?: string;
  imageLocation?: string;
  reactions?: Array<{ emoji: string; count: number }>;
  pollData?: {
    id: string;
    question: string;
    totalVotes: number;
    options: Array<{
      id: string;
      label: string;
      votes: number;
      voters: string[];
      selected?: boolean;
    }>;
  };
  auraNoteData?: {
    title: string;
    text: string;
    actions: Array<{ label: string; icon?: string; actionType: string }>;
  };
}

export interface ConversationRoom {
  id: string;
  name: string;
  isGroup: boolean;
  isAI?: boolean;
  avatar: string;
  groupAvatars?: string[];
  extraMembersCount?: number;
  subtitle?: string;
  lastMessage: string;
  lastMessageType?: 'text' | 'voice' | 'file' | 'ai';
  timestamp: string;
  unread: number;
  online: boolean;
  statusText?: string;
  pinnedBanner?: {
    title: string;
    subtitle: string;
  };
  smartSuggestions?: Array<{ label: string; replyText: string }>;
}

export interface FriendContact {
  id: string;
  name: string;
  handle: string;
  bio: string;
  activityBadge?: string;
  avatar: string;
  online: boolean;
  favorite: boolean;
  letter: string;
  conversationId?: string;
}

export interface FriendRequestItem {
  id: string;
  name: string;
  handle: string;
  subtitle: string;
  avatar: string;
}

export interface AISynthesisCardData {
  title: string;
  bullets: Array<{ label: string; text: string }>;
  tasks: Array<{ id: string; text: string; assignee: string; done: boolean }>;
}

export interface AIMessageEntry {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  synthesis?: AISynthesisCardData;
  action?: {
    id: string;
    toolName: string;
    previewText: string;
    status: 'pending' | 'executed' | 'rejected';
  };
}

export const ONLINE_STORIES = [
  {
    id: 'story-aura',
    name: 'Aura IA',
    isAI: true,
    avatar: '',
    online: true,
  },
];

export const INITIAL_CONVERSATIONS: ConversationRoom[] = [];

export const INITIAL_MESSAGES: Record<string, ChatMessageItem[]> = {};

export const INITIAL_FRIEND_REQUESTS: FriendRequestItem[] = [];

export const INITIAL_FRIENDS: FriendContact[] = [];

export const INITIAL_AI_MESSAGES: AIMessageEntry[] = [];
