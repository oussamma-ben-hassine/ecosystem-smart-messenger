export interface MatrixConfig {
  baseUrl: string;
  serverName: string;
}

export interface MatrixMessageEvent {
  eventId: string;
  roomId: string;
  sender: string;
  content: {
    body: string;
    msgtype: string;
    info?: any;
    url?: string;
  };
  originServerTs: number;
}

export class MatrixClientService {
  private baseUrl: string;
  private serverName: string;

  constructor(config: MatrixConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.serverName = config.serverName;
  }

  /**
   * Format a local username into a standard Matrix User ID (@user:server)
   */
  toMatrixUserId(username: string): string {
    const clean = username.replace(/^@/, '');
    return `@${clean}:${this.serverName}`;
  }

  /**
   * Send a text message to a Matrix room
   */
  async sendMessage(roomId: string, accessToken: string, text: string): Promise<string> {
    const txnId = `m_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const response = await fetch(
      `${this.baseUrl}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/send/m.room.message/${txnId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          msgtype: 'm.text',
          body: text,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to send Matrix message (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.event_id;
  }

  /**
   * Create a direct or group room
   */
  async createRoom(
    accessToken: string,
    options: {
      name?: string;
      isDirect?: boolean;
      inviteUserIds?: string[];
      isEncrypted?: boolean;
    }
  ): Promise<string> {
    const payload: Record<string, any> = {
      preset: options.isDirect ? 'trusted_private_chat' : 'private_chat',
      is_direct: options.isDirect || false,
      invite: options.inviteUserIds || [],
    };

    if (options.name) {
      payload.name = options.name;
    }

    if (options.isEncrypted) {
      payload.initial_state = [
        {
          type: 'm.room.encryption',
          state_key: '',
          content: {
            algorithm: 'm.megolm.v1.aes-sha2',
          },
        },
      ];
    }

    const response = await fetch(`${this.baseUrl}/_matrix/client/v3/createRoom`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to create Matrix room (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.room_id;
  }
}
