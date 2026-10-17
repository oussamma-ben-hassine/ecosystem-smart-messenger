# Guide Pour les Agents IA & Développeurs — Ecosystem Smart Messenger

Bienvenue sur le projet **Ecosystem Smart Messenger**. Ce document sert de source de vérité opérationnelle pour tout agent d'assistance IA ou développeur reprenant ce projet.

---

## 1. Vision et Objectifs

Ecosystem Smart Messenger est une application SaaS de messagerie instantanée intelligente, chiffrée de bout en bout (E2EE), Mobile First et installable en PWA. Elle s'intègre nativement à l'écosystème personnel auto-hébergé sur le VPS OVH via Coolify :
- **SSO (`sso-a.oussamma.tn`)** pour l'authentification OpenID Connect unifiée.
- **Drive (`drive.oussamma.tn`)** pour le stockage sécurisé et le partage des médias/fichiers.
- **LiteLLM (`ai.oussamma.tn/v1`)** pour l'intelligence artificielle, l'assistance conversationnelle et l'exécution d'actions (Tool Calling).
- **Matrix Protocol** pour les conversations temps réel, la présence et le chiffrement E2EE.
- **LiveKit / WebRTC** pour les appels vocaux et vidéo haute qualité.

---

## 2. Structure du Monorepo

```text
ecosystem-smart-messenger/
├── apps/
│   ├── web/                     # Application PWA Mobile-First (Next.js 14+ App Router, Tailwind, Lucide)
│   ├── api/                     # Backend métier (NestJS, PostgreSQL, OpenAPI, Auth OIDC)
│   └── ai-orchestrator/         # Moteur d'orchestration IA (LiteLLM, Tool Execution, confirmations)
├── packages/
│   ├── ui/                      # Composants UI partagés, tokens et thèmes Tailwind
│   ├── types/                   # Définitions TypeScript partagées (Modèles, DTOs, Événements)
│   ├── auth/                    # Client OIDC, validation JWT et gestion de session PKCE
│   ├── matrix/                  # Client d'intégration Matrix & gestion des sessions
│   ├── drive-connector/         # Adaptateur client pour l'API du Drive (ByteVault)
│   ├── ai-connector/            # Client pour la passerelle LiteLLM et schémas d'outils
│   └── notification-connector/  # Adaptateur unifié de notifications & Web Push
├── infrastructure/
│   ├── docker/                  # Dockerfiles multi-stage de production
│   ├── coolify/                 # Configurations de déploiement Coolify et compose unifié
│   ├── matrix/                  # Configuration Matrix Synapse / Conduit
│   ├── livekit/                 # Configuration serveur LiveKit WebRTC
│   └── coturn/                  # Configuration serveur TURN/STUN pour traversée NAT
└── docs/
    ├── architecture.md          # Architecture technique complète
    ├── ecosystem-integration-audit.md # Rapport d'audit de l'écosystème
    ├── api.md                   # Documentation OpenAPI / Swagger des endpoints
    ├── deployment.md            # Guide de déploiement et d'exploitation Coolify
    ├── security.md              # Modèle de sécurité, gestion des clés E2EE et OIDC
    ├── developer-guide.md       # Guide de contribution locale
    └── progress.md              # Journal incrémental des jalons et tests
```

---

## 3. Configuration et Variables d'Environnement

### Variables Globales
```env
# SSO
SSO_ISSUER_URL=https://sso-a.oussamma.tn
SSO_CLIENT_ID=client_messenger_app
SSO_CLIENT_SECRET=change_me_secret_in_coolify
SSO_REDIRECT_URI=https://messenger.oussamma.tn/auth/callback

# API & Base de données
API_BASE_URL=https://messenger.oussamma.tn/api
DATABASE_URL=postgresql://messenger_user:messenger_pass@messenger-db:5432/messenger_db
REDIS_URL=redis://messenger-redis:6379

# Matrix & E2EE
MATRIX_HOMESERVER_URL=https://messenger.oussamma.tn/_matrix
MATRIX_SERVER_NAME=messenger.oussamma.tn

# Drive
DRIVE_BASE_URL=https://drive.oussamma.tn

# LiteLLM
AI_GATEWAY_URL=https://ai.oussamma.tn/v1
AI_GATEWAY_KEY=sk-oussamma-master-gateway-2026
AI_DEFAULT_MODEL=gpt-4o

# LiveKit
LIVEKIT_URL=wss://messenger.oussamma.tn/livekit
LIVEKIT_API_KEY=messenger_livekit_key
LIVEKIT_API_SECRET=messenger_livekit_secret
```

---

## 4. Règles d'Or pour les Développements

1. **Ne jamais inventer d'accès ni simuler de fausses données** : les connecteurs doivent être fonctionnels ou comporter des fallbacks gracieux explicitement documentés.
2. **Ne jamais exposer de secrets** : les clés privées, jetons de production et certificats ne doivent jamais être commités dans Git.
3. **E2EE First** : la messagerie privée ne doit pas exposer de contenu en clair aux serveurs intermédiaires ni dans les bases de données SQL.
4. **Mobile First PWA** : concevoir tous les écrans d'abord pour les écrans de smartphone (navigation en bas d'écran, safe areas, zones tactiles >= 48px).
5. **Autonomie & Commits Réguliers** : chaque étape validée doit faire l'objet d'un commit Git clair et d'une entrée dans `docs/progress.md`.
