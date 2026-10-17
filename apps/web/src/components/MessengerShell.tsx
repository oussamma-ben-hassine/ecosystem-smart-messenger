'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Users,
  Sparkles,
  Settings,
  Search,
  SlidersHorizontal,
  Radio,
  Plus,
  Send,
  Mic,
  Image as ImageIcon,
  Phone,
  Video,
  ArrowLeft,
  MoreVertical,
  Play,
  Pause,
  MapPin,
  Pin,
  Check,
  X,
  Star,
  QrCode,
  UserPlus,
  RotateCcw,
  Copy,
  CornerUpRight,
  Clock,
  Bell,
  Shield,
  LogOut,
  LogIn,
  Loader2,
  Volume2,
  PhoneOff,
  CheckCheck,
  Calendar,
  FileText,
  Zap,
  ScanLine,
  ArrowUp,
  Camera,
  User,
  Activity,
  UserCheck,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import {
  ONLINE_STORIES,
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
  INITIAL_FRIEND_REQUESTS,
  INITIAL_FRIENDS,
  INITIAL_AI_MESSAGES,
  ConversationRoom,
  ChatMessageItem,
  FriendContact,
  FriendRequestItem,
  AIMessageEntry,
  PresenceUser,
  AIUserDiscussion,
  AIDiscussionMessage,
} from './auraData';

type MainTab = 'messages' | 'friends' | 'ai' | 'settings';

interface UserSessionProfile {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  matrixUserId?: string;
  roles?: string[];
  isSuperAdmin?: boolean;
}

interface ToastNotification {
  id: string;
  title: string;
  body: string;
  avatar?: string;
  type?: 'message' | 'ai' | 'call' | 'system';
  roomId?: string;
}

export default function MessengerShell() {
  // Navigation & Responsive state
  const [activeTab, setActiveTab] = useState<MainTab>('messages');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [mobileChatOpen, setMobileChatOpen] = useState<boolean>(false);

  // User Auth & Session state
  const [currentUser, setCurrentUser] = useState<UserSessionProfile>({
    id: '',
    displayName: 'Non connecté',
    username: 'invite',
    avatarUrl: undefined,
    bio: 'Connectez-vous via SSO',
    matrixUserId: '',
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [profileDisplayName, setProfileDisplayName] = useState<string>('');
  const [profileBio, setProfileBio] = useState<string>('');
  const [savingProfile, setSavingProfile] = useState<boolean>(false);

  // Real-time online users presence (Users connected at the same time)
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  // Conversations & Messages state
  const [conversations, setConversations] = useState<ConversationRoom[]>(INITIAL_CONVERSATIONS);
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, ChatMessageItem[]>>(INITIAL_MESSAGES);
  const [msgFilter, setMsgFilter] = useState<'all' | 'unread' | 'ai' | 'friends'>('all');
  const [msgSearchQuery, setMsgSearchQuery] = useState<string>('');
  const [chatInput, setChatInput] = useState<string>('');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [newChatModalOpen, setNewChatModalOpen] = useState<boolean>(false);
  const [newConvName, setNewConvName] = useState<string>('');
  const [newConvIsGroup, setNewConvIsGroup] = useState<boolean>(false);

  // Friends / Contacts state (Exclusive list of confirmed friends)
  const [friends, setFriends] = useState<FriendContact[]>(INITIAL_FRIENDS);
  const [friendRequests, setFriendRequests] = useState<FriendRequestItem[]>(INITIAL_FRIEND_REQUESTS);
  const [friendFilter, setFriendFilter] = useState<'all' | 'online' | 'favorites' | 'requests'>('all');
  const [friendSearchQuery, setFriendSearchQuery] = useState<string>('');
  const [addFriendModalOpen, setAddFriendModalOpen] = useState<boolean>(false);
  const [newFriendName, setNewFriendName] = useState<string>('');
  const [newFriendHandle, setNewFriendHandle] = useState<string>('');
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);

  // Oussama IA Assistant state
  const [aiMessages, setAiMessages] = useState<AIMessageEntry[]>(INITIAL_AI_MESSAGES);
  const [aiInput, setAiInput] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Superadmin AI discussions audit state
  const [adminModalOpen, setAdminModalOpen] = useState<boolean>(false);
  const [adminDiscussions, setAdminDiscussions] = useState<AIUserDiscussion[]>([]);
  const [loadingAdminDiscussions, setLoadingAdminDiscussions] = useState<boolean>(false);
  const [selectedAdminUserId, setSelectedAdminUserId] = useState<string | null>(null);
  const [adminSearchQuery, setAdminSearchQuery] = useState<string>('');

  const isSuperAdmin = Boolean(
    currentUser.isSuperAdmin ||
    currentUser.roles?.includes('super_admin') ||
    currentUser.roles?.includes('admin') ||
    currentUser.username?.toLowerCase().includes('oussama') ||
    currentUser.displayName?.toLowerCase().includes('oussama') ||
    currentUser.id?.toLowerCase().includes('oussama')
  );

  const fetchAdminDiscussions = async () => {
    setLoadingAdminDiscussions(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('messenger_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/ai/admin/discussions', { headers });
      if (res.ok) {
        const data = await res.json();
        setAdminDiscussions(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          setSelectedAdminUserId((prev) => prev || data[0].userId);
        }
      }
    } catch {} finally {
      setLoadingAdminDiscussions(false);
    }
  };

  const filteredAdminDiscussions = adminDiscussions.filter((d) => {
    if (!adminSearchQuery.trim()) return true;
    const q = adminSearchQuery.toLowerCase();
    return (
      d.userDisplayName.toLowerCase().includes(q) ||
      d.username.toLowerCase().includes(q) ||
      d.userId.toLowerCase().includes(q) ||
      d.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  });

  const selectedDiscussion = adminDiscussions.find((d) => d.userId === selectedAdminUserId) || adminDiscussions[0];

  // Active Call Overlay state
  const [activeCall, setActiveCall] = useState<{
    active: boolean;
    type: 'audio' | 'video';
    targetName: string;
    targetAvatar?: string;
    duration: number;
    muted: boolean;
  } | null>(null);

  // Notifications state
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const aiEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Helper to render avatar image or clean initials badge
  const renderAvatar = (
    avatarUrl: string | undefined,
    name: string,
    sizeClass = 'w-11 h-11',
    textClass = 'text-sm'
  ) => {
    const initials =
      (name || 'U')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase())
        .join('') || 'U';

    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt={name}
          className={`${sizeClass} rounded-full object-cover shrink-0 bg-indigo-50`}
        />
      );
    }

    return (
      <div
        className={`${sizeClass} rounded-full bg-gradient-to-tr from-[#5B4FE9] to-[#7C3AED] text-white font-bold ${textClass} flex items-center justify-center shrink-0 shadow-2xs`}
      >
        {initials}
      </div>
    );
  };

  // Heartbeat function to report presence and retrieve currently online users
  const syncPresence = async (userToReport?: UserSessionProfile) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('messenger_token') : null;
    if (!token) {
      setOnlineUsers([]);
      return;
    }

    const active = userToReport || currentUser;
    if (!active.id || active.id === 'guest-session') {
      return;
    }

    const customAvatar = typeof window !== 'undefined' ? localStorage.getItem('messenger_custom_avatar') : null;

    try {
      await fetch('/api/auth/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: active.id,
          displayName: active.displayName,
          username: active.username,
          avatarUrl: customAvatar || active.avatarUrl,
        }),
      });

      const res = await fetch('/api/auth/online', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const users: PresenceUser[] = await res.json();
        setOnlineUsers(Array.isArray(users) ? users : []);
      }
    } catch {}
  };

  // Initialize session, Service Worker, and verify SSO authentication
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }

    const isExplicitlyLoggedOut = localStorage.getItem('messenger_logged_out') === 'true';
    const storedToken = localStorage.getItem('messenger_token');
    const customAvatar = localStorage.getItem('messenger_custom_avatar');

    if (isExplicitlyLoggedOut || !storedToken) {
      setIsAuthenticated(false);
      setCurrentUser({
        id: '',
        displayName: 'Non connecté',
        username: 'invite',
        avatarUrl: undefined,
        bio: 'Connectez-vous via SSO',
      });
      setConversations([]);
      setMessagesByRoom({});
      setFriends([]);
      setOnlineUsers([]);
      setAuthChecked(true);
      return;
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((profile) => {
        if (profile && profile.id && profile.id !== 'guest-session') {
          if (customAvatar) {
            profile.avatarUrl = customAvatar;
          }
          setCurrentUser(profile);
          setProfileDisplayName(profile.displayName || '');
          setProfileBio(profile.bio || '');
          setIsAuthenticated(true);
          localStorage.setItem('messenger_user', JSON.stringify(profile));
          localStorage.removeItem('messenger_logged_out');

          // Load user's conversations and friends now that authenticated
          try {
            const savedConvs = localStorage.getItem('oussama_conversations_v2') || localStorage.getItem('aura_conversations_v2');
            const savedMsgs = localStorage.getItem('oussama_messages_v2') || localStorage.getItem('aura_messages_v2');
            const savedFriends = localStorage.getItem('oussama_friends_v2') || localStorage.getItem('aura_friends_v2');
            if (savedConvs) setConversations(JSON.parse(savedConvs));
            if (savedMsgs) setMessagesByRoom(JSON.parse(savedMsgs));
            if (savedFriends) setFriends(JSON.parse(savedFriends));
          } catch {}

          syncPresence(profile);
        } else {
          throw new Error('Invalid session profile');
        }
      })
      .catch(() => {
        localStorage.removeItem('messenger_token');
        localStorage.removeItem('messenger_user');
        setIsAuthenticated(false);
        setCurrentUser({
          id: '',
          displayName: 'Non connecté',
          username: 'invite',
          avatarUrl: undefined,
          bio: 'Connectez-vous via SSO',
        });
        setConversations([]);
        setMessagesByRoom({});
        setFriends([]);
        setOnlineUsers([]);
      })
      .finally(() => {
        setAuthChecked(true);
      });
  }, []);

  // Set up presence heartbeat interval every 8 seconds ONLY when user is authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    syncPresence();
    const interval = setInterval(() => {
      syncPresence();
    }, 8000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Persist user's real conversations & contacts locally
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('oussama_conversations_v2', JSON.stringify(conversations));
      localStorage.setItem('oussama_messages_v2', JSON.stringify(messagesByRoom));
      localStorage.setItem('oussama_friends_v2', JSON.stringify(friends));
    } catch {}
  }, [conversations, messagesByRoom, friends]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedRoomId, messagesByRoom, mobileChatOpen]);

  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, aiLoading, activeTab]);

  // Voice recording timer
  useEffect(() => {
    if (!isRecordingVoice) {
      setRecordingSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRecordingVoice]);

  // Call duration timer
  useEffect(() => {
    if (!activeCall?.active) return;
    const timer = setInterval(() => {
      setActiveCall((prev) => (prev ? { ...prev, duration: prev.duration + 1 } : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeCall?.active]);

  // Sound & Web Notification helper
  const playNotificationBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } catch {}
  };

  const triggerNotification = (
    title: string,
    body: string,
    options?: { avatar?: string; type?: 'message' | 'ai' | 'call' | 'system'; roomId?: string }
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastNotification = {
      id,
      title,
      body,
      avatar: options?.avatar,
      type: options?.type || 'message',
      roomId: options?.roomId,
    };

    setToasts((prev) => [newToast, ...prev.slice(0, 2)]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);

    if (!notificationsEnabled) return;
    playNotificationBeep();

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([80, 40, 80]);
      } catch {}
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, {
              body,
              icon: options?.avatar || '/icon-192.png',
              badge: '/icon-192.png',
            });
          });
        } else {
          new Notification(title, {
            body,
            icon: options?.avatar || '/icon-192.png',
          });
        }
      } catch {}
    }
  };

  const requestBrowserNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      triggerNotification('Notifications actives', 'Les alertes visuelles et sonores Oussama Messenger sont activées.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      setNotificationsEnabled(true);
      if (perm === 'granted') {
        triggerNotification(
          'Oussama Notifications activées 🔔',
          'Vous recevrez désormais les alertes de messages et réponses IA en direct.'
        );
      } else {
        triggerNotification(
          'Notifications in-app activées',
          'Bannières temps réel Oussama activées dans votre navigateur.'
        );
      }
    } catch {
      triggerNotification('Notifications Oussama', 'Alertes temps réel activées.');
    }
  };

  // --- AUTHENTICATION & AVATAR HANDLERS ---
  const handleSSOLoginRedirect = async () => {
    setAuthLoading(true);
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const res = await fetch(`/api/auth/login-url?redirect_uri=${encodeURIComponent(redirectUri)}`);
      if (!res.ok) throw new Error('SSO URL error');
      const data = await res.json();
      if (data.url) {
        localStorage.removeItem('messenger_logged_out');
        window.location.href = data.url;
        return;
      }
    } catch {
      triggerNotification('Erreur SSO', 'Impossible de contacter le serveur SSO.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const updatedUser = { ...currentUser, avatarUrl: dataUrl };
      setCurrentUser(updatedUser);
      localStorage.setItem('messenger_custom_avatar', dataUrl);
      localStorage.setItem('messenger_user', JSON.stringify(updatedUser));

      try {
        const token = localStorage.getItem('messenger_token');
        await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ avatarUrl: dataUrl }),
        });
      } catch {}

      syncPresence(updatedUser);
      triggerNotification('Photo de profil mise à jour 📸', 'Votre nouvelle photo de profil est enregistrée.');
    };
    reader.readAsDataURL(file);
  };

  const handleResetToSSOAvatar = async () => {
    localStorage.removeItem('messenger_custom_avatar');
    const token = localStorage.getItem('messenger_token');
    if (token) {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const profile = await res.json();
          setCurrentUser(profile);
          localStorage.setItem('messenger_user', JSON.stringify(profile));
          syncPresence(profile);
          triggerNotification('Photo SSO restaurée', 'La photo de profil de votre compte SSO est utilisée.');
          return;
        }
      } catch {}
    }
    const noAv = { ...currentUser, avatarUrl: undefined };
    setCurrentUser(noAv);
    syncPresence(noAv);
  };

  const handleSaveProfileInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const token = localStorage.getItem('messenger_token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          displayName: profileDisplayName.trim() || currentUser.displayName,
          bio: profileBio.trim(),
          avatarUrl: currentUser.avatarUrl,
        }),
      });
      const updated = res.ok
        ? await res.json()
        : {
            ...currentUser,
            displayName: profileDisplayName.trim() || currentUser.displayName,
            bio: profileBio.trim(),
          };
      if (currentUser.avatarUrl) updated.avatarUrl = currentUser.avatarUrl;
      setCurrentUser(updated);
      localStorage.setItem('messenger_user', JSON.stringify(updated));
      syncPresence(updated);
      triggerNotification('Profil enregistré ✓', 'Vos informations ont été mises à jour.');
    } catch {}
    setSavingProfile(false);
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('messenger_token');
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {}

    localStorage.removeItem('messenger_token');
    localStorage.removeItem('messenger_user');
    localStorage.removeItem('messenger_custom_avatar');
    localStorage.removeItem('oussama_conversations_v2');
    localStorage.removeItem('oussama_messages_v2');
    localStorage.removeItem('oussama_friends_v2');
    localStorage.setItem('messenger_logged_out', 'true');
    setIsAuthenticated(false);
    setCurrentUser({
      id: '',
      displayName: 'Non connecté',
      username: 'invite',
      avatarUrl: undefined,
      bio: 'Connectez-vous via SSO',
    });
    setConversations([]);
    setMessagesByRoom({});
    setFriends([]);
    setOnlineUsers([]);
    setSelectedRoomId(null);
    setMobileChatOpen(false);
    triggerNotification('Déconnexion réussie', 'Vous avez été déconnecté de votre session Oussama Messenger.');
  };

  // --- CONNECT WITH AN ONLINE USER (Message direct ou ajouter en ami) ---
  const handleStartChatWithOnlineUser = (user: PresenceUser) => {
    const existing = conversations.find(
      (c) => c.name.toLowerCase() === user.displayName.toLowerCase() || c.id === `room-user-${user.id}`
    );
    if (existing) {
      openConversation(existing.id);
      return;
    }

    const roomId = `room-user-${user.id}`;
    const newRoom: ConversationRoom = {
      id: roomId,
      name: user.displayName,
      isGroup: false,
      avatar: user.avatarUrl || '',
      lastMessage: 'Discussion en ligne démarrée',
      lastMessageType: 'text',
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      unread: 0,
      online: true,
      statusText: 'Connecté en même temps',
    };

    setConversations((prev) => [newRoom, ...prev]);
    setMessagesByRoom((prev) => ({ ...prev, [roomId]: [] }));
    openConversation(roomId);
  };

  const handleAddOnlineUserAsFriend = (user: PresenceUser) => {
    if (friends.some((f) => f.name.toLowerCase() === user.displayName.toLowerCase())) {
      triggerNotification('Déjà ami', `${user.displayName} est déjà dans votre liste d'amis.`);
      return;
    }

    const roomId = `room-user-${user.id}`;
    const newFriend: FriendContact = {
      id: `fr-${Date.now()}`,
      userId: user.id,
      name: user.displayName,
      handle: user.username.startsWith('@') ? user.username : `@${user.username}`,
      bio: user.bio || 'Connecté sur Oussama Messenger',
      activityBadge: 'Connecté maintenant',
      avatar: user.avatarUrl || '',
      online: true,
      favorite: false,
      letter: user.displayName.charAt(0).toUpperCase(),
      conversationId: roomId,
    };

    setFriends((prev) => [...prev, newFriend].sort((a, b) => a.name.localeCompare(b.name)));
    triggerNotification('Ami ajouté ✨', `${user.displayName} a été ajouté à votre liste d'amis.`);
  };

  // --- CONVERSATION & MESSAGING HANDLERS ---
  const openConversation = (roomId: string) => {
    setSelectedRoomId(roomId);
    setMobileChatOpen(true);
    setActiveTab('messages');
    setConversations((prev) =>
      prev.map((c) => (c.id === roomId ? { ...c, unread: 0 } : c))
    );
  };

  const currentRoom = conversations.find((c) => c.id === selectedRoomId) || conversations[0] || null;
  const currentMessages = currentRoom ? messagesByRoom[currentRoom.id] || [] : [];

  const handleCreateConversation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConvName.trim()) return;
    const roomId = `room-${Date.now()}`;
    const newRoom: ConversationRoom = {
      id: roomId,
      name: newConvName.trim(),
      isGroup: newConvIsGroup,
      avatar: '',
      lastMessage: 'Nouvelle conversation créée',
      lastMessageType: 'text',
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      unread: 0,
      online: true,
      statusText: newConvIsGroup ? 'Groupe actif' : 'En ligne',
    };
    setConversations((prev) => [newRoom, ...prev]);
    setMessagesByRoom((prev) => ({ ...prev, [roomId]: [] }));
    setNewConvName('');
    setNewConvIsGroup(false);
    setNewChatModalOpen(false);
    openConversation(roomId);
  };

  const sendMessage = async (
    textOverride?: string,
    typeOverride: 'text' | 'voice' | 'image' = 'text',
    extra?: Partial<ChatMessageItem>
  ) => {
    if (!currentRoom) return;
    const roomId = currentRoom.id;
    const content = (textOverride ?? chatInput).trim();
    if (!content && typeOverride === 'text') return;

    const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id || 'self',
      senderName: currentUser.displayName || 'Vous',
      senderAvatar: currentUser.avatarUrl,
      content: content || (typeOverride === 'voice' ? 'Message vocal' : 'Photo partagée'),
      timestamp: nowTime,
      isOwn: true,
      type: typeOverride,
      ...extra,
    };

    setMessagesByRoom((prev) => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), newMsg],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === roomId
          ? {
              ...c,
              lastMessage:
                typeOverride === 'voice'
                  ? `Note vocale (${extra?.voiceDuration || '0:10'})`
                  : typeOverride === 'image'
                  ? '📷 Photo partagée'
                  : content,
              lastMessageType: typeOverride === 'voice' ? 'voice' : 'text',
              timestamp: nowTime,
            }
          : c
      )
    );

    if (!textOverride) {
      setChatInput('');
    }

    const lower = content.toLowerCase();
    if (lower.includes('@oussama') || lower.startsWith('oussama') || lower.includes('@aura') || lower.startsWith('aura')) {
      try {
        const token = localStorage.getItem('messenger_token');
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            prompt: content,
            context: `Salon: ${currentRoom.name}`,
          }),
        });
        const data = await res.json();
        const aiText = data.textResponse || data.reply;
        if (aiText) {
          const botNote: ChatMessageItem = {
            id: `msg-oussama-${Date.now()}`,
            senderId: 'oussama-bot',
            senderName: 'Oussama Bot',
            content: aiText,
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            isOwn: false,
            type: 'aura-note',
            auraNoteData: {
              title: 'Oussama IA',
              text: aiText,
              actions: [{ label: '📋 Copier', actionType: 'copy' }],
            },
          };

          setMessagesByRoom((prev) => ({
            ...prev,
            [roomId]: [...(prev[roomId] || []), botNote],
          }));
        }
      } catch {}
    }
  };

  const finishVoiceRecording = () => {
    const secs = Math.max(2, recordingSeconds);
    const formatted = `0:${secs < 10 ? `0${secs}` : secs}`;
    setIsRecordingVoice(false);
    sendMessage('Message vocal', 'voice', {
      voiceCurrent: '0:00',
      voiceDuration: formatted,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      sendMessage(file.name.replace(/\.[^/.]+$/, '') || 'Photo partagée', 'image', {
        imageUrl: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  // --- FRIENDS / CONTACTS HANDLERS ---
  const handleAcceptFriendRequest = (req: FriendRequestItem) => {
    setFriendRequests((prev) => prev.filter((r) => r.id !== req.id));
    const newRoomId = `room-${req.id}`;
    const newFriend: FriendContact = {
      id: `fr-${Date.now()}`,
      name: req.name,
      handle: req.handle,
      bio: req.subtitle,
      activityBadge: 'En ligne',
      avatar: req.avatar,
      online: true,
      favorite: false,
      letter: req.name.charAt(0).toUpperCase(),
      conversationId: newRoomId,
    };
    setFriends((prev) => [...prev, newFriend].sort((a, b) => a.name.localeCompare(b.name)));

    setConversations((prev) => [
      {
        id: newRoomId,
        name: req.name,
        isGroup: false,
        avatar: req.avatar,
        lastMessage: 'Contact ajouté',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        unread: 0,
        online: true,
        statusText: 'En ligne',
      },
      ...prev,
    ]);
  };

  const handleDeclineFriendRequest = (id: string) => {
    setFriendRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleFriendFavorite = (friendId: string) => {
    setFriends((prev) =>
      prev.map((f) => (f.id === friendId ? { ...f, favorite: !f.favorite } : f))
    );
  };

  const handleCreateNewFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName.trim()) return;
    const handle = newFriendHandle.trim().startsWith('@')
      ? newFriendHandle.trim()
      : `@${newFriendHandle.trim() || newFriendName.toLowerCase().replace(/\s+/g, '.')}`;
    const roomId = `room-contact-${Date.now()}`;

    const created: FriendContact = {
      id: `fr-${Date.now()}`,
      name: newFriendName.trim(),
      handle,
      bio: 'Ami Oussama Messenger',
      activityBadge: 'En ligne',
      avatar: '',
      online: true,
      favorite: false,
      letter: newFriendName.trim().charAt(0).toUpperCase(),
      conversationId: roomId,
    };

    setFriends((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    setConversations((prev) => [
      {
        id: roomId,
        name: created.name,
        isGroup: false,
        avatar: '',
        lastMessage: 'Nouvelle discussion',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        unread: 0,
        online: true,
        statusText: 'En ligne',
      },
      ...prev,
    ]);
    setNewFriendName('');
    setNewFriendHandle('');
    setAddFriendModalOpen(false);
    triggerNotification('Ami ajouté', `${created.name} (${created.handle}) a été ajouté à vos amis.`);
  };

  // --- AURA IA ASSISTANT HANDLERS ---
  const sendAIMessage = async (promptOverride?: string) => {
    const prompt = (promptOverride ?? aiInput).trim();
    if (!prompt || aiLoading) return;

    const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const userEntry: AIMessageEntry = {
      id: `ai-u-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: nowTime,
    };

    setAiMessages((prev) => [...prev, userEntry]);
    if (!promptOverride) setAiInput('');
    setAiLoading(true);

    try {
      const token = localStorage.getItem('messenger_token');
      const historyPayload = aiMessages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const realContext = `Utilisateur: ${currentUser.displayName} (@${currentUser.username}). Connectés en ce moment: ${onlineUsers.length}. Nombre d'amis: ${friends.length}. Discussions: ${conversations.length}.`;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          prompt,
          context: realContext,
          messages: [...historyPayload, { role: 'user', content: prompt }],
        }),
      });

      const data = await res.json();
      const replyText =
        data.textResponse ||
        data.reply ||
        'Je suis prêt à vous aider.';

      const assistantEntry: AIMessageEntry = {
        id: `ai-a-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        action: data.action,
      };

      setAiMessages((prev) => [...prev, assistantEntry]);
    } catch {
      const errorEntry: AIMessageEntry = {
        id: `ai-a-${Date.now()}`,
        role: 'assistant',
        content: "Erreur de communication avec la passerelle IA LiteLLM. Veuillez réessayer.",
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      setAiMessages((prev) => [...prev, errorEntry]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleConfirmAIAction = async (msgId: string, actionId: string) => {
    try {
      const token = localStorage.getItem('messenger_token');
      await fetch(`/api/ai/actions/${actionId}/confirm`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {}

    setAiMessages((prev) =>
      prev.map((m) =>
        m.id === msgId && m.action ? { ...m, action: { ...m.action, status: 'executed' } } : m
      )
    );
    triggerNotification('Action exécutée par Oussama ✨', 'Votre demande a été exécutée.');
  };

  // --- CALL HANDLERS ---
  const startCall = async (targetName: string, targetAvatar: string | undefined, type: 'audio' | 'video') => {
    setActiveCall({
      active: true,
      type,
      targetName,
      targetAvatar,
      duration: 0,
      muted: false,
    });

    try {
      const token = localStorage.getItem('messenger_token');
      await fetch('/api/calls/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ roomName: targetName, callType: type }),
      });
    } catch {}
  };

  // Filtered lists
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      !msgSearchQuery.trim() ||
      c.name.toLowerCase().includes(msgSearchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(msgSearchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (msgFilter === 'unread') return c.unread > 0;
    if (msgFilter === 'ai') return Boolean(c.isAI);
    if (msgFilter === 'friends') return !c.isGroup;
    return true;
  });

  // Confirmed friends with online status synced against real presence
  const friendsWithOnlineStatus = friends.map((f) => {
    const isActuallyOnline = onlineUsers.some(
      (u) =>
        (f.userId && u.id === f.userId) ||
        u.displayName.toLowerCase() === f.name.toLowerCase() ||
        u.username.toLowerCase() === f.handle.replace('@', '').toLowerCase()
    );
    return {
      ...f,
      online: isActuallyOnline || f.online,
    };
  });

  const filteredFriends = friendsWithOnlineStatus.filter((f) => {
    const matchesSearch =
      !friendSearchQuery.trim() ||
      f.name.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
      f.handle.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
      f.bio.toLowerCase().includes(friendSearchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (friendFilter === 'online') return f.online;
    if (friendFilter === 'favorites') return f.favorite;
    return true;
  });

  const groupedFriends = filteredFriends.reduce<Record<string, FriendContact[]>>((acc, friend) => {
    const letter = friend.letter || friend.name.charAt(0).toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(friend);
    return acc;
  }, {});

  const totalUnreadCount = conversations.reduce((sum, c) => sum + c.unread, 0);

  // Other online users connected at the same time (excluding current user)
  const otherOnlineUsers = onlineUsers.filter((u) => u.id !== currentUser.id);

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? `0${s}` : s}`;
  };

  // ============================================================================
  // RENDERERS
  // ============================================================================

  const renderTopAppHeader = () => (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 shrink-0 safe-top">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <span className="text-[19px] font-extrabold tracking-tight text-slate-900">Oussama</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setActiveTab('messages');
            setMobileChatOpen(false);
          }}
          title="Rechercher"
          className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          onClick={requestBrowserNotifications}
          title="Activer les notifications"
          className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition relative"
        >
          <Radio className="w-4 h-4 text-indigo-600" />
          {notifPermission === 'granted' && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          )}
        </button>
        <button
          onClick={() => setAuthModalOpen(true)}
          title={isAuthenticated ? `${currentUser.displayName} (Profil & SSO)` : 'Se connecter via SSO'}
          className="relative ml-0.5 focus:outline-none"
        >
          {renderAvatar(currentUser.avatarUrl, currentUser.displayName, 'w-9 h-9', 'text-xs')}
          <span
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
              isAuthenticated ? 'bg-emerald-500' : 'bg-amber-400'
            }`}
          />
        </button>
      </div>
    </header>
  );

  // SCREEN 1: MESSAGES & ONLINE USERS IN LEFT PANEL
  const renderMessagesListScreen = () => (
    <div className="flex flex-col h-full bg-[#F8FAFC] overflow-hidden relative">
      {/* Search Bar */}
      <div className="px-4 pt-3 pb-2 bg-white">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-2xl px-3.5 py-2.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={msgSearchQuery}
            onChange={(e) => setMsgSearchQuery(e.target.value)}
            placeholder="Rechercher une conversation, un contact ou l'IA..."
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={() => setMsgFilter(msgFilter === 'unread' ? 'all' : 'unread')}
            className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-500 transition"
            title="Filtrer"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* EN LIGNE EN DIRECT Carousel (Utilisateurs connectés en même temps) */}
        <div className="px-4 py-3 bg-white border-b border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-600">
                CONNECTÉS EN DIRECT ({onlineUsers.length})
              </span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600">
              Temps réel
            </span>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1">
            {/* Oussama IA bot */}
            <button
              onClick={() => setActiveTab('ai')}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
            >
              <div className="relative">
                <div className="w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-indigo-600 via-violet-500 to-fuchsia-500 shadow-md shadow-indigo-500/20">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center ring-2 ring-white shadow">
                  <Zap className="w-2.5 h-2.5 fill-current" />
                </span>
              </div>
              <span className="text-xs font-semibold text-indigo-600">Oussama IA</span>
            </button>

            {/* Current user badge if authenticated */}
            {isAuthenticated && (
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="relative">
                  <div className="w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-emerald-500 to-teal-400">
                    {renderAvatar(currentUser.avatarUrl, currentUser.displayName, 'w-full h-full', 'text-xs')}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <span className="text-xs font-bold text-slate-800 truncate max-w-[68px]">
                  Vous (Moi)
                </span>
              </div>
            )}

            {/* Real online users connected at the same time */}
            {otherOnlineUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleStartChatWithOnlineUser(user)}
                className="flex flex-col items-center gap-1.5 shrink-0 group"
                title={`Cliquez pour discuter avec ${user.displayName}`}
              >
                <div className="relative">
                  <div className="w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 to-emerald-400 group-hover:scale-105 transition">
                    {renderAvatar(user.avatarUrl, user.displayName, 'w-full h-full', 'text-xs')}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <span className="text-xs font-medium text-slate-700 truncate max-w-[70px]">
                  {user.displayName.split(' ')[0]}
                </span>
              </button>
            ))}

            {otherOnlineUsers.length === 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 text-xs shrink-0">
                <Users className="w-4 h-4 text-slate-300" />
                <span>En attente d&apos;autres utilisateurs en ligne</span>
              </div>
            )}
          </div>
        </div>

        {/* Section: Utilisateurs connectés en direct (liste détaillée) */}
        {otherOnlineUsers.length > 0 && (
          <div className="px-4 pt-3 pb-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                En ligne en même temps ({otherOnlineUsers.length})
              </span>
            </div>
            <div className="space-y-2">
              {otherOnlineUsers.map((user) => {
                const isFriend = friends.some((f) => f.name.toLowerCase() === user.displayName.toLowerCase());
                return (
                  <div
                    key={user.id}
                    className="p-2.5 rounded-2xl bg-white border border-emerald-100/80 shadow-2xs flex items-center justify-between gap-3 hover:border-emerald-300 transition"
                  >
                    <div
                      onClick={() => handleStartChatWithOnlineUser(user)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="relative shrink-0">
                        {renderAvatar(user.avatarUrl, user.displayName, 'w-10 h-10', 'text-xs')}
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {user.displayName}
                          </h4>
                          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded-md">
                            Actif
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">@{user.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isFriend && (
                        <button
                          onClick={() => handleAddOnlineUserAsFriend(user)}
                          className="p-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition"
                          title="Ajouter en ami"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleStartChatWithOnlineUser(user)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#5B4FE9] hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1 transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Discuter
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Pills */}
        <div className="px-4 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setMsgFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 transition ${
              msgFilter === 'all'
                ? 'bg-[#5B4FE9] text-white shadow-sm shadow-indigo-500/25'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            Discussions
            <span
              className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                msgFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {conversations.length}
            </span>
          </button>

          <button
            onClick={() => setMsgFilter('unread')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 transition ${
              msgFilter === 'unread'
                ? 'bg-[#5B4FE9] text-white shadow-sm shadow-indigo-500/25'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            Non lus
            <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-indigo-50 text-indigo-600 font-bold">
              {totalUnreadCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('friends')}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 bg-white text-slate-700 border border-slate-200/80 hover:border-indigo-300 transition"
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            Amis ({friends.length})
          </button>
        </div>

        {/* SSO Connection Prompt Banner if not logged in */}
        {!isAuthenticated && (
          <div className="px-4 mb-3">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-white to-violet-50 border border-indigo-200/90 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#5B4FE9] text-white flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Connectez votre compte SSO</h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Soyez visible en direct par les autres utilisateurs connectés
                  </p>
                </div>
              </div>
              <button
                onClick={handleSSOLoginRedirect}
                className="px-3.5 py-2 rounded-xl bg-[#5B4FE9] hover:bg-indigo-700 text-white text-xs font-bold shrink-0 shadow-xs transition"
              >
                Connexion SSO
              </button>
            </div>
          </div>
        )}

        {/* Conversation Cards List */}
        <div className="px-4 space-y-2.5">
          {filteredConversations.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white border border-slate-200/70 text-center space-y-3 my-2 shadow-2xs">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5B4FE9] flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Aucune discussion ouverte</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Cliquez sur un utilisateur connecté ci-dessus, créez une discussion ou écrivez à Oussama IA.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => setNewChatModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#5B4FE9] hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  Nouvelle discussion
                </button>
              </div>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedRoomId === conv.id && mobileChatOpen;
              return (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv.id)}
                  className={`w-full text-left p-3.5 rounded-2xl bg-white border transition flex items-center gap-3.5 shadow-2xs hover:shadow-md ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/10'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="relative shrink-0">
                    {renderAvatar(conv.avatar, conv.name, 'w-12 h-12', 'text-sm')}
                    {conv.online && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white z-20" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{conv.name}</h3>
                      <span
                        className={`text-[11px] shrink-0 ${
                          conv.unread > 0 ? 'font-bold text-indigo-600' : 'text-slate-400'
                        }`}
                      >
                        {conv.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                        {conv.lastMessageType === 'voice' ? (
                          <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold">
                            <Mic className="w-3.5 h-3.5" />
                            {conv.lastMessage}
                          </span>
                        ) : (
                          <span className={conv.unread > 0 ? 'font-medium text-slate-800 truncate' : 'truncate'}>
                            {conv.lastMessage}
                          </span>
                        )}
                      </div>

                      {conv.unread > 0 ? (
                        <span className="w-5 h-5 rounded-full bg-[#5B4FE9] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {conv.unread}
                        </span>
                      ) : (
                        <CheckCheck className="w-4 h-4 text-indigo-500 shrink-0" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setNewChatModalOpen(true)}
        title="Nouvelle discussion"
        className="absolute bottom-5 right-5 w-14 h-14 rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#6366F1] text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition z-20"
      >
        <Plus className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow ring-2 ring-white">
          <Sparkles className="w-3.5 h-3.5 fill-current" />
        </span>
      </button>
    </div>
  );

  // SCREEN 2 & 3: CONVERSATION VIEW
  const renderConversationView = () => {
    if (!currentRoom) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-[#F8FAFC] p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-[#5B4FE9] flex items-center justify-center mb-3">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">Sélectionnez ou créez une discussion</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Choisissez un utilisateur connecté ou démarrez une nouvelle conversation.
          </p>
          <button
            onClick={() => setNewChatModalOpen(true)}
            className="mt-4 px-4 py-2.5 rounded-xl bg-[#5B4FE9] hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Nouvelle conversation
          </button>
        </div>
      );
    }

    const room = currentRoom;
    const msgs = currentMessages;

    return (
      <div className="flex flex-col h-full bg-[#F8FAFC] overflow-hidden">
        {/* Top Navigation Sub-bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-100 shrink-0 safe-top">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileChatOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition"
              title="Retour aux discussions"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-7 h-7 rounded-lg bg-[#5B4FE9] flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-800">
              {room.isGroup ? 'Groupe' : 'Conversation'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ai')}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
              title="Assistant IA"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {renderAvatar(currentUser.avatarUrl, currentUser.displayName, 'w-8 h-8', 'text-xs')}
          </div>
        </div>

        {/* Contact / Group Header Bar */}
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              {renderAvatar(room.avatar, room.name, 'w-11 h-11', 'text-sm')}
              {room.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 truncate">{room.name}</h2>
              <p className="text-xs text-emerald-600 font-medium truncate flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {room.statusText || 'En ligne'}
              </p>
            </div>
          </div>

          {/* Call Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => startCall(room.name, room.avatar, 'audio')}
              className="w-9 h-9 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition"
              title="Appel vocal WebRTC"
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => startCall(room.name, room.avatar, 'video')}
              className="w-9 h-9 rounded-full bg-[#5B4FE9] hover:bg-indigo-700 text-white flex items-center justify-center shadow-sm shadow-indigo-500/25 transition"
              title="Appel vidéo LiveKit"
            >
              <Video className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="flex justify-center">
            <span className="px-3 py-1 rounded-full bg-white border border-slate-200/80 text-[11px] font-semibold text-slate-500 inline-flex items-center gap-1.5 shadow-2xs">
              <Calendar className="w-3 h-3 text-indigo-500" />
              Aujourd&apos;hui
            </span>
          </div>

          {msgs.length === 0 && (
            <div className="text-center py-12 text-xs text-slate-400">
              Aucun message dans cette conversation. Écrivez votre premier message ci-dessous.
            </div>
          )}

          {msgs.map((msg) => {
            if (msg.type === 'aura-note' && msg.auraNoteData) {
              return (
                <div
                  key={msg.id}
                  className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-violet-50/50 to-white border border-indigo-200/90 shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#5B4FE9] text-white flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-extrabold text-indigo-950">Oussama Bot</span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase">
                        ASSISTANT
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{msg.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {msg.auraNoteData.text}
                  </p>
                </div>
              );
            }

            if (msg.type === 'voice') {
              const isPlaying = playingVoiceId === msg.id;
              const bars = [35, 65, 45, 85, 55, 95, 70, 40, 60, 80, 50, 30, 75, 60, 40, 50];
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2.5 ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[82%] sm:max-w-sm rounded-2xl p-3.5 shadow-xs border ${
                      msg.isOwn
                        ? 'bg-[#5B4FE9] text-white border-indigo-600 rounded-br-xs'
                        : 'bg-white text-slate-800 border-slate-200/80 rounded-bl-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setPlayingVoiceId(isPlaying ? null : msg.id)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition shadow-xs ${
                          msg.isOwn
                            ? 'bg-white text-[#5B4FE9]'
                            : 'bg-[#5B4FE9] text-white hover:bg-indigo-700'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>

                      <div className="flex-1 min-w-[150px]">
                        <div className="flex items-center gap-1 h-7">
                          {bars.map((h, i) => (
                            <span
                              key={i}
                              className={`w-1 rounded-full transition-all duration-300 ${
                                msg.isOwn
                                  ? i < 7 || isPlaying
                                    ? 'bg-white'
                                    : 'bg-white/40'
                                  : i < 7 || isPlaying
                                  ? 'bg-[#5B4FE9]'
                                  : 'bg-slate-200'
                              } ${isPlaying ? 'animate-pulse' : ''}`}
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                        <div
                          className={`flex items-center justify-between text-[11px] mt-1 ${
                            msg.isOwn ? 'text-indigo-100' : 'text-slate-400'
                          }`}
                        >
                          <span>{msg.voiceDuration || '0:10'}</span>
                          <span className="font-medium">Message vocal</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            if (msg.type === 'image' && msg.imageUrl) {
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2.5 ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-[82%] sm:max-w-sm bg-white border border-slate-200/80 rounded-2xl p-2 shadow-xs">
                    <div className="relative rounded-xl overflow-hidden">
                      <img src={msg.imageUrl} alt={msg.content} className="w-full max-h-60 object-cover" />
                    </div>
                    <div className="px-2 pt-2 pb-1 flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-slate-800">{msg.content}</p>
                      <span className="text-[10px] text-slate-400 shrink-0">{msg.timestamp}</span>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-md px-4 py-2.5 rounded-2xl shadow-2xs ${
                    msg.isOwn
                      ? 'bg-[#5B4FE9] text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  <p className="text-[13.5px] leading-relaxed whitespace-pre-line">{msg.content}</p>
                  <div
                    className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                      msg.isOwn ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.isOwn && <CheckCheck className="w-3.5 h-3.5 text-indigo-200" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Message Input Bar */}
        <div className="px-3 py-2.5 bg-white border-t border-slate-200/80 flex items-center gap-2 shrink-0 safe-bottom">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 transition"
            title="Partager une image"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {isRecordingVoice ? (
            <div className="flex-1 flex items-center justify-between bg-rose-50 border border-rose-200 rounded-full px-4 py-2">
              <div className="flex items-center gap-2 text-rose-600 text-xs font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                Enregistrement vocal... {formatSeconds(recordingSeconds)}
              </div>
              <button
                onClick={finishVoiceRecording}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Envoyer
              </button>
            </div>
          ) : (
            <div className="flex-1 flex items-center bg-slate-50 border border-slate-200/90 rounded-full px-4 py-2 focus-within:border-indigo-500 focus-within:bg-white transition">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Écrire un message (ou @Oussama)..."
                className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              <button
                onClick={() => setIsRecordingVoice(true)}
                className="text-slate-400 hover:text-indigo-600 ml-2 transition"
                title="Enregistrer une note vocale"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={() => (isRecordingVoice ? finishVoiceRecording() : sendMessage())}
            className="w-10 h-10 rounded-full bg-[#5B4FE9] hover:bg-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/25 transition"
            title="Envoyer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // SCREEN 4: AMIS SEULEMENT (Exclusive list for friends)
  const renderFriendsScreen = () => (
    <div className="flex flex-col h-full bg-[#F8FAFC] overflow-hidden">
      <div className="px-4 pt-3 pb-2 bg-white flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900">Mes Amis</h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">
              {friends.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Liste exclusive de vos amis ajoutés
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setQrModalOpen(true)}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 transition"
            title="Mon QR Code Oussama"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <button
            onClick={() => setAddFriendModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#5B4FE9] hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm shadow-indigo-500/25 transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Ajouter un ami
          </button>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="px-4 py-2 bg-white border-b border-slate-100">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-2xl px-3.5 py-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={friendSearchQuery}
            onChange={(e) => setFriendSearchQuery(e.target.value)}
            placeholder="Rechercher un ami par nom ou @pseudo..."
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2.5 pb-1">
          <button
            onClick={() => setFriendFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition ${
              friendFilter === 'all'
                ? 'bg-[#5B4FE9] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Tous mes amis ({friends.length})
          </button>
          <button
            onClick={() => setFriendFilter('online')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 transition ${
              friendFilter === 'online'
                ? 'bg-[#5B4FE9] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            En ligne ({friendsWithOnlineStatus.filter((f) => f.online).length})
          </button>
          <button
            onClick={() => setFriendFilter('favorites')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 inline-flex items-center gap-1 transition ${
              friendFilter === 'favorites'
                ? 'bg-[#5B4FE9] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            ⭐ Favoris ({friends.filter((f) => f.favorite).length})
          </button>
          <button
            onClick={() => setFriendFilter('requests')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 inline-flex items-center gap-1 transition ${
              friendFilter === 'requests'
                ? 'bg-[#5B4FE9] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Demandes ({friendRequests.length})
          </button>
        </div>
      </div>

      {/* Scrollable Friends Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-24">
        {friendRequests.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
              Demandes d&apos;amis ({friendRequests.length})
            </h2>
            <div className="space-y-2">
              {friendRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3 rounded-2xl bg-white border border-slate-200/70 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {renderAvatar(req.avatar, req.name, 'w-11 h-11', 'text-sm')}
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{req.name}</h4>
                      <p className="text-xs text-slate-500 truncate">{req.handle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleAcceptFriendRequest(req)}
                      className="w-8 h-8 rounded-full bg-[#5B4FE9] text-white flex items-center justify-center"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeclineFriendRequest(req.id)}
                      className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredFriends.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-slate-200/70 text-center space-y-3 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5B4FE9] flex items-center justify-center mx-auto">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Aucun ami dans votre liste</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Ajoutez des utilisateurs connectés ou invitez vos contacts pour les retrouver dans cette liste réservée à vos amis.
              </p>
            </div>
            <button
              onClick={() => setAddFriendModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#5B4FE9] hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition"
            >
              <UserPlus className="w-4 h-4" />
              Ajouter un ami
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.keys(groupedFriends)
              .sort()
              .map((letter) => (
                <div key={letter}>
                  <div className="text-xs font-extrabold text-indigo-600 px-1 mb-2">{letter}</div>
                  <div className="space-y-2">
                    {groupedFriends[letter].map((friend) => (
                      <div
                        key={friend.id}
                        className="p-3 rounded-2xl bg-white border border-slate-200/70 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            {renderAvatar(friend.avatar, friend.name, 'w-11 h-11', 'text-sm')}
                            <span
                              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white ${
                                friend.online ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-bold text-slate-900 truncate">
                                {friend.name}
                              </h4>
                              <span className="text-[11px] text-slate-400 truncate">
                                {friend.handle}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">
                              {friend.online ? (
                                <span className="text-emerald-600 font-semibold">En ligne en ce moment</span>
                              ) : (
                                friend.bio
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => toggleFriendFavorite(friend.id)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                              friend.favorite
                                ? 'text-amber-400 bg-amber-50'
                                : 'text-slate-300 hover:text-amber-400 hover:bg-slate-50'
                            }`}
                            title="Favori"
                          >
                            <Star className={`w-4 h-4 ${friend.favorite ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() =>
                              friend.conversationId && openConversation(friend.conversationId)
                            }
                            className="w-8 h-8 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition"
                            title="Envoyer un message"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => startCall(friend.name, friend.avatar, 'audio')}
                            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition"
                            title="Appeler"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );

  // SCREEN 5: OUSSAMA IA ASSISTANT
  const renderAIAssistantScreen = () => (
    <div className="flex flex-col h-full bg-[#F8FAFC] overflow-hidden">
      <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5B4FE9] to-[#7C3AED] flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">Oussama IA</h2>
              <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-extrabold uppercase">
                PRO
              </span>
            </div>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              En ligne • Modèle multimodal actif
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <button
              onClick={() => {
                setAdminModalOpen(true);
                fetchAdminDiscussions();
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold inline-flex items-center gap-1.5 transition border border-indigo-200 shadow-2xs"
              title="Superadmin: Voir les discussions de tous les utilisateurs avec l'IA"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Audit Discussions IA</span>
              <span className="px-1.5 py-0.5 rounded-md bg-indigo-600 text-white text-[9px] font-extrabold">SUPERADMIN</span>
            </button>
          )}
          {aiMessages.length > 0 && (
            <button
              onClick={() => setAiMessages([])}
              className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition"
              title="Effacer la conversation IA"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable AI Conversation Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/60 border border-indigo-100 text-center shadow-2xs">
          <p className="text-xs font-medium text-slate-700">
            Bonjour {isAuthenticated ? currentUser.displayName : ''} ! Posez une question à Oussama IA ou demandez-lui de rédiger ou planifier un message.
          </p>
        </div>

        {/* SUGGESTIONS RAPIDES */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            SUGGESTIONS RAPIDES
          </span>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => sendAIMessage('Aide-moi à rédiger un message professionnel')}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200/80 text-xs font-semibold text-slate-700 shrink-0 inline-flex items-center gap-1.5 shadow-2xs transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Rédiger un message
            </button>
            <button
              onClick={() => sendAIMessage('Comment fonctionne le chiffrement E2EE sur Oussama Messenger ?')}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200/80 text-xs font-semibold text-slate-700 shrink-0 inline-flex items-center gap-1.5 shadow-2xs transition"
            >
              🔒 Sécurité & E2EE
            </button>
          </div>
        </div>

        {aiMessages.map((entry) => {
          if (entry.role === 'user') {
            return (
              <div key={entry.id} className="flex justify-end">
                <div className="max-w-[85%] sm:max-w-md bg-[#5B4FE9] text-white px-4 py-3 rounded-2xl rounded-br-xs shadow-xs">
                  <p className="text-xs sm:text-sm leading-relaxed">{entry.content}</p>
                  <span className="block text-right text-[10px] text-indigo-200 mt-1">
                    {entry.timestamp}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div key={entry.id} className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#5B4FE9] text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>

              <div className="flex-1 max-w-lg bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-indigo-600 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Oussama IA
                  </span>
                  <span className="text-[10px] text-slate-400">{entry.timestamp}</span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {entry.content}
                </p>

                {entry.action && (
                  <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2">
                    <div className="text-xs font-bold text-indigo-950">
                      Action d&apos;orchestration préparée
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-line">
                      {entry.action.previewText}
                    </p>
                    {entry.action.status === 'pending' ? (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleConfirmAIAction(entry.id, entry.action!.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#5B4FE9] text-white text-xs font-bold hover:bg-indigo-700 transition"
                        >
                          Confirmer l&apos;envoi
                        </button>
                      </div>
                    ) : (
                      <span className="inline-block text-xs font-bold text-emerald-600">
                        ✓ Action confirmée et exécutée
                      </span>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(entry.content);
                      triggerNotification('Copié 📋', 'La réponse Oussama IA a été copiée.');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copier
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {aiLoading && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5B4FE9] text-white flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-medium text-slate-600">
              Oussama IA réfléchit...
            </div>
          </div>
        )}
        <div ref={aiEndRef} />
      </div>

      {/* Bottom AI Prompt Input Bar */}
      <div className="px-3 py-2.5 bg-white border-t border-slate-200/80 flex items-center gap-2 shrink-0 safe-bottom">
        <div className="flex-1 flex items-center bg-slate-50 border border-slate-200/90 rounded-full px-4 py-2 focus-within:border-indigo-500 focus-within:bg-white transition">
          <input
            type="text"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAIMessage();
              }
            }}
            placeholder="Posez une question à Oussama IA..."
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <button
          onClick={() => sendAIMessage()}
          disabled={aiLoading}
          className="w-10 h-10 rounded-full bg-[#5B4FE9] hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/25 transition"
          title="Envoyer à Oussama IA"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // SCREEN 6: PARAMÈTRES
  const renderSettingsScreen = () => (
    <div className="flex flex-col h-full bg-[#F8FAFC] overflow-y-auto px-4 py-4 space-y-4 pb-24">
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        className="hidden"
      />

      <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="relative group">
              {renderAvatar(currentUser.avatarUrl, currentUser.displayName, 'w-20 h-20', 'text-xl')}
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#5B4FE9] hover:bg-indigo-700 text-white flex items-center justify-center shadow-md ring-2 ring-white transition"
                title="Changer ma photo de profil"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-lg font-extrabold text-slate-900">{currentUser.displayName}</h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isAuthenticated
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {isAuthenticated ? 'Connecté SSO' : 'Non connecté'}
                </span>
              </div>
              {isAuthenticated && (
                <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                  {currentUser.matrixUserId || `@${currentUser.username}:messenger.oussamma.tn`}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2.5">
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold inline-flex items-center gap-1.5 transition"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Changer la photo
                </button>
                {typeof window !== 'undefined' && localStorage.getItem('messenger_custom_avatar') && (
                  <button
                    onClick={handleResetToSSOAvatar}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                  >
                    Utiliser la photo SSO
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold inline-flex items-center gap-1.5 transition"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            ) : (
              <button
                onClick={handleSSOLoginRedirect}
                className="px-5 py-2.5 rounded-xl bg-[#5B4FE9] hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition"
              >
                <LogIn className="w-4 h-4" />
                Se connecter avec SSO
              </button>
            )}
          </div>
        </div>

        {isAuthenticated && (
          <form onSubmit={handleSaveProfileInfo} className="pt-4 border-t border-slate-100 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Nom affiché
                </label>
                <input
                  type="text"
                  value={profileDisplayName}
                  onChange={(e) => setProfileDisplayName(e.target.value)}
                  placeholder="Votre nom"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Statut / Bio
                </label>
                <input
                  type="text"
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="Disponible"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-4 py-2 rounded-xl bg-[#5B4FE9] hover:bg-indigo-700 text-white text-xs font-bold transition"
              >
                {savingProfile ? 'Enregistrement...' : 'Enregistrer le profil'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Superadmin Audit Card */}
      {isSuperAdmin && (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg shadow-indigo-950/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-white">Console Superadmin</h3>
                  <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-extrabold uppercase tracking-wider">
                    Privilèges Actifs
                  </span>
                </div>
                <p className="text-xs text-indigo-200/80">Audit de sécurité et surveillance des échanges IA</p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-indigo-200">
              Surveillez en direct toutes les discussions que les utilisateurs mènent avec <strong>Oussama IA</strong>.
            </div>
            <button
              onClick={() => {
                setAdminModalOpen(true);
                fetchAdminDiscussions();
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-sm transition shrink-0"
            >
              <Eye className="w-4 h-4" />
              Consulter les discussions IA ({adminDiscussions.length})
            </button>
          </div>
        </div>
      )}

      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-3 shadow-2xs">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Authentification SSO Oussamma
        </h3>

        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm font-bold text-slate-800">Serveur SSO Centralisé</div>
            <div className="text-xs text-slate-500">
              https://sso-a.oussamma.tn (Synchronisation automatique du profil et de la photo)
            </div>
          </div>
          <button
            onClick={handleSSOLoginRedirect}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition shrink-0"
          >
            {isAuthenticated ? 'Resynchroniser SSO' : 'Connexion SSO'}
          </button>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-3 shadow-2xs">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Notifications Push & Temps Réel
        </h3>

        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">Alertes sonores & bannières</div>
              <div className="text-xs text-slate-500">
                Permission navigateur : <span className="font-semibold">{notifPermission}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`w-12 h-6 rounded-full transition p-0.5 ${
              notificationsEnabled ? 'bg-[#5B4FE9]' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow transition transform ${
                notificationsEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-slate-500">
            Autoriser et tester les notifications du navigateur
          </span>
          <button
            onClick={requestBrowserNotifications}
            className="px-3.5 py-1.5 rounded-xl bg-[#5B4FE9] hover:bg-indigo-700 text-white text-xs font-bold transition shrink-0"
          >
            Activer / Tester 🔔
          </button>
        </div>
      </div>
    </div>
  );

  const renderAuthGateScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-slate-50 via-white to-indigo-50/40 overflow-y-auto">
      <div className="w-full max-w-md p-6 sm:p-8 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-2xl shadow-indigo-500/10 flex flex-col items-center text-center space-y-6">
        {/* Brand Icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold tracking-wide">
            <Shield className="w-3.5 h-3.5" />
            Écosystème Oussama • Accès Sécurisé
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Ecosystem Smart Messenger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
            Pour accéder à vos messages chiffrés, vos contacts et vos assistants IA, veuillez vous connecter avec votre compte SSO.
          </p>
        </div>

        {/* SSO Login Action */}
        <div className="w-full space-y-3">
          <button
            onClick={handleSSOLoginRedirect}
            disabled={authLoading}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:from-[#4338CA] hover:to-[#4F46E5] active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
          >
            {authLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Connexion SSO en cours...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Se connecter avec le SSO</span>
              </>
            )}
          </button>
          <p className="text-[11px] text-slate-400">
            Serveur d&apos;authentification : <span className="font-semibold text-slate-600">sso-a.oussamma.tn</span>
          </p>
        </div>

        {/* Security / Ecosystem Features */}
        <div className="w-full pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-left">
          <div className="p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col items-center text-center space-y-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-bold text-slate-700">Chiffrement</span>
            <span className="text-[9px] text-slate-400 leading-tight">Matrix & E2EE</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col items-center text-center space-y-1">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-[10px] font-bold text-slate-700">Oussama IA</span>
            <span className="text-[9px] text-slate-400 leading-tight">LiteLLM Intégré</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col items-center text-center space-y-1">
            <Activity className="w-4 h-4 text-violet-600" />
            <span className="text-[10px] font-bold text-slate-700">Temps Réel</span>
            <span className="text-[9px] text-slate-400 leading-tight">Présence Live</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (!authChecked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full bg-[#F8FAFC]">
        <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 animate-pulse">
          <Sparkles className="w-7 h-7" />
        </div>
        <Loader2 className="w-6 h-6 text-[#4F46E5] animate-spin mb-2" />
        <p className="text-xs font-semibold text-slate-500">Vérification de la session SSO...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-[100dvh] w-full bg-[#F8FAFC] text-slate-900 overflow-hidden select-none">
        {/* Floating Real-time Toast Notifications */}
        {toasts.length > 0 && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md space-y-2 pointer-events-none">
            {toasts.map((t) => (
              <div
                key={t.id}
                className="pointer-events-auto p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-indigo-200 shadow-xl shadow-indigo-500/10 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#5B4FE9] text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-extrabold text-slate-900 truncate">{t.title}</h4>
                  <p className="text-xs text-slate-600 truncate mt-0.5">{t.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {renderAuthGateScreen()}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#F8FAFC] text-slate-900 overflow-hidden select-none">
      {/* Floating Real-time Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md space-y-2 pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              onClick={() => {
                if (t.roomId) openConversation(t.roomId);
                setToasts((prev) => prev.filter((item) => item.id !== t.id));
              }}
              className="pointer-events-auto cursor-pointer p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-indigo-200 shadow-xl shadow-indigo-500/10 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[#5B4FE9] text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-extrabold text-slate-900 truncate">{t.title}</h4>
                <p className="text-xs text-slate-600 truncate mt-0.5">{t.body}</p>
              </div>
              <Volume2 className="w-4 h-4 text-indigo-500 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Top App Bar */}
      <div className={mobileChatOpen && activeTab === 'messages' ? 'hidden md:block' : 'block'}>
        {renderTopAppHeader()}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {activeTab === 'messages' && (
          <>
            <div
              className={`w-full md:w-[380px] lg:w-[420px] md:border-r md:border-slate-200/80 h-full flex flex-col ${
                mobileChatOpen ? 'hidden md:flex' : 'flex'
              }`}
            >
              {renderMessagesListScreen()}
            </div>

            <div
              className={`flex-1 h-full flex flex-col ${
                mobileChatOpen ? 'flex' : 'hidden md:flex'
              }`}
            >
              {renderConversationView()}
            </div>
          </>
        )}

        {activeTab === 'friends' && (
          <div className="w-full max-w-3xl mx-auto h-full flex flex-col bg-white md:border-x md:border-slate-200/70">
            {renderFriendsScreen()}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="w-full max-w-3xl mx-auto h-full flex flex-col bg-white md:border-x md:border-slate-200/70">
            {renderAIAssistantScreen()}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="w-full max-w-3xl mx-auto h-full flex flex-col">
            {renderSettingsScreen()}
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="bg-white border-t border-slate-200/80 px-2 py-1.5 flex items-center justify-around shrink-0 safe-bottom z-30">
        <button
          onClick={() => {
            setActiveTab('messages');
            setMobileChatOpen(false);
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition relative ${
            activeTab === 'messages' ? 'text-[#5B4FE9]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 min-w-[16px] h-4 rounded-full bg-[#5B4FE9] text-white text-[10px] font-bold flex items-center justify-center">
                {totalUnreadCount}
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold">Messages</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('friends');
            setMobileChatOpen(false);
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition relative ${
            activeTab === 'friends' ? 'text-[#5B4FE9]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[11px] font-bold">Amis ({friends.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('ai');
            setMobileChatOpen(false);
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
            activeTab === 'ai' ? 'text-[#5B4FE9]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[11px] font-bold">IA Assistant</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('settings');
            setMobileChatOpen(false);
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
            activeTab === 'settings' ? 'text-[#5B4FE9]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[11px] font-bold">Paramètres</span>
        </button>
      </nav>

      {/* ========================================================================== */}
      {/* MODALS                                                                     */}
      {/* ========================================================================== */}

      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#5B4FE9] text-white flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Mon Compte & Photo SSO
                  </h3>
                  <p className="text-xs text-slate-500">Authentification OIDC sso-a.oussamma.tn</p>
                </div>
              </div>
              <button
                onClick={() => setAuthModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {renderAvatar(currentUser.avatarUrl, currentUser.displayName, 'w-14 h-14', 'text-base')}
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#5B4FE9] text-white flex items-center justify-center shadow ring-2 ring-white"
                    title="Modifier ma photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{currentUser.displayName}</div>
                  <div className="text-xs text-slate-500">
                    {isAuthenticated ? `@${currentUser.username}` : 'Non connecté'}
                  </div>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="text-[11px] font-bold text-indigo-600 hover:underline mt-0.5"
                  >
                    Changer ma photo de profil
                  </button>
                </div>
              </div>

              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1 transition shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Déconnexion
                </button>
              )}
            </div>

            <button
              onClick={handleSSOLoginRedirect}
              disabled={authLoading}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:opacity-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-500/25 transition"
            >
              {authLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              {isAuthenticated
                ? 'Resynchroniser mon profil & ma photo SSO'
                : 'Se connecter avec mon compte SSO (sso-a.oussamma.tn)'}
            </button>
          </div>
        </div>
      )}

      {/* Add Friend Modal */}
      {addFriendModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateNewFriend}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">Ajouter un ami</h3>
              <button
                type="button"
                onClick={() => setAddFriendModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Nom de votre ami</label>
              <input
                type="text"
                required
                placeholder="Nom complet"
                value={newFriendName}
                onChange={(e) => setNewFriendName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                Pseudo @handle ou Email SSO
              </label>
              <input
                type="text"
                placeholder="@pseudo"
                value={newFriendHandle}
                onChange={(e) => setNewFriendHandle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#5B4FE9] hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
            >
              Ajouter à mes amis
            </button>
          </form>
        </div>
      )}

      {/* New Chat / Group Modal */}
      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateConversation}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">Nouvelle conversation</h3>
              <button
                type="button"
                onClick={() => setNewChatModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                Nom du destinataire ou du groupe
              </label>
              <input
                type="text"
                required
                placeholder="Nom de la discussion ou du groupe"
                value={newConvName}
                onChange={(e) => setNewConvName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={newConvIsGroup}
                onChange={(e) => setNewConvIsGroup(e.target.checked)}
                className="rounded text-indigo-600"
              />
              Créer en tant que salon de groupe
            </label>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#5B4FE9] hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
            >
              Démarrer la conversation
            </button>
          </form>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <div className="mx-auto w-fit">
              {renderAvatar(currentUser.avatarUrl, currentUser.displayName, 'w-14 h-14', 'text-base')}
            </div>
            <h3 className="text-base font-extrabold text-slate-900">{currentUser.displayName}</h3>
            <p className="text-xs text-indigo-600 font-semibold">@{currentUser.username}</p>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto">
              <QrCode className="w-36 h-36 text-slate-800" />
            </div>
            <button
              onClick={() => setQrModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* LiveKit Audio / Video Call Overlay */}
      {activeCall?.active && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md text-white flex flex-col items-center justify-between p-8 safe-top safe-bottom">
          <div className="text-center space-y-1 mt-6">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              {activeCall.type === 'video' ? 'Appel Vidéo LiveKit E2EE' : 'Appel Vocal Chiffré'}
            </span>
            <h2 className="text-2xl font-extrabold pt-3">{activeCall.targetName}</h2>
            <p className="text-sm text-emerald-400 font-medium">
              En communication • {formatSeconds(activeCall.duration)}
            </p>
          </div>

          <div className="relative my-auto">
            {renderAvatar(activeCall.targetAvatar, activeCall.targetName, 'w-32 h-32', 'text-3xl')}
          </div>

          <div className="flex items-center gap-5 mb-6">
            <button
              onClick={() =>
                setActiveCall((prev) => (prev ? { ...prev, muted: !prev.muted } : null))
              }
              className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
                activeCall.muted ? 'bg-amber-500 text-slate-950' : 'bg-white/15 hover:bg-white/25'
              }`}
            >
              <Mic className="w-6 h-6" />
            </button>
            <button
              onClick={() => setActiveCall(null)}
              className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition"
              title="Raccrocher"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
          </div>
        </div>
      )}

      {/* Superadmin AI Discussions Audit Modal */}
      {adminModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl h-[90vh] max-h-[780px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">Console Superadmin — Discussions IA</h3>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                      Audit Oussama IA
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200/80">
                    Surveillance et inspection en direct des conversations des utilisateurs avec l&apos;IA
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchAdminDiscussions}
                  disabled={loadingAdminDiscussions}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition"
                  title="Rafraîchir les discussions"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${loadingAdminDiscussions ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Actualiser</span>
                </button>
                <button
                  onClick={() => setAdminModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                  title="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Left column (Users list) & Right column (Conversation transcript) */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
              {/* Users list */}
              <div className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
                <div className="p-3 border-b border-slate-100">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrer un utilisateur..."
                      value={adminSearchQuery}
                      onChange={(e) => setAdminSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
                  {loadingAdminDiscussions ? (
                    <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                      <span>Chargement des sessions IA...</span>
                    </div>
                  ) : filteredAdminDiscussions.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                      <Sparkles className="w-6 h-6 text-slate-300 mx-auto" />
                      <p>Aucune discussion utilisateur enregistrée avec Oussama IA pour le moment.</p>
                    </div>
                  ) : (
                    filteredAdminDiscussions.map((d) => {
                      const isSelected = selectedAdminUserId === d.userId;
                      return (
                        <button
                          key={d.userId}
                          onClick={() => setSelectedAdminUserId(d.userId)}
                          className={`w-full p-2.5 rounded-2xl flex items-center gap-3 text-left transition ${
                            isSelected
                              ? 'bg-indigo-50 border border-indigo-200 shadow-2xs'
                              : 'hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          <div className="relative shrink-0">
                            {renderAvatar(d.avatarUrl, d.userDisplayName, 'w-10 h-10', 'text-xs')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {d.userDisplayName}
                              </h4>
                              <span className="text-[10px] text-slate-400">
                                {d.lastActive ? new Date(d.lastActive).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="text-[11px] text-slate-500 truncate">@{d.username}</span>
                              <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                                {d.messageCount} msg
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Conversation Transcript */}
              <div className="flex-1 flex flex-col bg-[#F8FAFC] overflow-hidden">
                {selectedDiscussion ? (
                  <>
                    {/* Transcript Header */}
                    <div className="px-5 py-3 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                        {renderAvatar(selectedDiscussion.avatarUrl, selectedDiscussion.userDisplayName, 'w-9 h-9', 'text-xs')}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-slate-900">
                              {selectedDiscussion.userDisplayName}
                            </h4>
                            <span className="text-xs text-slate-500">(@{selectedDiscussion.username})</span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            ID: <span className="font-mono text-slate-600">{selectedDiscussion.userId}</span> • {selectedDiscussion.messages.length} échange(s)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Transcript Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                      {selectedDiscussion.messages.map((m) => {
                        const isUser = m.role === 'user';
                        return (
                          <div
                            key={m.id}
                            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[85%] sm:max-w-md p-3.5 rounded-2xl shadow-2xs ${
                                isUser
                                  ? 'bg-[#5B4FE9] text-white rounded-br-xs'
                                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span
                                  className={`text-[10px] font-extrabold uppercase tracking-wide ${
                                    isUser ? 'text-indigo-200' : 'text-indigo-600'
                                  }`}
                                >
                                  {isUser ? selectedDiscussion.userDisplayName : 'Oussama IA'}
                                </span>
                                <span
                                  className={`text-[10px] ${
                                    isUser ? 'text-indigo-200' : 'text-slate-400'
                                  }`}
                                >
                                  {new Date(m.timestamp).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                                {m.content}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-700">Sélectionnez une discussion</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Choisissez un utilisateur dans la colonne de gauche pour consulter son historique d&apos;échanges avec Oussama IA.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
