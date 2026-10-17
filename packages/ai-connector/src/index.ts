export interface AIConfig {
  baseUrl: string;
  apiKey: string;
  defaultModel?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

/**
 * Standard Messenger tools available to AI Assistant
 */
export const MESSENGER_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'contacts_search',
      description: 'Search user contacts by name or username',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Name or username to search' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'contacts_list_groups',
      description: 'List user contact groups (e.g. "Mes amis", "Famille", "Camping")',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'messenger_prepare_message',
      description: 'Prepare a message to send to a contact or group of contacts for user preview and confirmation',
      parameters: {
        type: 'object',
        properties: {
          recipients: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of recipient usernames or user IDs',
          },
          target_group_name: {
            type: 'string',
            description: 'Optional name of the contact list (e.g. "Mes amis")',
          },
          content: { type: 'string', description: 'Message content' },
        },
        required: ['content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'drive_search_files',
      description: 'Search for files or documents in the user Drive',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search keywords or file name' },
        },
        required: ['query'],
      },
    },
  },
];

export class AIConnector {
  private baseUrl: string;
  private apiKey: string;
  private defaultModel: string;

  constructor(config: AIConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
    this.defaultModel = config.defaultModel || 'gpt-4o';
  }

  /**
   * Run chat completion with optional tool calling
   */
  async chatCompletion(
    messages: ChatMessage[],
    options: {
      model?: string;
      tools?: ToolDefinition[];
      temperature?: number;
      stream?: boolean;
    } = {}
  ): Promise<any> {
    const payload: Record<string, any> = {
      model: options.model || this.defaultModel,
      messages,
      temperature: options.temperature ?? 0.7,
      drop_params: true,
    };

    if (options.tools && options.tools.length > 0) {
      payload.tools = options.tools;
      payload.tool_choice = 'auto';
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI Gateway request failed (${response.status}): ${err}`);
    }

    return response.json();
  }
}
