import { Controller, Get, Post, Put, Body, Query, Headers, UnauthorizedException } from '@nestjs/common';
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
  @ApiOperation({ summary: 'Connexion ou synchronisation de profil' })
  async directLogin(
    @Body()
    body: {
      email?: string;
      username?: string;
      displayName?: string;
      userId?: string;
      avatarUrl?: string;
    }
  ) {
    return this.authService.directLogin(body || {});
  }

  @Put('profile')
  @ApiOperation({ summary: 'Mettre à jour le profil utilisateur et la photo de profil' })
  async updateProfile(
    @Body()
    body: {
      displayName?: string;
      bio?: string;
      avatarUrl?: string;
      username?: string;
    },
    @Headers('authorization') authHeader?: string
  ) {
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    return this.authService.updateProfile(token, body || {});
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
  @ApiOperation({ summary: 'Lister les profils réels inscrits dans l\'écosystème' })
  async listProfiles() {
    return this.authService.getAllProfiles();
  }
}
