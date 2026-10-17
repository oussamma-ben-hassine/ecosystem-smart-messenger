# Modèle de Sécurité et Chiffrement E2EE — Ecosystem Smart Messenger

## 1. Sécurité SSO et OpenID Connect (PKCE S256)
- L'authentification délègue l'intégralité du contrôle d'accès au SSO centralisé `https://sso-a.oussamma.tn`.
- Le flux d'authentification implémente **Proof Key for Code Exchange (PKCE)** avec algorithme `S256` :
  - Un code verifier aléatoire (64 octets sécurisés) est généré localement.
  - Le code challenge SHA-256 est transmis lors de la requête d'autorisation.
  - L'échange du jeton vérifie la cohérence du verifier.
- Les identifiants sont adossés à la revendication `sub` (UUID immuable).

---

## 2. Chiffrement de Bout en Bout (E2EE)
- **Protocoles :** Conformité aux algorithmes Olm / Megolm (chiffrement de salon et clés de session à cliquet double).
- **Stockage des Clés :** Les clés privées sont conservées exclusivement dans l'IndexedDB du terminal de l'utilisateur.
- **Zéro Clé Côté Serveur :** Le backend NestJS, le serveur Matrix et la base de données ne possèdent aucune clé privée et ne peuvent déchiffrer les messages privés.

---

## 3. Sécurité des Fichiers et Pièces Jointes Drive
- Chaque fichier envoyé dans un salon chiffré est chiffré côté client avec une clé symétrique AES-256 aléatoire et un IV unique.
- Le fichier chiffré est téléversé sur `drive.oussamma.tn`.
- La clé de déchiffrement n'est **jamais** envoyée au Drive : elle est partagée exclusivement via le message Matrix chiffré destiné aux participants autorisés.
- Même en cas de compromission du Drive, aucun fichier chiffré ne peut être lu.

---

## 4. Sécurité des Commandes et Actions IA
- L'IA n'exécute aucune action privilégiée sans contrôle serveur.
- Tout envoi groupé ou action sensible prépare d'abord une requête d'action (`AIToolExecutionRequest`).
- L'utilisateur visualise explicitement les destinataires et le message avant de cliquer sur **Confirmer l'envoi**.
- Le backend vérifie à nouveau les permissions et l'absence de blocage avant toute émission.
