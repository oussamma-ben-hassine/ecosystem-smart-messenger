import { Controller, Get, Post, Put, Body, Query, Headers, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('Authentification & Présence SSO')
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

  @Post('heartbeat')
  @ApiOperation({ summary: 'Signal de présence en ligne (Heartbeat)' })
  async heartbeat(
    @Body() body: { id?: string; displayName?: string; username?: string; avatarUrl?: string },
    @Headers('authorization') authHeader?: string
  ) {
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    if (!token) return { ok: false, error: 'Unauthorized' };
    const currentUser = await this.authService.validateToken(token);
    if (!currentUser || currentUser.id === 'guest-session') {
      return { ok: false, error: 'Unauthorized' };
    }
    return this.authService.recordHeartbeat(token, body);
  }

  @Get('online')
  @ApiOperation({ summary: 'Lister les utilisateurs connectés en temps réel' })
  async getOnlineUsers(@Headers('authorization') authHeader?: string) {
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    if (!token) return [];
    const currentUser = await this.authService.validateToken(token);
    if (!currentUser || currentUser.id === 'guest-session') return [];
    return this.authService.getConnectedUsers(currentUser.id);
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
    if (!token) throw new UnauthorizedException('Non authentifié');
    const currentUser = await this.authService.validateToken(token);
    if (!currentUser || currentUser.id === 'guest-session') throw new UnauthorizedException('Non authentifié');
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
    if (!token) {
      throw new UnauthorizedException('Non connecté');
    }
    const profile = await this.authService.validateToken(token);
    if (!profile || profile.id === 'guest-session') {
      throw new UnauthorizedException('Session expirée ou invalide');
    }
    return profile;
  }

  @Get('profiles')
  @ApiOperation({ summary: 'Lister les profils réels inscrits dans l\'écosystème' })
  async listProfiles() {
    return this.authService.getAllProfiles();
  }
}
