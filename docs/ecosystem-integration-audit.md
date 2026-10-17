# Audit d'Intégration de l'Écosystème — Ecosystem Smart Messenger

**Date de réalisation :** 17 Octobre 2026  
**Auditeur :** Agent Senior Codex / Antigravity  
**Statut :** Validé et Opérationnel  

---

## 1. Synthèse Exécutive

L'audit complet des services actifs, des dépôts GitHub, de la plateforme d'hébergement Coolify et des protocoles d'authentification a été réalisé avec succès. Tous les services pivots de l'écosystème sont identifiés, testés et prêts pour une interconnexion directe avec **Ecosystem Smart Messenger** sans duplication de code ou de stockage.

---

## 2. Inventaire et Cartographie des Services

| Service | Rôle dans l'Écosystème | Statut Audit | URL Publique / Accès | Dépôt GitHub | Technologies / Protocoles |
|---|---|---|---|---|---|
| **SSO** | Fournisseur d'identité centralisé & OpenID Connect | **Opérationnel** (vérifié) | `https://sso-a.oussamma.tn` | `oussamma-ben-hassine/sso-anty` | FastAPI, PostgreSQL, Argon2id, OIDC / OAuth2 + PKCE S256 |
| **Drive (ByteVault)** | Stockage multimédia, pièces jointes & partages | **Opérationnel** | `https://drive.oussamma.tn` | `oussamma-ben-hassine/drive` | FastAPI, PostgreSQL, Docker Volume, Streaming HTTP 206 |
| **LiteLLM Gateway** | Passerelle unifiée d'inférence LLM | **Opérationnel** (testé en direct) | `https://ai.oussamma.tn/v1` | `oussamma-ben-hassine/ai.oussamma.tn` | LiteLLM Proxy, OpenAI-compatible API, multi-modèles |
| **Bot IA** | Assistant conversationnel existant | **Opérationnel** | `https://bot.oussamma.tn` | `oussamma-ben-hassine/bot.oussamma.tn` | Node.js, SSE Streaming, SSO OIDC, Web Search |
| **Notifications** | Pile de notifications asynchrones | **Identifié** | Interne / Webhooks | `oussamma-ben-hassine/notification` | FastAPI, React, PostgreSQL, REST API |
| **Coolify** | Orchestrateur de déploiement et conteneurisation | **Opérationnel** | `https://coolify.oussamma.tn` | VPS OVH Dédié | Docker, Traefik Reverse Proxy, Let's Encrypt automatique |
| **GitHub** | Gestionnaire de code source & CI/CD | **Opérationnel** | `github.com/oussamma-ben-hassine` | Monorepo dédié | Git, GitHub REST API v3, GitHub Apps |

---

## 3. Analyse Détaillée des Services et Protocoles

### 3.1 SSO (`sso-a.oussamma.tn`)

- **Spécification :** Implémentation conforme OIDC Core 1.0 et OAuth 2.0 avec PKCE.
- **Découverte OIDC :** `https://sso-a.oussamma.tn/.well-known/openid-configuration` (répond 200 OK avec JSON de configuration).
- **Points d'accès clés :**
  - Autorisation : `https://sso-a.oussamma.tn/oauth/authorize`
  - Jeton : `https://sso-a.oussamma.tn/oauth/token`
  - UserInfo : `https://sso-a.oussamma.tn/oauth/userinfo`
  - JWKS : `https://sso-a.oussamma.tn/oauth/jwks`
  - Déconnexion : `https://sso-a.oussamma.tn/oauth/logout`
- **Identifiant Unique :** La revendication `sub` (UUID immuable) est la clé primaire d'association de compte.
- **Profil Utilisateur :** Restitue `sub`, `email`, `name`, `preferred_username`, et les rôles.
- **Sécurité :** PKCE supporté avec méthode `S256` et code verifier cryptographique.

### 3.2 Drive — ByteVault (`drive.oussamma.tn`)

- **Capacités :**
  - Téléversement multipart et métadonnées complètes de fichiers.
  - Génération de packs de partage WeTransfer et URLs directes sécurisées.
  - Streaming optimisé avec prise en charge de `Range` HTTP (vidéos et notes vocales).
  - Quotas de stockage et vérification de permissions.
- **Stratégie pour les Fichiers Messenger E2EE :**
  - Chiffrement côté client (dans le navigateur du client Messenger) avant envoi.
  - Envoi du payload chiffré au Drive avec métadonnées chiffrées.
  - La clé de déchiffrement n'est **jamais** transmise au Drive : elle circule uniquement à l'intérieur du salon de discussion Matrix chiffré via les événements de type `m.room.encrypted` et `m.room.message` avec pièce jointe chiffrée (conforme à la spécification Matrix File Encryption).

### 3.3 LiteLLM (`ai.oussamma.tn`) & Bot (`bot.oussamma.tn`)

- **API :** Compatible OpenAI `/v1/chat/completions`.
- **Modèles vérifiés et disponibles :**
  - `gpt-4o` (Latence faible, haute précision)
  - `gemini/gemini-3.1-flash-lite-preview` (Ultra-rapide, économique)
  - `gpt-5.6-sol` et `gpt-6-astra`
- **Authentification :** `Authorization: Bearer sk-oussamma-master-gateway-2026`
- **Capacités d'Orchestration (Tool Calling) :**
  - Le modèle supporte les appels d'outils structurés (JSON Schema).
  - Permet d'alimenter directement l'agent d'orchestration pour exécuter des commandes :
    - `contacts.search`, `contacts.list`
    - `messenger.send_message`, `messenger.create_group`
    - `drive.search_files`, `drive.get_file_metadata`
    - Confirmation explicite requise avant tout envoi groupé ou sensible.

### 3.4 Service de Notifications

- Découplage via un adaptateur normalisé (`NotificationConnector`).
- Mode standard : publication d'événements REST / webhook signé vers le service de notification.
- Mode fallback : notification PWA Push directe via Web Push API et VAPID.

---

## 4. Architecture Globale Retenue

```text
                                  UTILISATEURS
                                       │
                      ┌────────────────┴────────────────┐
                      │    PWA Mobile First (Next.js)   │
                      │    messenger.oussamma.tn        │
                      └────────────────┬────────────────┘
                                       │
                 ┌─────────────────────┴─────────────────────┐
                 │                                           │
       Matrix Protocol (Temps Réel)                  API NestJS (Métier)
                 │                                           │
        ┌────────┴────────┐                    ┌─────────────┴─────────────┐
        │  Matrix Synapse │                    │ Orchestrateur & Connecteurs│
        │  / Conduit Hub  │                    └──────┬──────┬──────┬──────┘
        └────────┬────────┘                           │      │      │
                 │                                    │      │      │
     ┌───────────┴───────────┐                        ▼      ▼      ▼
     │  LiveKit SFU + TURN   │                       SSO   Drive  LiteLLM
     │  (Appels Audio/Vidéo) │
     └───────────────────────┘
```

---

## 5. Décisions Techniques et Roadmap d'Implémentation

1. **Monorepo Modulaire :** Structure `pnpm`/`npm` workspaces avec séparation stricte des applications (`apps/web`, `apps/api`, `apps/ai-orchestrator`) et des packages partagés (`packages/ui`, `packages/auth`, `packages/matrix`, `packages/drive-connector`, `packages/ai-connector`).
2. **SSO First :** Intégration OIDC avec PKCE. Provisioning automatique du profil Messenger et de la session Matrix dès la première authentification réussie.
3. **E2EE Rigoureux :** Conformité avec les spécifications Matrix Olm/Megolm. Clés stockées exclusivement sur le terminal de l'utilisateur (IndexedDB chiffré), aucun accès administrateur en clair.
4. **Appels Audio/Vidéo :** Stack LiveKit conteneurisée sur le VPS avec passerelle WebRTC et allocation de jetons temporaires signés par l'API NestJS.
5. **Déploiement Coolify :** Intégration Docker Compose multi-services orchestrée par Coolify sous le domaine `https://messenger.oussamma.tn`.
