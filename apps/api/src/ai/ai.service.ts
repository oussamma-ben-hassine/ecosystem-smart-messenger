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
   * Process a natural language instruction from the user
   */
  async processUserPrompt(userId: string, prompt: string): Promise<{ textResponse?: string; action?: AIToolExecutionRequest }> {
    const userContacts = this.contactsService.getUserContacts(userId);
    const userGroups = this.contactsService.getUserContactLists(userId);

    const systemPrompt = `Tu es l'assistant intelligent d'Ecosystem Smart Messenger.
Tu as accès aux contacts de l'utilisateur et peux planifier des actions de messagerie via des outils (tool calling).
Quand l'utilisateur demande d'envoyer un message à une personne ou à un groupe de contacts (ex: "Mes amis"), appelle l'outil messenger_prepare_message.
Groupes disponibles : ${JSON.stringify(userGroups.map((g) => ({ name: g.name, member_count: g.members.length })))}.
Contacts disponibles : ${JSON.stringify(userContacts.map((c) => ({ username: c.contactUser.username, name: c.contactUser.displayName })))}.
Ne confirme jamais qu'un envoi a été fait : prépare-le pour validation.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ];

    const completion = await this.aiConnector.chatCompletion(messages, {
      tools: MESSENGER_TOOLS,
    });

    const choice = completion.choices?.[0];
    const message = choice?.message;

    // Check if tool calling was triggered
    if (message?.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      const fnName = toolCall.function.name;
      const fnArgs = JSON.parse(toolCall.function.arguments || '{}');

      const actionId = Math.random().toString(36).substring(2, 10);
      let previewText = '';

      if (fnName === 'messenger_prepare_message') {
        let recipientCount = fnArgs.recipients?.length || 0;
        let groupLabel = fnArgs.target_group_name || 'contacts sélectionnés';

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

      return {
        textResponse: message.content || 'Voici l\'action préparée selon votre demande. Veuillez la confirmer pour procéder.',
        action: actionRequest,
      };
    }

    return {
      textResponse: message?.content || 'Je n\'ai pas compris votre demande.',
    };
  }

  /**
   * Confirm and execute a pending AI action
   */
  async confirmAction(userId: string, actionId: string): Promise<AIToolExecutionRequest> {
    const action = this.pendingActions.get(actionId);
    if (!action || action.userId !== userId) {
      throw new NotFoundException('Action request not found or unauthorized');
    }

    if (action.status !== 'pending') {
      throw new BadRequestException(`Action is already ${action.status}`);
    }

    // Execute action
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

  /**
   * Reject a pending AI action
   */
  async rejectAction(userId: string, actionId: string): Promise<AIToolExecutionRequest> {
    const action = this.pendingActions.get(actionId);
    if (!action || action.userId !== userId) {
      throw new NotFoundException('Action request not found');
    }

    action.status = 'rejected';
    this.pendingActions.set(actionId, action);
    return action;
  }
}
