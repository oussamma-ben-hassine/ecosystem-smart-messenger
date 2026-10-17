import { Injectable } from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';
import { CallSession } from '@messenger/types';

@Injectable()
export class CallsService {
  private apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
  private apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
  private livekitUrl = process.env.LIVEKIT_URL || 'wss://messenger.oussamma.tn/livekit';

  private activeCalls = new Map<string, CallSession>();

  async createCallToken(
    roomName: string,
    participantIdentity: string,
    participantName: string,
    callType: 'audio' | 'video'
  ): Promise<CallSession> {
    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: participantIdentity,
      name: participantName,
      ttl: '1h',
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    const session: CallSession = {
      roomName,
      callType,
      initiatorId: participantIdentity,
      participants: [participantIdentity],
      token,
      livekitUrl: this.livekitUrl,
      startedAt: new Date().toISOString(),
    };

    this.activeCalls.set(roomName, session);
    return session;
  }

  getActiveCall(roomName: string): CallSession | undefined {
    return this.activeCalls.get(roomName);
  }

  endCall(roomName: string): boolean {
    return this.activeCalls.delete(roomName);
  }
}
