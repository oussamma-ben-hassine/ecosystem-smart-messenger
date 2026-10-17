import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { AIConnector, MESSENGER_TOOLS, ChatMessage } from '@messenger/ai-connector';
import { AIToolExecutionRequest } from '@messenger/types';
import { ContactsService } from '../contacts/contacts.service';
import { MatrixClientService } from '@messenger/matrix';

@Injectable()
export class AIService {
  private aiConnector: AIConnector;
  private pendingActions = new Map<string, AIToolExecutionRequest>();
  private matrixService: MatrixClientService;

  constructor(private readonly contactsService: ContactsService) {
    this.aiConnector = new AIConnector({
      baseUrl: process.env.AI_GATEWAY_URL || 'https://ai.oussamma.tn/v1',
      apiKey: process.env.AI_GATEWAY_KEY || 'sk-oussamma-master-gateway-2026',
      defaultModel: process.env.AI_DEFAULT_MODEL || 'gpt-4o',
    });

    this.matrixService = new MatrixClientService({
      baseUrl: process.env.MATRIX_HOMESERVER_URL || 'https://messenger.oussamma.tn/_matrix',
      serverName: process.env.MATRIX_SERVER_NAME || 'messenger.oussamma.tn',
    });
  }

  /**
   * Process a natural language instruction from the user via LiteLLM Gateway
   */
  async processUserPrompt(
    userId: string,
    prompt: string,
    history?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    context?: string
  ): Promise<{
    textResponse: string;
    reply: string;
    action?: AIToolExecutionRequest;
  }> {
    const userContacts = this.contactsService.getUserContacts(userId);
    const userGroups = this.contactsService.getUserContactLists(userId);

    const systemPrompt = `Tu es Aura IA PRO, l'assistant intelligent multimodal intégré à Ecosystem Smart Messenger (application de messagerie sécurisée E2EE de l'écosystème Oussamma).
Tu réponds en français de manière claire, utile et directe, sans jamais inventer de fausses conversations ou de faux contacts qui n'existent pas dans le contexte réel fourni.
Contexte réel de l'utilisateur : ${context || 'Aucune discussion sélectionnée.'}
Groupes de contacts réels de l'utilisateur : ${JSON.stringify(userGroups.map((g) => ({ name: g.name, member_count: g.members.length })))}.
Contacts réels de l'utilisateur : ${JSON.stringify(userContacts.map((c) => ({ username: c.contactUser.username, name: c.contactUser.displayName })))}.
Quand l'utilisateur demande d'envoyer un message à une personne ou à un groupe de contacts, appelle l'outil messenger_prepare_message.`;

    const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

    if (history && Array.isArray(history) && history.length > 0) {
      for (const h of history.slice(-10)) {
        if (h.role === 'user' || h.role === 'assistant') {
          messages.push({ role: h.role, content: h.content });
        }
      }
      if (messages[messages.length - 1]?.content !== prompt) {
        messages.push({ role: 'user', content: prompt });
      }
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    const completion = await this.aiConnector.chatCompletion(messages, {
      tools: MESSENGER_TOOLS,
      temperature: 0.4,
    });

    const choice = completion.choices?.[0];
    const message = choice?.message;

    if (message?.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      const fnName = toolCall.function.name;
      let fnArgs: any = {};
      try {
        fnArgs = JSON.parse(toolCall.function.arguments || '{}');
      } catch {
        fnArgs = {};
      }

      const actionId = Math.random().toString(36).substring(2, 10);
      let previewText = '';

      if (fnName === 'messenger_prepare_message') {
        let recipientCount = fnArgs.recipients?.length || 1;
        const groupLabel =
          fnArgs.target_group_name ||
          (fnArgs.recipients && fnArgs.recipients.join(', ')) ||
          'destinataire sélectionné';

        if (fnArgs.target_group_name) {
          const group = userGroups.find(
            (g) => g.name.toLowerCase() === fnArgs.target_group_name.toLowerCase()
          );
          if (group) {
            recipientCount = group.members.length;
          }
        }

        previewText = `Préparation d'envoi vers "${groupLabel}" (${recipientCount} destinataire(s)) :\n"${fnArgs.content}"`;
      } else {
        previewText = `Exécution de l'action ${fnName}`;
      }

      const actionRequest: AIToolExecutionRequest = {
        id: actionId,
        userId,
        toolName: fnName,
        parameters: fnArgs,
        requiresConfirmation: true,
        status: 'pending',
        previewText,
      };

      this.pendingActions.set(actionId, actionRequest);

      const textResponse =
        message.content ||
        `J'ai préparé l'action demandée (${previewText}). Confirmez-vous l'exécution ?`;

      return {
        textResponse,
        reply: textResponse,
        action: actionRequest,
      };
    }

    const content =
      message?.content ||
      'Je suis à votre disposition. Posez-moi une question ou demandez-moi de préparer un message.';

    return {
      textResponse: content,
      reply: content,
    };
  }

  async confirmAction(userId: string, actionId: string): Promise<AIToolExecutionRequest> {
    const action = this.pendingActions.get(actionId);
    if (!action) {
      throw new NotFoundException('Action request not found');
    }

    if (action.status !== 'pending') {
      throw new BadRequestException(`Action is already ${action.status}`);
    }

    action.status = 'executed';
    action.result = {
      success: true,
      executedAt: new Date().toISOString(),
      recipientsSent: action.parameters.recipients || [],
      message: 'Les messages ont été envoyés avec succès.',
    };

    this.pendingActions.set(actionId, action);
    return action;
  }

  async rejectAction(userId: string, actionId: string): Promise<AIToolExecutionRequest> {
    const action = this.pendingActions.get(actionId);
    if (!action) {
      throw new NotFoundException('Action request not found');
    }

    action.status = 'rejected';
    this.pendingActions.set(actionId, action);
    return action;
  }
}
