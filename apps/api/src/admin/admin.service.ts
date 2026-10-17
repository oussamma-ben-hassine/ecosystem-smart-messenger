import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  async getSystemHealth() {
    const checks: Record<string, { status: string; url?: string; error?: string }> = {};

    // Check SSO
    try {
      const ssoRes = await fetch(`${process.env.SSO_ISSUER_URL || 'https://sso-a.oussamma.tn'}/.well-known/openid-configuration`, {
        signal: AbortSignal.timeout(3000),
      });
      checks.sso = {
        status: ssoRes.ok ? 'healthy' : 'unhealthy',
        url: process.env.SSO_ISSUER_URL || 'https://sso-a.oussamma.tn',
      };
    } catch (e: any) {
      checks.sso = { status: 'unreachable', error: e.message };
    }

    // Check LiteLLM
    try {
      const aiRes = await fetch(`${process.env.AI_GATEWAY_URL || 'https://ai.oussamma.tn/v1'}/models`, {
        headers: { Authorization: `Bearer ${process.env.AI_GATEWAY_KEY || 'sk-oussamma-master-gateway-2026'}` },
        signal: AbortSignal.timeout(3000),
      });
      checks.litellm = {
        status: aiRes.ok ? 'healthy' : 'unhealthy',
        url: process.env.AI_GATEWAY_URL || 'https://ai.oussamma.tn/v1',
      };
    } catch (e: any) {
      checks.litellm = { status: 'unreachable', error: e.message };
    }

    // Drive status
    checks.drive = {
      status: 'configured',
      url: process.env.DRIVE_BASE_URL || 'https://drive.oussamma.tn',
    };

    // LiveKit status
    checks.livekit = {
      status: 'configured',
      url: process.env.LIVEKIT_URL || 'wss://messenger.oussamma.tn/livekit',
    };

    return {
      status: 'operational',
      timestamp: new Date().toISOString(),
      integrations: checks,
      metrics: {
        activeUsers: 1,
        activeRooms: 3,
        totalCallsToday: 0,
        storageQuotaUsedMB: 12.4,
      },
    };
  }
}
