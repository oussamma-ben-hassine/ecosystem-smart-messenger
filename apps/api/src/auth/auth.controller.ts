import { Controller, Get, Post, Body, Query, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('Authentification SSO')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login-url')
  @ApiOperation({ summary: 'Obtenir l\'URL de redirection SSO avec PKCE' })
  async getLoginUrl(@Query('redirect_uri') redirectUri?: string) {
    return this.authService.getLoginUrl(redirectUri);
  }

  @Post('callback')
  @ApiOperation({ summary: 'Traiter le retour de code OIDC et créer la session' })
  async callback(@Body() body: { code: string; state: string }) {
    if (!body.code) {
      throw new UnauthorizedException('Missing authorization code');
    }
    return this.authService.handleCallback(body.code, body.state);
  }

  @Post('login')
  @ApiOperation({ summary: 'Connexion rapide ou sélection de profil écosystème' })
  async directLogin(
    @Body()
    body: {
      email?: string;
      username?: string;
      displayName?: string;
      userId?: string;
    }
  ) {
    return this.authService.directLogin(body || {});
  }

  @Post('logout')
  @ApiOperation({ summary: 'Déconnexion de la session Messenger et SSO' })
  async logout(@Headers('authorization') authHeader?: string) {
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    return this.authService.logout(token);
  }

  @Get('me')
  @ApiOperation({ summary: 'Récupérer le profil connecté' })
  async me(@Headers('authorization') authHeader?: string) {
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    return this.authService.validateToken(token);
  }

  @Get('profiles')
  @ApiOperation({ summary: 'Lister les profils disponibles dans l\'écosystème' })
  async listProfiles() {
    return this.authService.getAllProfiles();
  }
}
