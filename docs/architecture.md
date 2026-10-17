# Architecture Technique Détaillée — Ecosystem Smart Messenger

## 1. Principes Directeurs
- **Mobile First :** Chaque interface est conçue prioritairement pour des terminaux mobiles (navigation tactile, zones cliquables ergonomiques >= 48px, gestion souple du clavier virtuel, barre de navigation basse).
- **Zéro Duplication :** Exploitation maximale des services existants (`sso-a.oussamma.tn`, `drive.oussamma.tn`, `ai.oussamma.tn`).
- **Chiffrement de Bout en Bout (E2EE) :** Respect des protocoles cryptographiques Matrix (Olm / Megolm). Aucun secret en clair dans les logs ou les bases de données intermédiaires.

---

## 2. Découpage Modulaire

### 2.1 Applications (`apps/`)
- **`apps/web`** : Interface Next.js 14+ (App Router) avec Tailwind CSS, Lucide Icons, support PWA (Manifest, Service Worker) et intégration Matrix JS SDK.
- **`apps/api`** : Backend NestJS servant d'API métier (gestion des contacts personnalisés, profils d'utilisateurs, gestion des listes d'amis pour l'IA, webhooks et sessions LiveKit).
- **`apps/ai-orchestrator`** : Moteur d'exécution des outils IA avec confirmation utilisateur obligatoire pour les actions critiques (envoi groupé, partage de documents).

### 2.2 Packages Partagés (`packages/`)
- **`packages/types`** : Types TypeScript stricts partagés (utilisateurs, contacts, événements, payloads d'outils IA).
- **`packages/auth`** : Flux OIDC avec PKCE (RFC 7636), stockage sécurisé des jetons et rafraîchissement silencieux.
- **`packages/matrix`** : Encapsulation du protocole Matrix (gestion des salons, synchronisation d'état, E2EE).
- **`packages/drive-connector`** : Client HTTP typé vers l'API Drive ByteVault (`drive.oussamma.tn`).
- **`packages/ai-connector`** : Client typé vers la passerelle LiteLLM (`ai.oussamma.tn/v1`).
- **`packages/notification-connector`** : Adaptateur pour notifications push et publication d'événements.

---

## 3. Modèle de Données PostgreSQL (API NestJS)

```sql
-- Profils utilisateurs étendus (complétant les données SSO)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sso_sub VARCHAR(255) UNIQUE NOT NULL,
    matrix_user_id VARCHAR(255) UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    status_message VARCHAR(255),
    is_online BOOLEAN DEFAULT false,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gestion des relations d'amitié et contacts
CREATE TABLE user_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    is_favorite BOOLEAN DEFAULT false,
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, contact_id)
);

-- Groupes personnels de contacts (utilisés pour les commandes IA de type "tous mes amis")
CREATE TABLE contact_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE contact_list_members (
    list_id UUID REFERENCES contact_lists(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (list_id, contact_id)
);

-- Actions IA demandées et soumises à confirmation
CREATE TABLE ai_action_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    tool_name VARCHAR(100) NOT NULL,
    tool_arguments JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending_confirmation', -- pending_confirmation, confirmed, executed, rejected
    execution_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 4. Flux d'Appel Audio & Vidéo (LiveKit)

1. L'utilisateur déclenche un appel depuis le client Web (1:1 ou groupe).
2. Le client sollicite l'API NestJS (`POST /api/calls/token`) avec l'identifiant du salon.
3. L'API vérifie les droits d'accès du participant et génère un jeton JWT LiveKit à courte durée de vie (signé avec `LIVEKIT_API_SECRET`).
4. Le client se connecte au serveur LiveKit SFU via WebSockets sécurisés (`wss://messenger.oussamma.tn/livekit`).
5. Le serveur TURN (`coturn`) assure le relais UDP/TCP en cas de restrictions NAT/Firewall.
