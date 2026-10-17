# Guide de Déploiement Coolify — Ecosystem Smart Messenger

## 1. Pré-requis sur Coolify
- **Serveur :** Serveur OVH VPS existant (`gbb1wmrvxtnheyf7h1fqttuk`).
- **Réseau :** Réseau Docker partagé `coolify`.
- **Domaine DNS :** `messenger.oussamma.tn` pointant vers l'IP du VPS.

---

## 2. Déploiement Automatisé via API Coolify

Le déploiement est orchestré avec la ressource Docker Compose liée au dépôt GitHub privé `oussamma-ben-hassine/ecosystem-smart-messenger`.

### Configuration de la ressource dans Coolify :
- **Build Pack :** `dockercompose`
- **Docker Compose Location :** `/docker-compose.yml`
- **FQDN :** `https://messenger.oussamma.tn`
- **Port Mapping :** Expose le conteneur `messenger-web:3000` vers le proxy Traefik.

---

## 3. Variables d'Environnement Coolify

```env
# Application
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://messenger.oussamma.tn/api

# SSO OpenID Connect
SSO_ISSUER_URL=https://sso-a.oussamma.tn
SSO_CLIENT_ID=client_messenger_app
SSO_CLIENT_SECRET=sec_messenger_super_secret_2026
SSO_REDIRECT_URI=https://messenger.oussamma.tn/auth/callback

# LiteLLM
AI_GATEWAY_URL=https://ai.oussamma.tn/v1
AI_GATEWAY_KEY=sk-oussamma-master-gateway-2026
AI_DEFAULT_MODEL=gpt-4o

# Drive
DRIVE_BASE_URL=https://drive.oussamma.tn

# LiveKit WebRTC
LIVEKIT_URL=wss://messenger.oussamma.tn/livekit
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
```
