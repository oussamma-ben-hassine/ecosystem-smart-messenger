import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SSOClient, generateCodeVerifier } from '@messenger/auth';
import { UserProfile } from '@messenger/types';

@Injectable()
export class AuthService {
  private ssoClient: SSOClient;
  private profiles = new Map<string, UserProfile>();
  private activeVerifiers = new Map<string, string>();
  private activeSessions = new Map<string, string>();

  constructor() {
    this.ssoClient = new SSOClient({
      issuer: process.env.SSO_ISSUER_URL || 'https://sso-a.oussamma.tn',
      clientId: process.env.SSO_CLIENT_ID || 'client_messenger_app',
      clientSecret: process.env.SSO_CLIENT_SECRET || 'sec_messenger_platform_secret_2026',
      redirectUri: process.env.SSO_REDIRECT_URI || 'https://messenger.oussamma.tn/auth/callback',
      scope: 'openid profile email',
    });
  }

  private normalizeSSOAvatar(rawUrl?: string): string | undefined {
    if (!rawUrl) return undefined;
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')) {
      return rawUrl;
    }
    const ssoIssuer = (process.env.SSO_ISSUER_URL || 'https://sso-a.oussamma.tn').replace(/\/$/, '');
    return `${ssoIssuer}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
  }

  async getLoginUrl(redirectUri?: string): Promise<{ url: string; state: string }> {
    const state = Math.random().toString(36).substring(2, 15);
    const verifier = generateCodeVerifier();
    this.activeVerifiers.set(state, verifier);

    if (redirectUri) {
      const customClient = new SSOClient({
        issuer: process.env.SSO_ISSUER_URL || 'https://sso-a.oussamma.tn',
        clientId: process.env.SSO_CLIENT_ID || 'client_messenger_app',
        clientSecret: process.env.SSO_CLIENT_SECRET || 'sec_messenger_platform_secret_2026',
        redirectUri,
        scope: 'openid profile email',
      });
      const url = await customClient.buildAuthorizationUrl(state, verifier);
      return { url, state };
    }

    const url = await this.ssoClient.buildAuthorizationUrl(state, verifier);
    return { url, state };
  }

  async handleCallback(code: string, state: string): Promise<{ profile: UserProfile; accessToken: string }> {
    const verifier = this.activeVerifiers.get(state) || '';
    this.activeVerifiers.delete(state);

    const tokenResponse = await this.ssoClient.exchangeCodeForToken(code, verifier);
    const userInfo: any = await this.ssoClient.getUserInfo(tokenResponse.access_token);

    if (!userInfo || !userInfo.sub) {
      throw new UnauthorizedException('Invalid user information received from SSO');
    }

    let profile = this.profiles.get(userInfo.sub);
    const now = new Date().toISOString();
    const ssoAvatar = this.normalizeSSOAvatar(userInfo.picture || userInfo.avatar_url);

    if (!profile) {
      profile = {
        id: userInfo.sub,
        ssoSub: userInfo.sub,
        matrixUserId: `@${userInfo.preferred_username || userInfo.sub.substring(0, 8)}:messenger.oussamma.tn`,
        displayName: userInfo.name || userInfo.preferred_username || 'Utilisateur SSO',
        username: userInfo.preferred_username || `user_${userInfo.sub.substring(0, 8)}`,
        avatarUrl: ssoAvatar,
        bio: 'Membre Écosystème',
        isOnline: true,
        createdAt: now,
        updatedAt: now,
      };
      this.profiles.set(userInfo.sub, profile);
    } else {
      profile.displayName = userInfo.name || profile.displayName;
      // Use SSO avatar unless the user already customized it in Messenger
      if (ssoAvatar && !profile.avatarUrl?.startsWith('data:')) {
        profile.avatarUrl = ssoAvatar;
      }
      profile.isOnline = true;
      profile.updatedAt = now;
    }

    this.activeSessions.set(tokenResponse.access_token, profile.id);

    return {
      profile,
      accessToken: tokenResponse.access_token,
    };
  }

  async directLogin(payload: {
    email?: string;
    username?: string;
    displayName?: string;
    userId?: string;
    avatarUrl?: string;
  }): Promise<{ profile: UserProfile; accessToken: string }> {
    const now = new Date().toISOString();
    let profile: UserProfile | undefined;

    if (payload.userId && this.profiles.has(payload.userId)) {
      profile = this.profiles.get(payload.userId);
    } else if (payload.username) {
      profile = Array.from(this.profiles.values()).find(
        (p) => p.username.toLowerCase() === payload.username?.toLowerCase()
      );
    } else if (payload.email) {
      const localPart = payload.email.split('@')[0].toLowerCase();
      profile = Array.from(this.profiles.values()).find(
        (p) => p.username.toLowerCase() === localPart
      );
    }

    if (!profile) {
      const username =
        payload.username ||
        (payload.email ? payload.email.split('@')[0] : 'utilisateur');
      const id = payload.userId || `usr-${username}`;
      profile = {
        id,
        ssoSub: id,
        matrixUserId: `@${username}:messenger.oussamma.tn`,
        displayName: payload.displayName || username,
        username,
        avatarUrl: payload.avatarUrl,
        bio: 'En ligne',
        isOnline: true,
        createdAt: now,
        updatedAt: now,
      };
      this.profiles.set(id, profile);
    } else {
      if (payload.displayName) profile.displayName = payload.displayName;
      if (payload.avatarUrl) profile.avatarUrl = payload.avatarUrl;
      profile.isOnline = true;
      profile.updatedAt = now;
    }

    const token = `aura_sess_${profile.id}_${Math.random().toString(36).substring(2, 12)}`;
    this.activeSessions.set(token, profile.id);

    return {
      profile,
      accessToken: token,
    };
  }

  async updateProfile(
    token: string | undefined,
    updates: { displayName?: string; bio?: string; avatarUrl?: string; username?: string }
  ): Promise<UserProfile> {
    const profile = await this.validateToken(token);
    if (updates.displayName !== undefined) profile.displayName = updates.displayName;
    if (updates.bio !== undefined) profile.bio = updates.bio;
    if (updates.avatarUrl !== undefined) profile.avatarUrl = updates.avatarUrl;
    if (updates.username !== undefined) profile.username = updates.username;
    profile.updatedAt = new Date().toISOString();
    this.profiles.set(profile.id, profile);
    return profile;
  }

  async logout(token?: string): Promise<{ success: boolean; ssoLogoutUrl: string }> {
    if (token) {
      const userId = this.activeSessions.get(token);
      if (userId) {
        const profile = this.profiles.get(userId);
        if (profile) profile.isOnline = false;
        this.activeSessions.delete(token);
      }
    }
    const ssoIssuer = process.env.SSO_ISSUER_URL || 'https://sso-a.oussamma.tn';
    return {
      success: true,
      ssoLogoutUrl: `${ssoIssuer}/oauth/logout`,
    };
  }

  async validateToken(token?: string): Promise<UserProfile> {
    if (token && this.activeSessions.has(token)) {
      const userId = this.activeSessions.get(token)!;
      const profile = this.profiles.get(userId);
      if (profile) return profile;
    }

    if (token) {
      try {
        const userInfo: any = await this.ssoClient.getUserInfo(token);
        const ssoAvatar = this.normalizeSSOAvatar(userInfo.picture || userInfo.avatar_url);
        let profile = this.profiles.get(userInfo.sub);
        if (!profile) {
          profile = {
            id: userInfo.sub,
            ssoSub: userInfo.sub,
            matrixUserId: `@${userInfo.preferred_username || userInfo.sub}:messenger.oussamma.tn`,
            displayName: userInfo.name || userInfo.preferred_username || 'Utilisateur SSO',
            username: userInfo.preferred_username || `user_${userInfo.sub.substring(0, 8)}`,
            avatarUrl: ssoAvatar,
            bio: 'En ligne',
            isOnline: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          this.profiles.set(userInfo.sub, profile);
        } else if (ssoAvatar && !profile.avatarUrl?.startsWith('data:')) {
          profile.avatarUrl = ssoAvatar;
        }
        this.activeSessions.set(token, profile.id);
        return profile;
      } catch {}
    }

    // If no SSO token yet, return the first registered profile or a clean empty profile
    const first = Array.from(this.profiles.values())[0];
    if (first) return first;

    return {
      id: 'guest-session',
      ssoSub: 'guest-session',
      matrixUserId: '@invite:messenger.oussamma.tn',
      displayName: 'Non connecté',
      username: 'invite',
      avatarUrl: undefined,
      bio: 'Connectez-vous avec votre compte SSO',
      isOnline: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  getAllProfiles(): UserProfile[] {
    return Array.from(this.profiles.values());
  }
}
