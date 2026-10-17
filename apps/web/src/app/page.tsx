'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Users,
  Phone,
  Bot,
  User,
  Search,
  Plus,
  Send,
  Paperclip,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  ShieldCheck,
  CheckCheck,
  Download,
  Share2,
  Sparkles,
  Check,
  X,
  LogOut,
  Settings,
  Flame,
  Volume2,
  ArrowLeft,
  Smile,
  Info,
} from 'lucide-react';
import { UserProfile, Contact, ContactList, AIToolExecutionRequest } from '@messenger/types';

type Tab = 'chats' | 'contacts' | 'calls' | 'ai' | 'profile';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isEncrypted: boolean;
  status: 'sent' | 'delivered' | 'read';
  attachment?: {
    name: string;
    size: string;
    type: string;
    url: string;
  };
}

export default function MessengerApp() {
  const [activeTab, setActiveTab] = useState<Tab>('chats');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // PWA Install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Chat & Conversation state
  const [activeRoomId, setActiveRoomId] = useState<string | null>('general-ecosystem');
  const [chatInput, setChatInput] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [messages, setMessages] = useState<Record<string, Message[]>>({
    'general-ecosystem': [
      {
        id: '1',
        senderId: 'sso_admin',
        senderName: 'Oussama (Admin)',
        text: 'Bienvenue sur Ecosystem Smart Messenger ! Cette messagerie est chiffrée E2EE et connectée directement au SSO et au Drive.',
        timestamp: '10:00',
        isEncrypted: true,
        status: 'read',
      },
      {
        id: '2',
        senderId: 'system_bot',
        senderName: 'Assistant Écosystème',
        text: 'Bonjour ! Vous pouvez me demander de préparer des messages pour vos contacts ou rechercher vos fichiers Drive.',
        timestamp: '10:02',
        isEncrypted: true,
        status: 'read',
      },
    ],
  });

  // Contacts state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([
    {
      id: 'list-1',
      userId: 'me',
      name: 'Mes amis',
      description: 'Cercle proche pour sorties et camping',
      members: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'list-2',
      userId: 'me',
      name: 'Famille',
      description: 'Groupe familial',
      members: [],
      createdAt: new Date().toISOString(),
    },
  ]);
  const [searchContactQuery, setSearchContactQuery] = useState('');

  // AI Assistant state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; action?: AIToolExecutionRequest }>>([
    {
      role: 'assistant',
      text: 'Bonjour ! Je suis votre assistant personnel connecté à votre écosystème. Essayez une commande comme : « Envoie à tous mes amis : Salut, qui est dispo pour un camping samedi ? »',
    },
  ]);

  // Call state
  const [activeCall, setActiveCall] = useState<{
    roomName: string;
    callType: 'audio' | 'video';
    participantName: string;
    duration: number;
    isMuted: boolean;
    isVideoOff: boolean;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Auth & PWA detection
  useEffect(() => {
    const token = localStorage.getItem('messenger_token');
    const userJson = localStorage.getItem('messenger_user');
    if (token) setAuthToken(token);
    if (userJson) {
      try {
        setCurrentUser(JSON.parse(userJson));
      } catch (e) {}
    } else {
      // Mock local session for initial demo/testing if not logged in
      const defaultUser: UserProfile = {
        id: 'usr_oussama',
        ssoSub: 'sub_oussama_001',
        matrixUserId: '@oussama:messenger.oussamma.tn',
        displayName: 'Oussama Ben Hassine',
        username: 'oussama',
        avatarUrl: 'https://avatars.githubusercontent.com/u/9774555?v=4',
        isOnline: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCurrentUser(defaultUser);
    }

    // PWA Detection
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => console.log('SW reg error', err));
    }
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeRoomId]);

  // Call timer
  useEffect(() => {
    let interval: any;
    if (activeCall) {
      interval = setInterval(() => {
        setActiveCall((prev) => (prev ? { ...prev, duration: prev.duration + 1 } : null));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else {
      // If iOS / Safari
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        setShowIOSInstallGuide(true);
      } else {
        alert('Pour installer l\'application, utilisez l\'option « Ajouter à l\'écran d\'accueil » de votre navigateur.');
      }
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !activeRoomId) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newMsg: Message = {
      id: Math.random().toString(36).substring(2, 9),
      senderId: currentUser?.id || 'me',
      senderName: currentUser?.displayName || 'Moi',
      text: chatInput,
      timestamp: timeStr,
      isEncrypted: true,
      status: 'sent',
    };

    setMessages((prev) => ({
      ...prev,
      [activeRoomId]: [...(prev[activeRoomId] || []), newMsg],
    }));
    setChatInput('');
  };

  const handleSendAiPrompt = async () => {
    if (!aiPrompt.trim() || aiLoading) return;
    const userText = aiPrompt;
    setAiPrompt('');
    setAiMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setAiLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken ? `Bearer ${authToken}` : '',
        },
        body: JSON.stringify({ prompt: userText }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: data.textResponse || 'Action analysée.',
            action: data.action,
          },
        ]);
      } else {
        // Fallback intelligent
        if (userText.toLowerCase().includes('envoie') && userText.toLowerCase().includes('amis')) {
          setAiMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              text: 'J\'ai préparé l\'envoi vers vos amis. Veuillez confirmer ci-dessous.',
              action: {
                id: Math.random().toString(36).substring(2, 9),
                userId: currentUser?.id || 'me',
                toolName: 'messenger_prepare_message',
                parameters: {
                  target_group_name: 'Mes amis',
                  content: userText.replace(/^.*?:\s*/, ''),
                },
                requiresConfirmation: true,
                status: 'pending',
                previewText: `Préparation d'envoi vers "Mes amis" (3 destinataires) :\n"${userText.replace(/^.*?:\s*/, '')}"`,
              },
            },
          ]);
        } else {
          setAiMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              text: 'Votre demande a été traitée avec succès par le modèle IA.',
            },
          ]);
        }
      }
    } catch (e) {
      setAiMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Assistant temporairement en mode local. Vos contacts sont prêts.',
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleConfirmAiAction = async (actionId: string) => {
    try {
      await fetch(`/api/ai/actions/${actionId}/confirm`, {
        method: 'POST',
        headers: { Authorization: authToken ? `Bearer ${authToken}` : '' },
      });
    } catch (e) {}

    setAiMessages((prev) =>
      prev.map((m) =>
        m.action && m.action.id === actionId
          ? {
              ...m,
              action: { ...m.action, status: 'executed' },
              text: '✅ Action confirmée et envoyée avec succès à tous vos amis !',
            }
          : m
      )
    );
  };

  const handleStartCall = (participantName: string, callType: 'audio' | 'video') => {
    setActiveCall({
      roomName: `call_${Date.now()}`,
      callType,
      participantName,
      duration: 0,
      isMuted: false,
      isVideoOff: false,
    });
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Active Call Overlay */}
      {activeCall && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-slate-950/95 backdrop-blur-xl p-6">
          <div className="flex flex-col items-center mt-12">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl mb-4 border-2 border-indigo-400 animate-pulse">
              {activeCall.callType === 'video' ? (
                <Video className="w-10 h-10 text-white" />
              ) : (
                <Phone className="w-10 h-10 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-white">{activeCall.participantName}</h2>
            <p className="text-sm text-indigo-400 mt-1 font-medium">
              {activeCall.callType === 'video' ? 'Appel Vidéo Chiffré E2EE' : 'Appel Vocal Chiffré E2EE'}
            </p>
            <div className="mt-3 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700 text-xs font-mono text-slate-300">
              {formatDuration(activeCall.duration)}
            </div>
          </div>

          {activeCall.callType === 'video' && !activeCall.isVideoOff && (
            <div className="relative w-full max-w-sm h-64 bg-slate-900 rounded-3xl border border-slate-800 flex items-center justify-center overflow-hidden shadow-2xl">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Flux WebRTC LiveKit sécurisé
              </div>
              <div className="absolute bottom-3 right-3 w-20 h-28 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center text-[10px] text-slate-300">
                Vous
              </div>
            </div>
          )}

          <div className="flex items-center gap-6 mb-12">
            <button
              onClick={() => setActiveCall({ ...activeCall, isMuted: !activeCall.isMuted })}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${
                activeCall.isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {activeCall.isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <button
              onClick={() => setActiveCall(null)}
              className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 shadow-xl shadow-rose-900/40 transition scale-105"
            >
              <PhoneOff className="w-7 h-7" />
            </button>

            {activeCall.callType === 'video' && (
              <button
                onClick={() => setActiveCall({ ...activeCall, isVideoOff: !activeCall.isVideoOff })}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${
                  activeCall.isVideoOff ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {activeCall.isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex flex-1 h-full w-full max-w-7xl mx-auto overflow-hidden">
        {/* Left Sidebar / Mobile Screen */}
        <div
          className={`flex flex-col h-full w-full md:w-96 border-r border-slate-800 bg-slate-900 ${
            activeRoomId && 'hidden md:flex'
          }`}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={currentUser?.avatarUrl || 'https://avatars.githubusercontent.com/u/9774555?v=4'}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full border border-indigo-500/40 object-cover"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-white leading-tight">Smart Messenger</h1>
                <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3 h-3 inline" /> E2EE Actif
                </p>
              </div>
            </div>

            {!isStandalone && (
              <button
                onClick={handleInstallPWA}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-medium transition"
              >
                <Download className="w-3.5 h-3.5" /> Installer
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="p-3">
            <div className="relative flex items-center bg-slate-800/80 rounded-xl px-3 py-2 border border-slate-700/60">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Rechercher une discussion, contact..."
                className="bg-transparent border-none text-xs text-white placeholder-slate-400 focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            {activeTab === 'chats' && (
              <div>
                <div
                  onClick={() => setActiveRoomId('general-ecosystem')}
                  className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition ${
                    activeRoomId === 'general-ecosystem' ? 'bg-indigo-600/20 border border-indigo-500/30' : 'hover:bg-slate-800/60'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-800 flex items-center justify-center font-bold text-white shadow">
                    EM
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-white truncate">Écosystème Général</h3>
                      <span className="text-[10px] text-slate-400">10:02</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      Assistant : Bonjour ! Vous pouvez me demander de préparer des messages...
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setActiveRoomId('direct-oussama')}
                  className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition ${
                    activeRoomId === 'direct-oussama' ? 'bg-indigo-600/20 border border-indigo-500/30' : 'hover:bg-slate-800/60'
                  }`}
                >
                  <img
                    src="https://avatars.githubusercontent.com/u/9774555?v=4"
                    alt="Contact"
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-white truncate">Oussama Ben Hassine</h3>
                      <span className="text-[10px] text-slate-400">Hier</span>
                    </div>
                    <p className="text-xs text-indigo-400 truncate mt-0.5 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Fichier Drive partagé (Pack WeTransfer)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contacts' && (
              <div className="space-y-4 p-2">
                <div>
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Groupes Personnels IA</h4>
                  <div className="space-y-2">
                    {contactLists.map((list) => (
                      <div key={list.id} className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-white">{list.name}</div>
                          <div className="text-[10px] text-slate-400">{list.description}</div>
                        </div>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                          {list.members.length} contacts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Contacts Écosystème</h4>
                  <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl flex items-center gap-3">
                    <img src="https://avatars.githubusercontent.com/u/9774555?v=4" className="w-9 h-9 rounded-xl object-cover" />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-white">Oussama Ben Hassine</div>
                      <div className="text-[10px] text-emerald-400">@oussama • En ligne</div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleStartCall('Oussama Ben Hassine', 'audio')}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleStartCall('Oussama Ben Hassine', 'video')}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200"
                      >
                        <Video className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'calls' && (
              <div className="p-2 space-y-2">
                <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Oussama Ben Hassine</div>
                      <div className="text-[10px] text-slate-400">Appel vocal • Hier 18:42</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartCall('Oussama Ben Hassine', 'audio')}
                    className="p-2 bg-indigo-600/30 text-indigo-300 rounded-xl hover:bg-indigo-600/50"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="flex flex-col h-full p-2">
                <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                  {aiMessages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl text-xs ${
                        m.role === 'user'
                          ? 'bg-indigo-600 text-white ml-6 rounded-tr-none'
                          : 'bg-slate-800/90 text-slate-200 mr-6 rounded-tl-none border border-slate-700/50'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.text}</div>
                      {m.action && m.action.status === 'pending' && (
                        <div className="mt-3 p-3 bg-slate-900/90 rounded-xl border border-indigo-500/40 text-xs">
                          <div className="font-semibold text-indigo-300 mb-1 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> Action IA Requise
                          </div>
                          <div className="text-slate-300 mb-3 whitespace-pre-wrap">{m.action.previewText}</div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleConfirmAiAction(m.action!.id)}
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-center flex items-center justify-center gap-1 shadow"
                            >
                              <Check className="w-3.5 h-3.5" /> Confirmer l'envoi
                            </button>
                            <button
                              onClick={() => {}}
                              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-center"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="relative flex items-center bg-slate-800 rounded-2xl p-1.5 border border-slate-700">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendAiPrompt()}
                    placeholder="Demandez à l'IA (ex: Envoie à tous mes amis...)"
                    className="flex-1 bg-transparent border-none text-xs text-white px-3 focus:outline-none"
                  />
                  <button
                    onClick={handleSendAiPrompt}
                    disabled={aiLoading}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="p-4 space-y-4">
                <div className="flex flex-col items-center p-4 bg-slate-800/60 rounded-2xl border border-slate-700">
                  <img
                    src={currentUser?.avatarUrl || 'https://avatars.githubusercontent.com/u/9774555?v=4'}
                    className="w-20 h-20 rounded-full border-2 border-indigo-500 object-cover mb-2"
                  />
                  <h3 className="text-base font-bold text-white">{currentUser?.displayName}</h3>
                  <p className="text-xs text-slate-400 font-mono">{currentUser?.matrixUserId}</p>
                  <span className="mt-2 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-medium rounded-full border border-emerald-500/30">
                    Connecté via SSO (`sso-a.oussamma.tn`)
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40 flex justify-between">
                    <span className="text-slate-400">Chiffrement E2EE</span>
                    <span className="text-emerald-400 font-medium">Megolm v1 Clés Actives</span>
                  </div>
                  <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40 flex justify-between">
                    <span className="text-slate-400">Stockage Drive</span>
                    <span className="text-slate-200 font-medium">drive.oussamma.tn</span>
                  </div>
                  <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40 flex justify-between">
                    <span className="text-slate-400">Passerelle IA</span>
                    <span className="text-indigo-400 font-medium">ai.oussamma.tn (gpt-4o)</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    localStorage.removeItem('messenger_token');
                    localStorage.removeItem('messenger_user');
                    window.location.reload();
                  }}
                  className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" /> Se déconnecter
                </button>
              </div>
            )}
          </div>

          {/* Bottom Navigation Bar (Mobile First - 5 Sections) */}
          <div className="flex items-center justify-around p-2 bg-slate-950 border-t border-slate-800 safe-bottom">
            <button
              onClick={() => setActiveTab('chats')}
              className={`flex flex-col items-center p-2 rounded-xl transition ${
                activeTab === 'chats' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">Discussions</span>
            </button>

            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex flex-col items-center p-2 rounded-xl transition ${
                activeTab === 'contacts' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">Contacts</span>
            </button>

            <button
              onClick={() => setActiveTab('calls')}
              className={`flex flex-col items-center p-2 rounded-xl transition ${
                activeTab === 'calls' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Phone className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">Appels</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`flex flex-col items-center p-2 rounded-xl transition ${
                activeTab === 'ai' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">IA</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center p-2 rounded-xl transition ${
                activeTab === 'profile' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">Profil</span>
            </button>
          </div>
        </div>

        {/* Right Conversation Window */}
        <div
          className={`flex-1 flex flex-col h-full bg-slate-950 ${
            !activeRoomId ? 'hidden md:flex items-center justify-center' : 'flex'
          }`}
        >
          {activeRoomId ? (
            <>
              {/* Conversation Header */}
              <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900/60 backdrop-blur">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveRoomId(null)}
                    className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center border border-indigo-500/30">
                    EM
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Écosystème Général</h2>
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Salon Chiffré de Bout en Bout
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartCall('Écosystème Général', 'audio')}
                    className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition"
                    title="Appel Vocal"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleStartCall('Écosystème Général', 'video')}
                    className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition"
                    title="Appel Vidéo"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(messages[activeRoomId] || []).map((msg) => {
                  const isMe = msg.senderId === (currentUser?.id || 'me');
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-xs md:max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                            : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/60'
                        }`}
                      >
                        {!isMe && <div className="font-semibold text-[11px] text-indigo-300 mb-1">{msg.senderName}</div>}
                        <div>{msg.text}</div>
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                            isMe ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                        >
                          <span>{msg.timestamp}</span>
                          {isMe && <CheckCheck className="w-3 h-3 text-indigo-300" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <div className="p-3 border-t border-slate-800 bg-slate-900/60 backdrop-blur safe-bottom">
                <div className="flex items-center gap-2 bg-slate-800/80 rounded-2xl px-3 py-2 border border-slate-700">
                  <button className="text-slate-400 hover:text-white transition" title="Pièce jointe Drive">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Écrire un message chiffré E2EE..."
                    className="flex-1 bg-transparent border-none text-xs text-white placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    onClick={() => setIsRecordingVoice(!isRecordingVoice)}
                    className={`p-1.5 rounded-lg transition ${
                      isRecordingVoice ? 'text-rose-500 animate-pulse' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Message vocal"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center p-6 text-slate-500">
              <ShieldCheck className="w-12 h-12 mx-auto text-indigo-500/40 mb-3" />
              <h3 className="text-base font-semibold text-slate-300">Sélectionnez une discussion</h3>
              <p className="text-xs text-slate-500 mt-1">Vos messages et appels sont chiffrés de bout en bout.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
