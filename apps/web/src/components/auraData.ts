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
  {
    id: 'story-thomas',
    name: 'Thomas',
    conversationId: 'room-weekend',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    online: true,
  },
  {
    id: 'story-sophie',
    name: 'Sophie',
    conversationId: 'room-sophie',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    online: true,
  },
  {
    id: 'story-camille',
    name: 'Camille',
    conversationId: 'room-camille',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    online: true,
  },
  {
    id: 'story-lucas',
    name: 'Lucas',
    conversationId: 'room-lucas',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    online: true,
  },
];

export const INITIAL_CONVERSATIONS: ConversationRoom[] = [
  {
    id: 'room-weekend',
    name: 'Thomas & Sophie (Projet Voyage ✈️)',
    isGroup: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    groupAvatars: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    ],
    extraMembersCount: 3,
    subtitle: 'Camille, Thomas, Lucas, Sophie, Vous',
    lastMessage: 'Sophie : On réserve les billets ce soir ?',
    lastMessageType: 'text',
    timestamp: '14:28',
    unread: 2,
    online: true,
    statusText: '5 membres • 4 en ligne',
    pinnedBanner: {
      title: 'Sondage actif : Destination finale',
      subtitle: 'Votez avant 18h • Déjà 4 réponses',
    },
    smartSuggestions: [
      { label: '✨ Proposer un itinéraire', replyText: 'Aura, peux-tu nous proposer un itinéraire détaillé pour ce week-end ?' },
      { label: '🧺 Répartir les courses', replyText: 'Voici la répartition des courses pour les 5 participants du week-end !' },
      { label: '☀️ Météo côte', replyText: 'Quel temps fait-il sur la côte ce week-end ?' },
    ],
  },
  {
    id: 'room-camille',
    name: 'Camille Martin',
    isGroup: false,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    lastMessage: 'Note vocale (0:42)',
    lastMessageType: 'voice',
    timestamp: '13:15',
    unread: 1,
    online: true,
    statusText: 'En ligne il y a 2 min',
    smartSuggestions: [
      { label: 'Réserver pour 20h 🍷', replyText: 'Parfait, je réserve la table pour 20h00 ce soir ! 🍷' },
      { label: "Partager l'itinéraire 📍", replyText: "Je t'envoie l'itinéraire vers le restaurant dans le 11e 📍" },
    ],
  },
  {
    id: 'room-design',
    name: 'Équipe Design Studio',
    isGroup: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    groupAvatars: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    ],
    extraMembersCount: 4,
    subtitle: 'Maxime, Sophie, Lucas, Claire, Vous',
    lastMessage: 'Maxime : a partagé un fichier Figma',
    lastMessageType: 'file',
    timestamp: '11:40',
    unread: 0,
    online: true,
    statusText: '6 membres • 3 en ligne',
    smartSuggestions: [
      { label: '✨ Valider la maquette Aura', replyText: 'Les composants Figma Aura v2 sont validés pour la prod ! 🚀' },
      { label: '📁 Ouvrir sur ByteVault Drive', replyText: "J'ai synchronisé le fichier Figma sur notre ByteVault Drive." },
    ],
  },
  {
    id: 'room-lucas',
    name: 'Lucas Bernard',
    isGroup: false,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    lastMessage: 'Merci pour le transfert ! À demain 👋',
    lastMessageType: 'text',
    timestamp: 'Hier',
    unread: 0,
    online: true,
    statusText: 'Disponible pour un appel 📞',
    smartSuggestions: [
      { label: 'À demain Lucas 👋', replyText: 'Avec plaisir Lucas, à demain matin ! 👋' },
      { label: 'Lancer un appel rapide 📞', replyText: 'Dispo pour un point vocal de 5 min ?' },
    ],
  },
  {
    id: 'room-sophie',
    name: 'Sophie Laurent',
    isGroup: false,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    lastMessage: "J'ai mis à jour le dossier partagé Drive.",
    lastMessageType: 'text',
    timestamp: 'Hier',
    unread: 0,
    online: true,
    statusText: 'En pause ☕',
    smartSuggestions: [
      { label: 'Bien reçu, merci ! ✨', replyText: 'Super, je regarde les fichiers sur le Drive tout de suite !' },
    ],
  },
];

export const INITIAL_MESSAGES: Record<string, ChatMessageItem[]> = {
  'room-camille': [
    {
      id: 'm-cam-1',
      senderId: 'usr-camille-2',
      senderName: 'Camille Martin',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      content: 'Coucou ! Tu as pu regarder les propositions pour le dîner de ce soir ? 🍝',
      timestamp: '14:20',
      isOwn: false,
      type: 'text',
    },
    {
      id: 'm-cam-2',
      senderId: 'usr-oussama-1',
      senderName: 'Vous',
      content: 'Oui ! Le petit restaurant italien près du canal me tente énormément.',
      timestamp: '14:22',
      isOwn: true,
      type: 'text',
    },
    {
      id: 'm-cam-3',
      senderId: 'usr-camille-2',
      senderName: 'Camille Martin',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      content: 'Message vocal',
      voiceCurrent: '0:14',
      voiceDuration: '0:35',
      timestamp: '14:23',
      isOwn: false,
      type: 'voice',
    },
    {
      id: 'm-cam-4',
      senderId: 'usr-camille-2',
      senderName: 'Camille Martin',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      content: "Ça a l'air parfait ! 😍",
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700&auto=format&fit=crop&q=80',
      imageLocation: 'Paris 11e',
      reactions: [{ emoji: '🍝 ✨', count: 2 }],
      timestamp: '14:24',
      isOwn: false,
      type: 'image',
    },
  ],
  'room-weekend': [
    {
      id: 'm-grp-1',
      senderId: 'usr-thomas-3',
      senderName: 'Thomas Dubois',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      content: "Salut tout le monde ! J'ai repéré deux options sympas sur la côte pour le week-end prochain 🌊",
      timestamp: '11:15',
      isOwn: false,
      type: 'text',
    },
    {
      id: 'm-grp-2',
      senderId: 'usr-camille-2',
      senderName: 'Camille Martin',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      content: 'Sondage du groupe',
      timestamp: '11:18',
      isOwn: false,
      type: 'poll',
      pollData: {
        id: 'poll-hebergement',
        question: 'Quel hébergement préférez-vous ?',
        totalVotes: 5,
        options: [
          {
            id: 'opt-1',
            label: 'Maison côtière avec jardin',
            votes: 3,
            selected: true,
            voters: [
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
            ],
          },
          {
            id: 'opt-2',
            label: 'Camping et van aménagé',
            votes: 2,
            selected: false,
            voters: [
              'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
            ],
          },
        ],
      },
    },
    {
      id: 'm-grp-3',
      senderId: 'usr-oussama-1',
      senderName: 'Vous',
      content: 'A voté pour la maison côtière ! Je peux prendre ma voiture (4 places dispos) 🚗',
      timestamp: '11:20',
      isOwn: true,
      type: 'text',
    },
    {
      id: 'm-grp-4',
      senderId: 'aura-bot',
      senderName: 'Aura Bot',
      content: 'Note de groupe',
      timestamp: '11:21',
      isOwn: false,
      type: 'aura-note',
      auraNoteData: {
        title: 'Note de groupe',
        text: "J'ai ajouté le rappel de réservation pour ce soir à 19h et calculé le budget estimé : 85€ / personne (essence + logement inclus).",
        actions: [
          { label: "📅 Consulter l'événement", actionType: 'calendar' },
          { label: 'Faire un virement (Lydia/Rib)', actionType: 'payment' },
        ],
      },
    },
  ],
  'room-design': [
    {
      id: 'm-des-1',
      senderId: 'usr-sophie-4',
      senderName: 'Sophie Laurent',
      senderAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
      content: 'Voici les écrans finaux du thème Aura Light/Indigo validés ce matin.',
      timestamp: '11:35',
      isOwn: false,
      type: 'text',
    },
    {
      id: 'm-des-2',
      senderId: 'usr-oussama-1',
      senderName: 'Vous',
      content: 'Superbe travail, le contraste indigo et les cartes épurées rendent super bien sur mobile !',
      timestamp: '11:40',
      isOwn: true,
      type: 'text',
    },
  ],
  'room-lucas': [
    {
      id: 'm-luc-1',
      senderId: 'usr-lucas-5',
      senderName: 'Lucas Bernard',
      senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      content: 'Merci pour le transfert ! À demain 👋',
      timestamp: 'Hier',
      isOwn: false,
      type: 'text',
    },
  ],
  'room-sophie': [
    {
      id: 'm-sop-1',
      senderId: 'usr-sophie-4',
      senderName: 'Sophie Laurent',
      senderAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
      content: "J'ai mis à jour le dossier partagé Drive.",
      timestamp: 'Hier',
      isOwn: false,
      type: 'text',
    },
  ],
};

export const INITIAL_FRIEND_REQUESTS: FriendRequestItem[] = [
  {
    id: 'freq-clara',
    name: 'Clara Bellec',
    handle: '@clara.design',
    subtitle: '4 amis en commun (dont Camille)',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'freq-hugo',
    name: 'Hugo Mercier',
    handle: '@h.mercier',
    subtitle: 'Membre du groupe "Projet Week-end"',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  },
];

export const INITIAL_FRIENDS: FriendContact[] = [
  {
    id: 'fr-alex',
    name: 'Alexandre Moreau',
    handle: '@alex.moreau',
    bio: 'Lead Tech @ Studio',
    activityBadge: 'Au bureau 💻',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    online: true,
    favorite: false,
    letter: 'A',
    conversationId: 'room-design',
  },
  {
    id: 'fr-camille',
    name: 'Camille Martin',
    handle: '@camille.m',
    bio: 'En voyage à Lisbonne ☀️',
    activityBadge: 'En voyage ✈️',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    online: true,
    favorite: true,
    letter: 'C',
    conversationId: 'room-camille',
  },
  {
    id: 'fr-lucas',
    name: 'Lucas Bernard',
    handle: '@lucas.b',
    bio: 'Disponible pour un appel 📞',
    activityBadge: 'Musique 🎵',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    online: true,
    favorite: false,
    letter: 'L',
    conversationId: 'room-lucas',
  },
  {
    id: 'fr-manon',
    name: 'Manon Lefèvre',
    handle: '@manon.l',
    bio: 'Photographe freelance 📸',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    online: false,
    favorite: false,
    letter: 'M',
  },
  {
    id: 'fr-sophie',
    name: 'Sophie Laurent',
    handle: '@sophie.l',
    bio: 'Product Designer • En pause ☕',
    activityBadge: 'En pause ☕',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    online: true,
    favorite: true,
    letter: 'S',
    conversationId: 'room-sophie',
  },
  {
    id: 'fr-thomas',
    name: 'Thomas Dubois',
    handle: '@thomas.d',
    bio: 'Ne pas déranger avant 17h 🎯',
    activityBadge: 'Au bureau 💻',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    online: true,
    favorite: true,
    letter: 'T',
    conversationId: 'room-weekend',
  },
];

export const INITIAL_AI_MESSAGES: AIMessageEntry[] = [
  {
    id: 'ai-m-1',
    role: 'user',
    content: 'Peux-tu me faire un résumé du groupe "Projet Week-end" et lister ce qu\'il reste à apporter ?',
    timestamp: '14:25',
  },
  {
    id: 'ai-m-2',
    role: 'assistant',
    content: 'Voici la synthèse du groupe "Projet Week-end & Roadtrip" :',
    timestamp: '14:25',
    synthesis: {
      title: 'Aura Synthèse',
      bullets: [
        {
          label: 'Hébergement',
          text: 'La maison côtière avec jardin est en tête du sondage (60%, 3 votes).',
        },
        {
          label: 'Départ convenu',
          text: 'Vendredi à 18h30 depuis Porte d’Orléans (voiture de Thomas).',
        },
      ],
      tasks: [
        {
          id: 'task-1',
          text: 'Réserver la maison avant 19h',
          assignee: '(Vous)',
          done: true,
        },
        {
          id: 'task-2',
          text: 'Apporter glacière et boissons',
          assignee: '(Thomas)',
          done: false,
        },
        {
          id: 'task-3',
          text: 'Préparer la playlist roadtrip',
          assignee: '(Sophie)',
          done: false,
        },
      ],
    },
  },
];
