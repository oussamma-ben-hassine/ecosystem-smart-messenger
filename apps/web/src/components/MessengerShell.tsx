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
  ChevronRight,
  Loader2,
  Volume2,
  PhoneOff,
  CheckCheck,
  Calendar,
  FileText,
  Zap,
  ScanLine,
  ArrowUp,
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
} from './auraData';

type MainTab = 'messages' | 'friends' | 'ai' | 'settings';

interface UserSessionProfile {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  matrixUserId?: string;
  isGuest?: boolean;
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
    id: 'usr-oussama-1',
    displayName: 'Oussama Ben Hassine',
    username: 'oussama',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    bio: 'Architecte SaaS & IA • Disponible',
    matrixUserId: '@oussama:messenger.oussamma.tn',
    isGuest: false,
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>('oussama@oussamma.tn');
  const [loginDisplayName, setLoginDisplayName] = useState<string>('Oussama Ben Hassine');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

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

  // Friends / Contacts state
  const [friends, setFriends] = useState<FriendContact[]>(INITIAL_FRIENDS);
  const [friendRequests, setFriendRequests] = useState<FriendRequestItem[]>(INITIAL_FRIEND_REQUESTS);
  const [friendFilter, setFriendFilter] = useState<'all' | 'online' | 'favorites' | 'requests'>('all');
  const [friendSearchQuery, setFriendSearchQuery] = useState<string>('');
  const [addFriendModalOpen, setAddFriendModalOpen] = useState<boolean>(false);
  const [newFriendName, setNewFriendName] = useState<string>('');
  const [newFriendHandle, setNewFriendHandle] = useState<string>('');
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);

  // Aura IA Assistant state
  const [aiMessages, setAiMessages] = useState<AIMessageEntry[]>(INITIAL_AI_MESSAGES);
  const [aiInput, setAiInput] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Active Call Overlay state
  const [activeCall, setActiveCall] = useState<{
    active: boolean;
    type: 'audio' | 'video';
    targetName: string;
    targetAvatar: string;
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

  // Initialize session, Service Worker, and Notification permissions
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }

    // Restore user session if saved
    const storedUser = localStorage.getItem('messenger_user');
    const storedToken = localStorage.getItem('messenger_token');
    const loggedOutFlag = localStorage.getItem('messenger_logged_out');

    if (loggedOutFlag === 'true') {
      setIsAuthenticated(false);
    } else if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
        setIsAuthenticated(true);
      } catch {}
    } else if (storedToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((profile) => {
          if (profile && profile.id) {
            setCurrentUser(profile);
            setIsAuthenticated(true);
            localStorage.setItem('messenger_user', JSON.stringify(profile));
          }
        })
        .catch(() => {});
    }
  }, []);

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
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
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
      triggerNotification('Notifications actives', 'Les alertes visuelles et sonores Aura sont activées.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      setNotificationsEnabled(true);
      if (perm === 'granted') {
        triggerNotification(
          'Aura Notifications activées 🔔',
          'Vous recevrez désormais les alertes de messages et synthèses IA en direct.'
        );
      } else {
        triggerNotification(
          'Notifications in-app activées',
          'Bannières temps réel Aura activées dans votre navigateur.'
        );
      }
    } catch {
      triggerNotification('Notifications Aura', 'Alertes temps réel activées.');
    }
  };

  // --- AUTHENTICATION HANDLERS (SSO + DIRECT + LOGOUT) ---
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
      // Fallback to direct login if SSO redirect unreachable
      await handleDirectLogin();
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDirectLogin = async (presetProfile?: Partial<UserSessionProfile>) => {
    setAuthLoading(true);
    try {
      const payload = presetProfile
        ? {
            userId: presetProfile.id,
            username: presetProfile.username,
            displayName: presetProfile.displayName,
          }
        : {
            email: loginEmail,
            displayName: loginDisplayName,
            username: loginEmail.split('@')[0] || 'oussama',
          };

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('messenger_token', data.accessToken);
        localStorage.setItem('messenger_user', JSON.stringify(data.profile));
        localStorage.removeItem('messenger_logged_out');
        setCurrentUser(data.profile);
        setIsAuthenticated(true);
        setAuthModalOpen(false);
        triggerNotification(
          `Bienvenue ${data.profile.displayName} 👋`,
          'Votre session sécurisée Aura Messenger est connectée.'
        );
      }
    } catch {
      const fallbackProfile: UserSessionProfile = {
        id: 'usr-oussama-1',
        displayName: loginDisplayName || 'Oussama Ben Hassine',
        username: loginEmail.split('@')[0] || 'oussama',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        bio: 'Connecté sur Aura Messenger',
        matrixUserId: '@oussama:messenger.oussamma.tn',
      };
      localStorage.setItem('messenger_token', `aura_sess_usr-oussama-1_${Date.now()}`);
      localStorage.setItem('messenger_user', JSON.stringify(fallbackProfile));
      localStorage.removeItem('messenger_logged_out');
      setCurrentUser(fallbackProfile);
      setIsAuthenticated(true);
      setAuthModalOpen(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('messenger_token');
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {}

    localStorage.removeItem('messenger_token');
    localStorage.removeItem('messenger_user');
    localStorage.setItem('messenger_logged_out', 'true');
    setIsAuthenticated(false);
    setSelectedRoomId(null);
    setMobileChatOpen(false);
    setAuthModalOpen(true);
    triggerNotification('Déconnexion réussie', 'Vous avez été déconnecté de votre session Aura.');
  };

  // --- CONVERSATION & MESSAGING HANDLERS ---
  const openConversation = (roomId: string) => {
    setSelectedRoomId(roomId);
    setMobileChatOpen(true);
    setActiveTab('messages');
    // Mark room as read
    setConversations((prev) =>
      prev.map((c) => (c.id === roomId ? { ...c, unread: 0 } : c))
    );
  };

  const currentRoom = conversations.find((c) => c.id === selectedRoomId) || conversations[0];
  const currentMessages = messagesByRoom[currentRoom?.id || 'room-camille'] || [];

  const sendMessage = async (textOverride?: string, typeOverride: 'text' | 'voice' | 'image' = 'text', extra?: Partial<ChatMessageItem>) => {
    const roomId = currentRoom.id;
    const content = (textOverride ?? chatInput).trim();
    if (!content && typeOverride === 'text') return;

    const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: 'Vous',
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
                  ? `Note vocale (${extra?.voiceDuration || '0:12'})`
                  : typeOverride === 'image'
                  ? '📷 Photo partagée'
                  : `Vous : ${content}`,
              lastMessageType: typeOverride === 'voice' ? 'voice' : 'text',
              timestamp: nowTime,
            }
          : c
      )
    );

    if (!textOverride) {
      setChatInput('');
    }

    // If message mentions Aura or is a smart suggestion for AI in group/private chat, or simulate smart reply
    const lower = content.toLowerCase();
    if (lower.includes('aura') || lower.includes('itinéraire') || lower.includes('courses') || lower.includes('météo')) {
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
            context: `Salon actuel: ${currentRoom.name}`,
          }),
        });
        const data = await res.json();
        const aiText = data.textResponse || data.reply || "J'ai mis à jour la note du groupe avec ces informations.";

        const botNote: ChatMessageItem = {
          id: `msg-aura-${Date.now()}`,
          senderId: 'aura-bot',
          senderName: 'Aura Bot',
          content: 'Note de groupe',
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          isOwn: false,
          type: 'aura-note',
          auraNoteData: {
            title: 'Aura Assistant • En direct',
            text: aiText,
            actions: [
              { label: '📋 Copier dans les notes', actionType: 'copy' },
              { label: '📅 Ajouter au calendrier', actionType: 'calendar' },
            ],
          },
        };

        setMessagesByRoom((prev) => ({
          ...prev,
          [roomId]: [...(prev[roomId] || []), botNote],
        }));

        triggerNotification('Aura IA • Réponse dans le salon', aiText.substring(0, 90), {
          type: 'ai',
          roomId,
        });
      } catch {}
    } else {
      // Simulate realistic contact reply after 1.8s
      setTimeout(() => {
        const replySender = currentRoom.isGroup ? 'Sophie Laurent' : currentRoom.name;
        const replyAvatar = currentRoom.avatar;
        const autoReplies: Record<string, string> = {
          'room-camille': "C'est noté pour 20h00 ! J'ai trop hâte, à tout à l'heure 😍🍝",
          'room-weekend': 'Super idée ! On valide ça tous ensemble avant 19h 🙌',
          'room-design': 'Parfait, je pousse la mise à jour sur le Drive partagé ! ✨',
        };
        const replyContent =
          autoReplies[roomId] || "Parfait, bien reçu ! Je te tiens au courant très vite 👍";

        const replyTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const replyMsg: ChatMessageItem = {
          id: `msg-reply-${Date.now()}`,
          senderId: 'contact-reply',
          senderName: replySender,
          senderAvatar: replyAvatar,
          content: replyContent,
          timestamp: replyTime,
          isOwn: false,
          type: 'text',
        };

        setMessagesByRoom((prev) => ({
          ...prev,
          [roomId]: [...(prev[roomId] || []), replyMsg],
        }));

        setConversations((prev) =>
          prev.map((c) =>
            c.id === roomId
              ? {
                  ...c,
                  lastMessage: currentRoom.isGroup ? `${replySender.split(' ')[0]} : ${replyContent}` : replyContent,
                  timestamp: replyTime,
                }
              : c
          )
        );

        triggerNotification(replySender, replyContent, {
          avatar: replyAvatar,
          type: 'message',
          roomId,
        });
      }, 1600);
    }
  };

  // Interactive Poll Voting handler
  const handleVotePoll = (roomId: string, messageId: string, optionId: string) => {
    setMessagesByRoom((prev) => {
      const roomMsgs = prev[roomId] || [];
      return {
        ...prev,
        [roomId]: roomMsgs.map((m) => {
          if (m.id !== messageId || !m.pollData) return m;
          const updatedOptions = m.pollData.options.map((opt) => {
            if (opt.id === optionId) {
              if (opt.selected) return opt;
              return { ...opt, votes: opt.votes + 1, selected: true };
            } else {
              if (opt.selected) {
                return { ...opt, votes: Math.max(0, opt.votes - 1), selected: false };
              }
              return opt;
            }
          });
          const newTotal = updatedOptions.reduce((acc, o) => acc + o.votes, 0);
          return {
            ...m,
            pollData: {
              ...m.pollData,
              totalVotes: newTotal,
              options: updatedOptions,
            },
          };
        }),
      };
    });
    triggerNotification('Vote enregistré 📊', 'Votre choix a été mis à jour dans le sondage du groupe.');
  };

  // Handle Voice Note Recording completion
  const finishVoiceRecording = () => {
    const secs = Math.max(3, recordingSeconds);
    const formatted = `0:${secs < 10 ? `0${secs}` : secs}`;
    setIsRecordingVoice(false);
    sendMessage('Message vocal', 'voice', {
      voiceCurrent: '0:00',
      voiceDuration: formatted,
    });
  };

  // Handle Image / Photo upload in chat
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    sendMessage(file.name.replace(/\.[^/.]+$/, '') || 'Photo partagée via ByteVault Drive', 'image', {
      imageUrl: url,
      imageLocation: 'ByteVault Drive • Chiffré E2EE',
      reactions: [{ emoji: '🔥 ✨', count: 1 }],
    });
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
      activityBadge: 'Nouveau contact ✨',
      avatar: req.avatar,
      online: true,
      favorite: false,
      letter: req.name.charAt(0).toUpperCase(),
      conversationId: newRoomId,
    };
    setFriends((prev) => [...prev, newFriend].sort((a, b) => a.name.localeCompare(b.name)));

    // Also create a conversation room
    setConversations((prev) => [
      {
        id: newRoomId,
        name: req.name,
        isGroup: false,
        avatar: req.avatar,
        lastMessage: 'Vous êtes maintenant connectés sur Aura 👋',
        timestamp: "À l'instant",
        unread: 1,
        online: true,
        statusText: 'En ligne maintenant',
        smartSuggestions: [
          { label: 'Dire bonjour 👋', replyText: `Salut ${req.name.split(' ')[0]} ! Ravi de t'ajouter sur Aura 😊` },
        ],
      },
      ...prev,
    ]);
    setMessagesByRoom((prev) => ({
      ...prev,
      [newRoomId]: [
        {
          id: `m-init-${Date.now()}`,
          senderId: req.id,
          senderName: req.name,
          senderAvatar: req.avatar,
          content: `Salut ! Merci d'avoir accepté mon invitation sur Aura Messenger ✨`,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          isOwn: false,
          type: 'text',
        },
      ],
    }));

    triggerNotification('Nouvel ami ajouté 🤝', `${req.name} fait maintenant partie de vos contacts Aura.`, {
      avatar: req.avatar,
    });
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
      : `@${(newFriendHandle.trim() || newFriendName.toLowerCase().replace(/\s+/g, '.'))}`;
    const roomId = `room-custom-${Date.now()}`;
    const avatar = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`;

    const created: FriendContact = {
      id: `fr-${Date.now()}`,
      name: newFriendName.trim(),
      handle,
      bio: 'Membre Écosystème Oussamma',
      activityBadge: 'En ligne ✨',
      avatar,
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
        avatar,
        lastMessage: 'Nouvelle discussion chiffrée E2EE',
        timestamp: "À l'instant",
        unread: 0,
        online: true,
        statusText: 'En ligne',
      },
      ...prev,
    ]);
    setNewFriendName('');
    setNewFriendHandle('');
    setAddFriendModalOpen(false);
    triggerNotification('Contact ajouté', `${created.name} (${created.handle}) a été ajouté.`);
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
      const historyPayload = aiMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          prompt,
          messages: [...historyPayload, { role: 'user', content: prompt }],
        }),
      });

      const data = await res.json();
      const replyText =
        data.textResponse ||
        data.reply ||
        "J'ai analysé vos discussions récentes. Voici les éléments importants à retenir.";

      // Build structured synthesis card if user asked for summary/tasks/invitations
      const lower = prompt.toLowerCase();
      let synthesisCard = undefined;
      if (lower.includes('résum') || lower.includes('synthèse') || lower.includes('non lus') || lower.includes('tâche')) {
        synthesisCard = {
          title: 'Aura Synthèse • Temps réel',
          bullets: [
            {
              label: 'Projet Week-end (2 non lus)',
              text: 'Sophie propose de réserver les billets ce soir. Maison côtière en tête (60%).',
            },
            {
              label: 'Camille Martin (1 note vocale)',
              text: 'Confirmation attendue pour le restaurant italien à Paris 11e (20h00).',
            },
          ],
          tasks: [
            { id: `t-${Date.now()}-1`, text: 'Confirmer la réservation 20h à Camille', assignee: '(Vous)', done: false },
            { id: `t-${Date.now()}-2`, text: 'Valider les billets train/voiture avec Sophie', assignee: '(Groupe)', done: false },
          ],
        };
      }

      const assistantEntry: AIMessageEntry = {
        id: `ai-a-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        synthesis: synthesisCard,
        action: data.action,
      };

      setAiMessages((prev) => [...prev, assistantEntry]);
    } catch {
      const fallbackEntry: AIMessageEntry = {
        id: `ai-a-${Date.now()}`,
        role: 'assistant',
        content:
          "Voici la synthèse de vos messages : **Camille Martin** attend votre confirmation pour le dîner de 20h00 (Paris 11e) et **Sophie** a relancé le groupe **Projet Voyage ✈️** pour réserver les billets ce soir.",
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      setAiMessages((prev) => [...prev, fallbackEntry]);
    } finally {
      setAiLoading(false);
    }
  };

  const toggleAITask = (msgId: string, taskId: string) => {
    setAiMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId || !m.synthesis) return m;
        return {
          ...m,
          synthesis: {
            ...m.synthesis,
            tasks: m.synthesis.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
          },
        };
      })
    );
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
    triggerNotification('Action exécutée par Aura ✨', 'Votre message a été envoyé avec succès.');
  };

  const forwardSynthesisToGroup = (entry: AIMessageEntry) => {
    const summaryText = entry.synthesis
      ? `📋 Synthèse Aura IA :\n• ${entry.synthesis.bullets.map((b) => `${b.label}: ${b.text}`).join('\n• ')}`
      : entry.content;

    const targetRoomId = 'room-weekend';
    const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessageItem = {
      id: `msg-fwd-${Date.now()}`,
      senderId: currentUser.id,
      senderName: 'Vous',
      content: summaryText,
      timestamp: nowTime,
      isOwn: true,
      type: 'text',
    };

    setMessagesByRoom((prev) => ({
      ...prev,
      [targetRoomId]: [...(prev[targetRoomId] || []), newMsg],
    }));

    triggerNotification('Transféré au groupe ↪', 'La synthèse Aura a été partagée dans "Projet Week-end".');
    openConversation(targetRoomId);
  };

  // --- CALL HANDLERS ---
  const startCall = async (targetName: string, targetAvatar: string, type: 'audio' | 'video') => {
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

  const filteredFriends = friends.filter((f) => {
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

  // Format seconds as MM:SS
  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? `0${s}` : s}`;
  };

  // ============================================================================
  // RENDERERS FOR EACH SCREEN (MATCHING THE 5 UPLOADED MOCKUPS)
  // ============================================================================

  // Top Header (Aura Logo, Search, Broadcast/Status, User Avatar)
  const renderTopAppHeader = () => (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 shrink-0 safe-top">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <span className="text-[19px] font-extrabold tracking-tight text-slate-900">Aura</span>
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
          title="Notifications en direct"
          className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition relative"
        >
          <Radio className="w-4 h-4 text-indigo-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        </button>
        <button
          onClick={() => setAuthModalOpen(true)}
          title={ isAuthenticated ? `${currentUser.displayName} (Connecté)` : 'Se connecter' }
          className="relative ml-0.5 focus:outline-none"
        >
          <img
            src={
              currentUser.avatarUrl ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
            }
            alt={currentUser.displayName}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/30"
          />
          <span
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
              isAuthenticated ? 'bg-emerald-500' : 'bg-amber-400'
            }`}
          />
        </button>
      </div>
    </header>
  );

  // SCREEN 1: MESSAGES HOME LIST (Matches media_1792203124413_8540ae39.png)
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
        {/* EN LIGNE EN DIRECT Carousel */}
        <div className="px-4 py-3 bg-white border-b border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              EN LIGNE EN DIRECT
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />6 actifs
            </span>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1">
            {ONLINE_STORIES.map((story) => (
              <button
                key={story.id}
                onClick={() => {
                  if (story.isAI) {
                    setActiveTab('ai');
                  } else if (story.conversationId) {
                    openConversation(story.conversationId);
                  }
                }}
                className="flex flex-col items-center gap-1.5 shrink-0 group"
              >
                <div className="relative">
                  {story.isAI ? (
                    <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-indigo-600 via-violet-500 to-fuchsia-500 shadow-md shadow-indigo-500/20">
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white">
                        <Sparkles className="w-6 h-6" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 to-emerald-400">
                      <img
                        src={story.avatar}
                        alt={story.name}
                        className="w-full h-full rounded-full object-cover border-2 border-white"
                      />
                    </div>
                  )}
                  {story.isAI ? (
                    <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center ring-2 ring-white shadow">
                      <Zap className="w-3 h-3 fill-current" />
                    </span>
                  ) : (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${
                    story.isAI ? 'text-indigo-600 font-semibold' : 'text-slate-700'
                  }`}
                >
                  {story.name}
                </span>
              </button>
            ))}
          </div>
        </div>

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
            Tous
            <span
              className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                msgFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              8
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
              {totalUnreadCount || 3}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 bg-white text-slate-700 border border-slate-200/80 hover:border-indigo-300 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Aura IA
            <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-indigo-50 text-indigo-600 font-bold">
              1
            </span>
          </button>

          <button
            onClick={() => setMsgFilter('friends')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 transition ${
              msgFilter === 'friends'
                ? 'bg-[#5B4FE9] text-white shadow-sm shadow-indigo-500/25'
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            Amis
            <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-slate-100 text-slate-600">
              5
            </span>
          </button>
        </div>

        {/* Proactive Aura IA Summary Card */}
        <div className="px-4 mb-3">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-violet-50/60 to-white border border-indigo-200/80 shadow-sm relative overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#5B4FE9] to-[#7C3AED] flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20 relative">
                <Sparkles className="w-5 h-5" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">Aura IA</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700">
                      IA Proactif
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-600 shrink-0">À l&apos;instant</span>
                </div>

                <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                  J&apos;ai résumé les 14 messages du groupe &quot;Projet Voyage&quot; et préparé 2 rappels pour demain.
                </p>

                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('ai')}
                    className="px-3 py-1 rounded-full bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition"
                  >
                    <Sparkles className="w-3 h-3" />
                    Voir la synthèse
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conversation Cards List */}
        <div className="px-4 space-y-2.5">
          {filteredConversations.map((conv) => {
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
                {/* Avatar (Group overlapping or single) */}
                <div className="relative shrink-0">
                  {conv.isGroup && conv.groupAvatars && conv.groupAvatars.length >= 2 ? (
                    <div className="w-12 h-12 relative">
                      <img
                        src={conv.groupAvatars[0]}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover border-2 border-white absolute top-0 left-0 z-10 shadow-2xs"
                      />
                      <img
                        src={conv.groupAvatars[1]}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover border-2 border-white absolute bottom-0 right-0"
                      />
                    </div>
                  ) : (
                    <img
                      src={conv.avatar}
                      alt={conv.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  {conv.online && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white z-20" />
                  )}
                </div>

                {/* Center Info */}
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
                      {conv.lastMessageType === 'voice' && (
                        <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold">
                          <Mic className="w-3.5 h-3.5" />
                          {conv.lastMessage}
                        </span>
                      )}
                      {conv.lastMessageType === 'file' && (
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate">{conv.lastMessage}</span>
                        </span>
                      )}
                      {(!conv.lastMessageType || conv.lastMessageType === 'text') && (
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
          })}
        </div>
      </div>

      {/* Floating Action Button (FAB) with + and AI Sparkle badge */}
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

  // SCREEN 2 & 3: PRIVATE & GROUP CONVERSATION VIEW (Matches media_1792203113890 & media_1792203119423)
  const renderConversationView = () => {
    const room = currentRoom;
    const msgs = currentMessages;

    return (
      <div className="flex flex-col h-full bg-[#F8FAFC] overflow-hidden">
        {/* Top Navigation Sub-bar (Mobile & Context Header) */}
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
              {room.isGroup ? 'Groupe Actif' : 'Conversation Privée'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ai')}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
              title="Options & Synthèse IA"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <img
              src={
                currentUser.avatarUrl ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
              }
              alt="Vous"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/40"
            />
          </div>
        </div>

        {/* Contact / Group Header Bar */}
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {room.isGroup && room.groupAvatars ? (
              <div className="flex items-center -space-x-2.5 shrink-0">
                {room.groupAvatars.map((av, idx) => (
                  <img
                    key={idx}
                    src={av}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-white"
                  />
                ))}
                {room.extraMembersCount && (
                  <span className="w-9 h-9 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center ring-2 ring-white">
                    +{room.extraMembersCount}
                  </span>
                )}
              </div>
            ) : (
              <div className="relative shrink-0">
                <img
                  src={room.avatar}
                  alt={room.name}
                  className="w-11 h-11 rounded-full object-cover"
                />
                {room.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </div>
            )}

            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 truncate">
                {room.isGroup ? 'Projet Week-end & Roadtrip' : room.name}
              </h2>
              <p className="text-xs text-slate-500 truncate flex items-center gap-1.5">
                {!room.isGroup && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                <span className={room.isGroup ? 'text-slate-500' : 'text-emerald-600 font-medium'}>
                  {room.isGroup ? room.subtitle : room.statusText || 'En ligne il y a 2 min'}
                </span>
              </p>
            </div>
          </div>

          {/* Call / Group Action Buttons */}
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

        {/* Pinned Banner for Group Conversation (Screen 3) */}
        {room.pinnedBanner && (
          <div className="px-4 py-2 bg-indigo-50/80 border-b border-indigo-100 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Pin className="w-3.5 h-3.5 text-indigo-600 shrink-0 rotate-45" />
              <p className="text-xs text-slate-700 truncate">
                <span className="font-bold text-indigo-950">{room.pinnedBanner.title}</span>{' '}
                <span className="text-slate-500">({room.pinnedBanner.subtitle})</span>
              </p>
            </div>
            <button
              onClick={() =>
                triggerNotification('Sondage actif 📌', 'Maison côtière (60%) • Camping & van (40%)')
              }
              className="px-2.5 py-0.5 rounded-full bg-white text-indigo-600 border border-indigo-200 text-[11px] font-bold shrink-0 hover:bg-indigo-50"
            >
              Voir
            </button>
          </div>
        )}

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Date Pill */}
          <div className="flex justify-center">
            <span className="px-3 py-1 rounded-full bg-white border border-slate-200/80 text-[11px] font-semibold text-slate-500 inline-flex items-center gap-1.5 shadow-2xs">
              <Calendar className="w-3 h-3 text-indigo-500" />
              Aujourd&apos;hui
            </span>
          </div>

          {msgs.map((msg) => {
            // 1. AURA BOT GROUP NOTE CARD (Screen 3)
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
                      <span className="text-xs font-extrabold text-indigo-950">Aura Bot</span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase">
                        ASSISTANT
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{msg.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    💡 <span className="font-bold">{msg.auraNoteData.title} :</span>{' '}
                    {msg.auraNoteData.text}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.auraNoteData.actions.map((act, idx) => (
                      <button
                        key={idx}
                        onClick={() =>
                          triggerNotification(
                            act.label,
                            act.actionType === 'payment'
                              ? 'Lien de partage budget (85€/pers) copié dans le presse-papier.'
                              : 'Rappel programmé dans votre agenda Écosystème à 19h00.'
                          )
                        }
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold transition shadow-2xs"
                      >
                        {act.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            // 2. INTERACTIVE GROUP POLL CARD (Screen 3)
            if (msg.type === 'poll' && msg.pollData) {
              const poll = msg.pollData;
              return (
                <div key={msg.id} className="flex items-start gap-2.5">
                  {msg.senderAvatar && (
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      className="w-8 h-8 rounded-full object-cover mt-1 shrink-0"
                    />
                  )}
                  <div className="flex-1 max-w-md bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-indigo-600">{msg.senderName}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        📊 SONDAGE DU GROUPE
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-1 mb-3">{poll.question}</h4>

                    <div className="space-y-3">
                      {poll.options.map((opt) => {
                        const pct =
                          poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleVotePoll(room.id, msg.id, opt.id)}
                            className={`w-full text-left p-2.5 rounded-xl border transition ${
                              opt.selected
                                ? 'border-indigo-500 bg-indigo-50/40'
                                : 'border-slate-200 hover:border-indigo-300 bg-slate-50/50'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                              <span className="flex items-center gap-1.5 text-slate-800">
                                <span
                                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                                    opt.selected
                                      ? 'bg-[#5B4FE9] text-white'
                                      : 'border border-slate-300 bg-white'
                                  }`}
                                >
                                  {opt.selected && <Check className="w-2.5 h-2.5" />}
                                </span>
                                {opt.label}
                              </span>
                              <span className="text-indigo-600 font-bold">
                                {pct}% ({opt.votes} votes)
                              </span>
                            </div>

                            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  opt.selected ? 'bg-[#5B4FE9]' : 'bg-slate-400'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Total : {poll.totalVotes} votes</span>
                      <span className="text-indigo-600 font-semibold">
                        Cliquez sur une option pour modifier votre vote
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            // 3. VOICE MESSAGE BUBBLE (Screen 2)
            if (msg.type === 'voice') {
              const isPlaying = playingVoiceId === msg.id;
              const bars = [35, 65, 45, 85, 55, 95, 70, 40, 60, 80, 50, 30, 75, 60, 40, 50];
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2.5 ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {!msg.isOwn && msg.senderAvatar && (
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                  )}
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
                          <span>
                            {isPlaying ? 'Lecture...' : msg.voiceCurrent || '0:14'} /{' '}
                            {msg.voiceDuration || '0:35'}
                          </span>
                          <span className="font-medium">Message vocal</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // 4. IMAGE / MEDIA CARD WITH LOCATION & REACTIONS (Screen 2)
            if (msg.type === 'image' && msg.imageUrl) {
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2.5 ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {!msg.isOwn && msg.senderAvatar && (
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                  )}
                  <div className="max-w-[82%] sm:max-w-sm bg-white border border-slate-200/80 rounded-2xl p-2 shadow-xs relative">
                    <div className="relative rounded-xl overflow-hidden">
                      <img
                        src={msg.imageUrl}
                        alt={msg.content}
                        className="w-full h-44 object-cover"
                      />
                      {msg.imageLocation && (
                        <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full bg-slate-900/75 backdrop-blur-xs text-white text-[11px] font-medium inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-400" />
                          {msg.imageLocation}
                        </span>
                      )}
                    </div>
                    <div className="px-2 pt-2 pb-1 flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-slate-800">{msg.content}</p>
                      <span className="text-[10px] text-slate-400 shrink-0">{msg.timestamp}</span>
                    </div>
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="px-2 pb-1 flex gap-1">
                        {msg.reactions.map((r, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700"
                          >
                            {r.emoji} {r.count}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // 5. STANDARD TEXT BUBBLE
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                {!msg.isOwn && msg.senderAvatar && (
                  <img
                    src={msg.senderAvatar}
                    alt={msg.senderName}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                )}
                <div
                  className={`max-w-[80%] sm:max-w-md px-4 py-2.5 rounded-2xl shadow-2xs ${
                    msg.isOwn
                      ? 'bg-[#5B4FE9] text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  {room.isGroup && !msg.isOwn && (
                    <div className="text-[11px] font-bold text-indigo-600 mb-0.5">
                      {msg.senderName}
                    </div>
                  )}
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

        {/* Aura Contextual Smart Suggestions Bar (Above Input, Matches Screen 2 & 3) */}
        {room.smartSuggestions && room.smartSuggestions.length > 0 && (
          <div className="px-4 py-2 bg-white/90 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
              Aura :
            </span>
            {room.smartSuggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(sug.replyText)}
                className="px-3 py-1 rounded-full bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-xs font-semibold shrink-0 transition"
              >
                {sug.label}
              </button>
            ))}
          </div>
        )}

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
            title="Partager une photo / fichier Drive"
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
                placeholder={
                  room.isGroup ? 'Message au groupe ou @Aura...' : 'Écrire un message...'
                }
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

  // SCREEN 4: AMIS / CONTACTS DIRECTORY (Matches media_1792203098570_9e9f6bfa.png)
  const renderFriendsScreen = () => (
    <div className="flex flex-col h-full bg-[#F8FAFC] overflow-hidden">
      {/* Header Amis 84 */}
      <div className="px-4 pt-3 pb-2 bg-white flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900">Amis</h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">
              {80 + friends.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">18 contacts connectés à proximité</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setQrModalOpen(true)}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 transition"
            title="Mon QR Code Aura"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <button
            onClick={() => setAddFriendModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#5B4FE9] hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm shadow-indigo-500/25 transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-2 bg-white border-b border-slate-100">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-2xl px-3.5 py-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={friendSearchQuery}
            onChange={(e) => setFriendSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, @pseudo ou numéro..."
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2.5 pb-1">
          <button
            onClick={() => setFriendFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition ${
              friendFilter === 'all'
                ? 'bg-[#5B4FE9] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Tous <span className="ml-1 opacity-80">{80 + friends.length}</span>
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
            En ligne 18
          </button>
          <button
            onClick={() => setFriendFilter('favorites')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 inline-flex items-center gap-1 transition ${
              friendFilter === 'favorites'
                ? 'bg-[#5B4FE9] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            ⭐ Favoris
          </button>
          <button
            onClick={() => setFriendFilter('requests')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 inline-flex items-center gap-1 transition ${
              friendFilter === 'requests'
                ? 'bg-[#5B4FE9] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Demandes
            {friendRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {friendRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Scrollable Friends Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5 pb-24">
        {/* Aura Découverte Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50/90 to-white border border-indigo-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5B4FE9] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Aura Découverte</h3>
              <p className="text-[11px] text-slate-600 mt-0.5">
                3 contacts de votre carnet d&apos;adresses ont rejoint Aura cette semaine.
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-indigo-600 shrink-0" />
        </div>

        {/* Demandes d'amis Section */}
        {friendRequests.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Demandes d&apos;amis
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold">
                  {friendRequests.length} en attente
                </span>
              </div>
              <span className="text-xs font-semibold text-indigo-600">Voir tout</span>
            </div>

            <div className="space-y-2">
              {friendRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3 rounded-2xl bg-white border border-slate-200/70 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={req.avatar}
                      alt={req.name}
                      className="w-11 h-11 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{req.name}</h4>
                        <span className="text-[11px] text-indigo-600 font-medium truncate">
                          {req.handle}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{req.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleAcceptFriendRequest(req)}
                      className="w-8 h-8 rounded-full bg-[#5B4FE9] hover:bg-indigo-700 text-white flex items-center justify-center shadow-2xs transition"
                      title="Accepter"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeclineFriendRequest(req.id)}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition"
                      title="Ignorer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* En ligne maintenant Horizontal Cards */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
            En ligne maintenant
          </h2>
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
            {friends
              .filter((f) => f.online)
              .map((f) => (
                <button
                  key={f.id}
                  onClick={() => f.conversationId && openConversation(f.conversationId)}
                  className="p-3 rounded-2xl bg-white border border-slate-200/70 shadow-2xs flex flex-col items-center min-w-[105px] shrink-0 hover:border-indigo-300 transition"
                >
                  <div className="relative mb-2">
                    <img
                      src={f.avatar}
                      alt={f.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[90px]">
                    {f.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-1 font-medium truncate max-w-[95px]">
                    {f.activityBadge || 'En ligne'}
                  </span>
                </button>
              ))}
          </div>
        </div>

        {/* Alphabetical Directory (A, C, L, M, S, T) */}
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
                          <img
                            src={friend.avatar}
                            alt={friend.name}
                            className="w-11 h-11 rounded-full object-cover"
                          />
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
                          <p className="text-xs text-slate-500 truncate">{friend.bio}</p>
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
                            friend.conversationId
                              ? openConversation(friend.conversationId)
                              : openConversation('room-camille')
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
      </div>
    </div>
  );

  // SCREEN 5: AURA IA ASSISTANT (Matches media_1792203104193_294f3775.png)
  const renderAIAssistantScreen = () => (
    <div className="flex flex-col h-full bg-[#F8FAFC] overflow-hidden">
      {/* Aura IA PRO Sub-header */}
      <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5B4FE9] to-[#7C3AED] flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">Aura IA</h2>
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

        <button
          onClick={() => setAiMessages(INITIAL_AI_MESSAGES)}
          className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition"
          title="Réinitialiser l'historique"
        >
          <Clock className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable AI Conversation Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Welcome Hero Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/60 border border-indigo-100 text-center shadow-2xs">
          <p className="text-xs font-medium text-slate-700">
            Bonjour ! Comment puis-je vous aider dans vos conversations aujourd&apos;hui ?
          </p>
        </div>

        {/* SUGGESTIONS RAPIDES */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            SUGGESTIONS RAPIDES
          </span>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => sendAIMessage('Résumer mes messages non lus et lister les actions')}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200/80 text-xs font-semibold text-slate-700 shrink-0 inline-flex items-center gap-1.5 shadow-2xs transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Résumer mes messages non lus
            </button>
            <button
              onClick={() =>
                sendAIMessage(
                  'Rédige une invitation conviviale pour le dîner italien de ce soir à 20h00'
                )
              }
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200/80 text-xs font-semibold text-slate-700 shrink-0 inline-flex items-center gap-1.5 shadow-2xs transition"
            >
              📝 Rédiger une invitation...
            </button>
            <button
              onClick={() =>
                sendAIMessage('Envoie un message au groupe Projet Week-end pour confirmer 18h30')
              }
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200/80 text-xs font-semibold text-slate-700 shrink-0 inline-flex items-center gap-1.5 shadow-2xs transition"
            >
              🚀 Préparer un envoi groupé
            </button>
          </div>
        </div>

        {/* AI Chat Messages & Synthesis Cards */}
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
                    {entry.synthesis?.title || 'Aura Synthèse'}
                  </span>
                  <span className="text-[10px] text-slate-400">{entry.timestamp}</span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {entry.content}
                </p>

                {/* Structured Bullets & Interactive Checklist (Matches Screen 5) */}
                {entry.synthesis && (
                  <>
                    <div className="space-y-2 pt-1">
                      {entry.synthesis.bullets.map((b, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#5B4FE9] mt-1.5 shrink-0" />
                          <p>
                            <span className="font-bold text-slate-900">{b.label} :</span> {b.text}
                          </p>
                        </div>
                      ))}
                    </div>

                    {entry.synthesis.tasks && entry.synthesis.tasks.length > 0 && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                          <span>Tâches & Fournitures</span>
                          <span className="text-indigo-600">
                            {entry.synthesis.tasks.filter((t) => t.done).length}/
                            {entry.synthesis.tasks.length} terminé
                          </span>
                        </div>

                        {entry.synthesis.tasks.map((task) => (
                          <button
                            key={task.id}
                            onClick={() => toggleAITask(entry.id, task.id)}
                            className="w-full flex items-center justify-between gap-2 text-left py-1 text-xs hover:bg-white px-2 rounded-lg transition"
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className={`w-4 h-4 rounded flex items-center justify-center ${
                                  task.done
                                    ? 'bg-[#5B4FE9] text-white'
                                    : 'border border-slate-300 bg-white'
                                }`}
                              >
                                {task.done && <Check className="w-3 h-3" />}
                              </span>
                              <span
                                className={
                                  task.done ? 'line-through text-slate-400' : 'text-slate-800 font-medium'
                                }
                              >
                                {task.text}
                              </span>
                            </span>
                            <span className="text-[11px] text-indigo-600 font-semibold">
                              {task.assignee}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Tool Calling Confirmation Card */}
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

                {/* Action Pills (Transférer au groupe, Copier, Régénérer) */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => forwardSynthesisToGroup(entry)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold inline-flex items-center gap-1.5 transition"
                  >
                    <CornerUpRight className="w-3.5 h-3.5" />
                    Transférer au groupe
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(entry.content);
                      triggerNotification('Copié 📋', 'La réponse Aura IA a été copiée.');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copier
                  </button>
                  <button
                    onClick={() =>
                      sendAIMessage('Régénère une synthèse concise de mes discussions')
                    }
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-600 transition"
                    title="Régénérer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
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
              Aura IA analyse vos discussions en direct...
            </div>
          </div>
        )}
        <div ref={aiEndRef} />
      </div>

      {/* Bottom AI Prompt Input Bar (Matches Screen 5) */}
      <div className="px-3 py-2.5 bg-white border-t border-slate-200/80 flex items-center gap-2 shrink-0 safe-bottom">
        <button
          onClick={() =>
            sendAIMessage('Analyse le contexte de mes salons actifs et propose les prochaines actions')
          }
          className="w-10 h-10 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 transition"
          title="Scanner le contexte des salons"
        >
          <ScanLine className="w-5 h-5" />
        </button>

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
            placeholder="Posez une question ou demandez..."
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <Mic className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
        </div>

        <button
          onClick={() => sendAIMessage()}
          disabled={aiLoading}
          className="w-10 h-10 rounded-full bg-[#5B4FE9] hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/25 transition"
          title="Envoyer à Aura IA"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  // SCREEN 6: PARAMÈTRES, PROFIL, CONNEXION / DÉCONNEXION & NOTIFICATIONS
  const renderSettingsScreen = () => (
    <div className="flex flex-col h-full bg-[#F8FAFC] overflow-y-auto px-4 py-4 space-y-4 pb-24">
      {/* User Profile Card */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="relative">
            <img
              src={
                currentUser.avatarUrl ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
              }
              alt={currentUser.displayName}
              className="w-16 h-16 rounded-full object-cover ring-4 ring-indigo-50"
            />
            <span
              className={`absolute bottom-0 right-0 w-4 h-4 rounded-full ring-2 ring-white ${
                isAuthenticated ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            />
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
                {isAuthenticated ? 'Connecté SSO' : 'Déconnecté'}
              </span>
            </div>
            <p className="text-xs text-indigo-600 font-semibold mt-0.5">
              {currentUser.matrixUserId || `@${currentUser.username}:messenger.oussamma.tn`}
            </p>
            <p className="text-xs text-slate-500 mt-1">{currentUser.bio}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Changer de compte
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold inline-flex items-center gap-1.5 transition"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#5B4FE9] hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition"
            >
              <LogIn className="w-4 h-4" />
              Se connecter (SSO / Compte)
            </button>
          )}
        </div>
      </div>

      {/* Authentication & SSO Section */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-3 shadow-2xs">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Authentification & Identité Écosystème
        </h3>

        <div className="flex items-center justify-between py-2 border-b border-slate-100">
          <div>
            <div className="text-sm font-bold text-slate-800">Fournisseur SSO OIDC</div>
            <div className="text-xs text-slate-500">https://sso-a.oussamma.tn (PKCE S256)</div>
          </div>
          <button
            onClick={handleSSOLoginRedirect}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition"
          >
            Synchroniser SSO
          </button>
        </div>

        <div className="flex items-center justify-between py-1">
          <div>
            <div className="text-sm font-bold text-slate-800">Session active</div>
            <div className="text-xs text-slate-500">
              {isAuthenticated
                ? `Authentifié en tant que ${currentUser.displayName}`
                : 'Aucune session active — Cliquez pour vous connecter'}
            </div>
          </div>
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-rose-600 hover:underline"
            >
              Se déconnecter
            </button>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Connexion rapide
            </button>
          )}
        </div>
      </div>

      {/* Notifications Settings */}
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
            Tester la réception d&apos;une notification push et sonore sur cet appareil
          </span>
          <button
            onClick={requestBrowserNotifications}
            className="px-3.5 py-1.5 rounded-xl bg-[#5B4FE9] hover:bg-indigo-700 text-white text-xs font-bold transition shrink-0"
          >
            Tester une notification 🔔
          </button>
        </div>
      </div>

      {/* Security & Ecosystem Connectors */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-3 shadow-2xs">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Sécurité E2EE & Services Connectés
        </h3>

        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800">
              Chiffrement Matrix Olm/Megolm E2EE
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
            Clés vérifiées
          </span>
        </div>

        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800">
              Passerelle IA LiteLLM (ai.oussamma.tn)
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold">
            GPT-4o Actif
          </span>
        </div>
      </div>
    </div>
  );

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
              className="pointer-events-auto cursor-pointer p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-indigo-200 shadow-xl shadow-indigo-500/10 flex items-center gap-3 animate-in fade-in slide-in-from-top-2"
            >
              {t.avatar ? (
                <img src={t.avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#5B4FE9] text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-extrabold text-slate-900 truncate">{t.title}</h4>
                <p className="text-xs text-slate-600 truncate mt-0.5">{t.body}</p>
              </div>
              <Volume2 className="w-4 h-4 text-indigo-500 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Top App Bar (Hidden on mobile when inside an active full-screen conversation) */}
      <div className={mobileChatOpen && activeTab === 'messages' ? 'hidden md:block' : 'block'}>
        {renderTopAppHeader()}
      </div>

      {/* Main Content Area: Responsive Split View on Desktop, Single View / Slide-over on Mobile */}
      <div className="flex-1 flex overflow-hidden relative">
        {activeTab === 'messages' && (
          <>
            {/* Left / Mobile Primary List */}
            <div
              className={`w-full md:w-[380px] lg:w-[420px] md:border-r md:border-slate-200/80 h-full flex flex-col ${
                mobileChatOpen ? 'hidden md:flex' : 'flex'
              }`}
            >
              {renderMessagesListScreen()}
            </div>

            {/* Right / Mobile Fullscreen Conversation View */}
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

      {/* Bottom Navigation Bar (Matches all 5 uploaded mockups: Messages, Amis, IA Assistant, Paramètres) */}
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
          <div className="relative">
            <Users className="w-5 h-5" />
            {friendRequests.length > 0 && (
              <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </div>
          <span className="text-[11px] font-bold">Amis</span>
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
      {/* MODALS: LOGIN/LOGOUT, ADD FRIEND, NEW CONVERSATION, QR CODE, ACTIVE CALL   */}
      {/* ========================================================================== */}

      {/* Auth / Login / Switch Account Modal */}
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
                    Connexion & Session Aura
                  </h3>
                  <p className="text-xs text-slate-500">SSO Oussamma & Comptes rapides</p>
                </div>
              </div>
              <button
                onClick={() => setAuthModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isAuthenticated && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={currentUser.avatarUrl}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {currentUser.displayName}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-medium">Session active</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Déconnexion
                </button>
              </div>
            )}

            {/* SSO Official Redirect Button */}
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
              Se connecter via SSO (sso-a.oussamma.tn)
            </button>

            <div className="relative flex py-1 items-center">
              <div className="grow border-t border-slate-200" />
              <span className="shrink mx-3 text-[11px] font-semibold uppercase text-slate-400">
                Ou connexion directe
              </span>
              <div className="grow border-t border-slate-200" />
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={loginDisplayName}
                  onChange={(e) => setLoginDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Email ou identifiant
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                onClick={() => handleDirectLogin()}
                disabled={authLoading}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
              >
                Connexion immédiate à ce profil
              </button>
            </div>
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
              <h3 className="text-base font-extrabold text-slate-900">Ajouter un ami Aura</h3>
              <button
                type="button"
                onClick={() => setAddFriendModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Nom du contact</label>
              <input
                type="text"
                required
                placeholder="ex: Maxime Renaud"
                value={newFriendName}
                onChange={(e) => setNewFriendName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                Pseudo @handle ou Email
              </label>
              <input
                type="text"
                placeholder="ex: @maxime.r"
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

      {/* New Chat Modal */}
      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">Nouvelle conversation</h3>
              <button
                onClick={() => setNewChatModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Choisissez un contact ou lancez l&apos;assistant Aura IA :
            </p>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              <button
                onClick={() => {
                  setNewChatModalOpen(false);
                  setActiveTab('ai');
                }}
                className="w-full p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 flex items-center gap-3 text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-[#5B4FE9] text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-indigo-950">Aura IA Pro</div>
                  <div className="text-[11px] text-indigo-600">Assistant multimodal & résumés</div>
                </div>
              </button>
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setNewChatModalOpen(false);
                    openConversation(c.id);
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-50 flex items-center gap-3 text-left"
                >
                  <img src={c.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">{c.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {c.isGroup ? 'Salon de groupe' : 'Message direct E2EE'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#5B4FE9] text-white flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">{currentUser.displayName}</h3>
            <p className="text-xs text-indigo-600 font-semibold">@{currentUser.username}</p>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto">
              <QrCode className="w-36 h-36 text-slate-800" />
            </div>
            <p className="text-[11px] text-slate-500">
              Scannez ce code depuis Aura Messenger pour m&apos;ajouter instantanément.
            </p>
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
            <div className="w-36 h-36 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-emerald-400 animate-pulse">
              <img
                src={activeCall.targetAvatar}
                alt={activeCall.targetName}
                className="w-full h-full rounded-full object-cover border-4 border-slate-950"
              />
            </div>
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
    </div>
  );
}
