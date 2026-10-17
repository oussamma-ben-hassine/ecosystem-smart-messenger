import { UserProfile } from '@messenger/types';

export interface OAuthConfig {
  issuer: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scope: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

export interface OIDCUserInfo {
  sub: string;
  name?: string;
  email?: string;
  preferred_username?: string;
  picture?: string;
  roles?: string[];
}

/**
 * Generate a cryptographically secure random string for PKCE code verifier
 */
export function generateCodeVerifier(length = 64): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let text = '';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      text += possible[values[i] % possible.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
  }
  return text;
}

/**
 * Compute SHA-256 base64url-encoded code challenge for PKCE
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  throw new Error('Web Cryptography API is required for PKCE code challenge generation');
}

/**
 * SSO OIDC Authentication Client
 */
export class SSOClient {
  private config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  /**
   * Build the authorization URL with PKCE parameters
   */
  async buildAuthorizationUrl(state: string, verifier: string): Promise<string> {
    const challenge = await generateCodeChallenge(verifier);
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope || 'openid profile email',
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    return `${this.config.issuer}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  async exchangeCodeForToken(code: string, verifier: string): Promise<TokenResponse> {
    const bodyParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      code_verifier: verifier,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (this.config.clientSecret) {
      headers['Authorization'] = `Basic ${btoa(`${this.config.clientId}:${this.config.clientSecret}`)}`;
    }

    const response = await fetch(`${this.config.issuer}/oauth/token`, {
      method: 'POST',
      headers,
      body: bodyParams.toString(),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Token exchange failed (${response.status}): ${errText}`);
    }

    return response.json();
  }

  /**
   * Fetch authenticated user info from SSO
   */
  async getUserInfo(accessToken: string): Promise<OIDCUserInfo> {
    const response = await fetch(`${this.config.issuer}/oauth/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch userinfo (${response.status})`);
    }

    return response.json();
  }
}
