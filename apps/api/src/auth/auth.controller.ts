import { Controller, Get, Post, Body, Query, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('Authentification SSO')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login-url')
  @ApiOperation({ summary: 'Obtenir l\'URL de redirection SSO avec PKCE' })
  async getLoginUrl() {
    return this.authService.getLoginUrl();
  }

  @Post('callback')
  @ApiOperation({ summary: 'Traiter le retour de code OIDC et créer la session' })
  async callback(@Body() body: { code: string; state: string }) {
    if (!body.code) {
      throw new UnauthorizedException('Missing authorization code');
    }
    return this.authService.handleCallback(body.code, body.state);
  }

  @Get('me')
  @ApiOperation({ summary: 'Récupérer le profil connecté' })
  async me(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = authHeader.split(' ')[1];
    return this.authService.validateToken(token);
  }
}
