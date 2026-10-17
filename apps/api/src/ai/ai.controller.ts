import { Controller, Post, Body, Headers, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AIService } from './ai.service';
import { AuthService } from '../auth/auth.service';

@ApiTags('Assistant IA & Orchestration')
@Controller('api/ai')
export class AIController {
  constructor(
    private readonly aiService: AIService,
    private readonly authService: AuthService
  ) {}

  private async resolveUserId(authHeader?: string): Promise<string> {
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    const user = await this.authService.validateToken(token);
    return user.id;
  }

  @Post('chat')
  @ApiOperation({ summary: 'Envoyer une commande en langage naturel à l\'assistant Aura IA' })
  async chat(
    @Body()
    body: {
      prompt?: string;
      message?: string;
      messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
      context?: string;
    },
    @Headers('authorization') authHeader?: string
  ) {
    const userId = await this.resolveUserId(authHeader);
    const promptText =
      body.prompt ||
      body.message ||
      (body.messages && body.messages.length > 0
        ? body.messages[body.messages.length - 1].content
        : 'Bonjour');
    return this.aiService.processUserPrompt(userId, promptText, body.messages, body.context);
  }

  @Post('actions/:id/confirm')
  @ApiOperation({ summary: 'Confirmer et exécuter une action préparée par l\'IA' })
  async confirmAction(@Param('id') actionId: string, @Headers('authorization') authHeader?: string) {
    const userId = await this.resolveUserId(authHeader);
    return this.aiService.confirmAction(userId, actionId);
  }

  @Post('actions/:id/reject')
  @ApiOperation({ summary: 'Rejeter une action préparée par l\'IA' })
  async rejectAction(@Param('id') actionId: string, @Headers('authorization') authHeader?: string) {
    const userId = await this.resolveUserId(authHeader);
    return this.aiService.rejectAction(userId, actionId);
  }
}
