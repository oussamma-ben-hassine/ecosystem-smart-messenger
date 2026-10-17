import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SSOClient, generateCodeVerifier } from '@messenger/auth';
import { UserProfile } from '@messenger/types';

@Injectable()
export class AuthService {
  private ssoClient: SSOClient;
  // In-memory or database cache for active sessions and profiles
  private profiles = new Map<string, UserProfile>();
  private activeVerifiers = new Map<string, string>();

  constructor() {
    this.ssoClient = new SSOClient({
      issuer: process.env.SSO_ISSUER_URL || 'https://sso-a.oussamma.tn',
      clientId: process.env.SSO_CLIENT_ID || 'client_messenger_app',
      clientSecret: process.env.SSO_CLIENT_SECRET,
      redirectUri: process.env.SSO_REDIRECT_URI || 'https://messenger.oussamma.tn/auth/callback',
      scope: 'openid profile email',
    });
  }

  async getLoginUrl(): Promise<{ url: string; state: string }> {
    const state = Math.random().toString(36).substring(2, 15);
    const verifier = generateCodeVerifier();
    this.activeVerifiers.set(state, verifier);

    const url = await this.ssoClient.buildAuthorizationUrl(state, verifier);
    return { url, state };
  }

  async handleCallback(code: string, state: string): Promise<{ profile: UserProfile; accessToken: string }> {
    const verifier = this.activeVerifiers.get(state) || '';
    this.activeVerifiers.delete(state);

    const tokenResponse = await this.ssoClient.exchangeCodeForToken(code, verifier);
    const userInfo = await this.ssoClient.getUserInfo(tokenResponse.access_token);

    if (!userInfo || !userInfo.sub) {
      throw new UnauthorizedException('Invalid user information received from SSO');
    }

    // Auto-provision or update user profile
    let profile = this.profiles.get(userInfo.sub);
    const now = new Date().toISOString();

    if (!profile) {
      profile = {
        id: userInfo.sub,
        ssoSub: userInfo.sub,
        matrixUserId: `@${userInfo.preferred_username || userInfo.sub}:messenger.oussamma.tn`,
        displayName: userInfo.name || userInfo.preferred_username || 'Utilisateur Écosystème',
        username: userInfo.preferred_username || `user_${userInfo.sub.substring(0, 8)}`,
        avatarUrl: userInfo.picture,
        isOnline: true,
        createdAt: now,
        updatedAt: now,
      };
      this.profiles.set(userInfo.sub, profile);
    } else {
      profile.displayName = userInfo.name || profile.displayName;
      profile.avatarUrl = userInfo.picture || profile.avatarUrl;
      profile.isOnline = true;
      profile.updatedAt = now;
    }

    return {
      profile,
      accessToken: tokenResponse.access_token,
    };
  }

  async validateToken(token: string): Promise<UserProfile> {
    try {
      const userInfo = await this.ssoClient.getUserInfo(token);
      let profile = this.profiles.get(userInfo.sub);
      if (!profile) {
        profile = {
          id: userInfo.sub,
          ssoSub: userInfo.sub,
          matrixUserId: `@${userInfo.preferred_username || userInfo.sub}:messenger.oussamma.tn`,
          displayName: userInfo.name || 'Utilisateur Écosystème',
          username: userInfo.preferred_username || `user_${userInfo.sub.substring(0, 8)}`,
          avatarUrl: userInfo.picture,
          isOnline: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.profiles.set(userInfo.sub, profile);
      }
      return profile;
    } catch (e) {
      throw new UnauthorizedException('SSO token validation failed');
    }
  }

  getAllProfiles(): UserProfile[] {
    return Array.from(this.profiles.values());
  }
}
