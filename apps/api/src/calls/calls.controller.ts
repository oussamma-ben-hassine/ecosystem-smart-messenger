import { Controller, Post, Body, Headers, UnauthorizedException, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CallsService } from './calls.service';
import { AuthService } from '../auth/auth.service';

@ApiTags('Appels Audio / Vidéo')
@Controller('api/calls')
export class CallsController {
  constructor(
    private readonly callsService: CallsService,
    private readonly authService: AuthService
  ) {}

  @Post('token')
  @ApiOperation({ summary: 'Obtenir un jeton LiveKit pour rejoindre un appel vocal ou vidéo' })
  async getCallToken(
    @Body() body: { roomName: string; callType: 'audio' | 'video' },
    @Headers('authorization') authHeader: string
  ) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing token');
    }
    const token = authHeader.split(' ')[1];
    const user = await this.authService.validateToken(token);

    return this.callsService.createCallToken(
      body.roomName,
      user.id,
      user.displayName,
      body.callType || 'audio'
    );
  }

  @Post(':roomName/end')
  @ApiOperation({ summary: 'Terminer un appel' })
  async endCall(@Param('roomName') roomName: string) {
    return { success: this.callsService.endCall(roomName) };
  }
}
