import { Controller, Post, Body, Headers, UnauthorizedException, Param } from '@nestjs/common';
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

  private async getUserId(authHeader: string): Promise<string> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing token');
    }
    const token = authHeader.split(' ')[1];
    const user = await this.authService.validateToken(token);
    return user.id;
  }

  @Post('chat')
  @ApiOperation({ summary: 'Envoyer une commande en langage naturel à l\'assistant' })
  async chat(@Body() body: { prompt: string }, @Headers('authorization') authHeader: string) {
    const userId = await this.getUserId(authHeader);
    return this.aiService.processUserPrompt(userId, body.prompt);
  }

  @Post('actions/:id/confirm')
  @ApiOperation({ summary: 'Confirmer et exécuter une action préparée par l\'IA' })
  async confirmAction(@Param('id') actionId: string, @Headers('authorization') authHeader: string) {
    const userId = await this.getUserId(authHeader);
    return this.aiService.confirmAction(userId, actionId);
  }

  @Post('actions/:id/reject')
  @ApiOperation({ summary: 'Rejeter une action préparée par l\'IA' })
  async rejectAction(@Param('id') actionId: string, @Headers('authorization') authHeader: string) {
    const userId = await this.getUserId(authHeader);
    return this.aiService.rejectAction(userId, actionId);
  }
}
