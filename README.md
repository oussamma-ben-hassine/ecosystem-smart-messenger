# 📱 Ecosystem Smart Messenger

> Application de messagerie instantanée intelligente, sécurisée (Chiffrement de Bout en Bout E2EE), Mobile First, PWA installable et profondément intégrée à l'écosystème personnel auto-hébergé sur le VPS OVH (Coolify).

---

## 🌟 Fonctionnalités Clés

1. **Mobile First & PWA Installable :**
   - 5 sections optimisées mobile : **Discussions**, **Contacts**, **Appels**, **Assistant IA**, **Profil & Paramètres**.
   - Barre de navigation ergonomique avec support des Safe Areas.
   - Installable via Manifest PWA et Service Worker sur Android & iOS (instructions interactives Safari).
   - Mode bureau adaptatif avec vue scindée (Sidebar + Fenêtre de discussion).

2. **Authentification Unique SSO (`sso-a.oussamma.tn`) :**
   - Connexion OIDC PKCE (S256).
   - Synchronisation automatique du profil et attribution d'identifiant Matrix.
   - Déconnexion et gestion de session transparente.

3. **Messagerie Temps Réel & Sécurité E2EE :**
   - Protocoles Matrix (Olm / Megolm).
   - Salons directs 1:1 et groupes.
   - Horodatage, accusés de lecture et indicateurs d'états.

4. **Intégration Multimédia Drive (`drive.oussamma.tn`) :**
   - Chiffrement client des fichiers avant téléversement.
   - Partage de photos, vidéos, documents et messages vocaux.
   - Aucune exposition des clés de déchiffrement hors du salon Matrix chiffré.

5. **Appels Audio & Vidéo Haute Qualité (LiveKit & WebRTC) :**
   - Appels 1:1 et d'équipes en WebRTC.
   - Contrôles complets (Micro, Caméra, Déconnexion, Chronomètre).

6. **Assistant IA & Orchestration d'Actions (`ai.oussamma.tn`) :**
   - Connecté à LiteLLM (modèles `gpt-4o`, `gemini-3.1-flash-lite`).
   - Tool calling pour actions de messagerie : recherche de contacts, préparation de messages pour groupes personnels (ex : *« Envoie à tous mes amis : Salut qui est dispo pour un camping ? »*).
   - **Confirmation obligatoire** de l'utilisateur avant tout envoi groupé ou action sensible.

---

## 🏗️ Architecture du Monorepo

```text
ecosystem-smart-messenger/
├── apps/
│   ├── web/                    # PWA Next.js 14 App Router, Tailwind CSS, Lucide
│   ├── api/                    # NestJS API métier, OpenAPI / Swagger, LiveKit SDK
│   └── ai-orchestrator/        # Moteur d'exécution des outils IA
├── packages/
│   ├── types/                  # Types TypeScript stricts partagés
│   ├── auth/                   # Client SSO OIDC avec PKCE
│   ├── matrix/                 # Client Matrix & Rooms
│   ├── drive-connector/        # Adaptateur Drive ByteVault
│   └── ai-connector/           # Adaptateur LiteLLM et schémas d'outils
├── infrastructure/
│   ├── docker/                 # Dockerfiles multi-stage pour Web et API
│   ├── coolify/                # Configuration de déploiement Coolify
│   ├── matrix/                 # Configurations Matrix
│   └── livekit/                # Configurations LiveKit WebRTC
└── docs/                       # Documentation exhaustive
```

---

## 🚀 Déploiement Coolify

L'application est configurée pour un déploiement continu sur Coolify sous `https://messenger.oussamma.tn` avec Docker Compose.
Consultez [docs/deployment.md](docs/deployment.md) pour les détails d'exploitation.
