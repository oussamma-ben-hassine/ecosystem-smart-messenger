import { Controller, Get, Post, Put, Body, Query, Headers, Param, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { AuthService } from '../auth/auth.service';

@ApiTags('Gestion des Contacts')
@Controller('api/contacts')
export class ContactsController {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly authService: AuthService
  ) {}

  private async resolveUserId(authHeader?: string): Promise<string> {
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    if (!token) throw new UnauthorizedException('Connexion SSO requise');
    const user = await this.authService.validateToken(token);
    if (!user || user.id === 'guest-session') throw new UnauthorizedException('Connexion SSO requise');
    return user.id;
  }

  @Get()
  @ApiOperation({ summary: 'Lister les contacts de l\'utilisateur' })
  async getContacts(@Headers('authorization') authHeader?: string) {
    const userId = await this.resolveUserId(authHeader);
    return this.contactsService.getUserContacts(userId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Rechercher des utilisateurs de l\'écosystème' })
  async search(@Query('q') query: string, @Headers('authorization') authHeader?: string) {
    const userId = await this.resolveUserId(authHeader);
    return this.contactsService.searchVisibleUsers(query || '', userId);
  }

  @Post()
  @ApiOperation({ summary: 'Ajouter un contact' })
  async addContact(@Body() body: { targetUserId: string }, @Headers('authorization') authHeader?: string) {
    const userId = await this.resolveUserId(authHeader);
    return this.contactsService.addContact(userId, body.targetUserId);
  }

  @Put(':id/favorite')
  @ApiOperation({ summary: 'Basculer le statut favori d\'un contact' })
  async toggleFavorite(@Param('id') contactId: string, @Headers('authorization') authHeader?: string) {
    const userId = await this.resolveUserId(authHeader);
    return this.contactsService.toggleFavorite(userId, contactId);
  }

  @Put(':id/block')
  @ApiOperation({ summary: 'Bloquer ou débloquer un contact' })
  async toggleBlock(@Param('id') contactId: string, @Headers('authorization') authHeader?: string) {
    const userId = await this.resolveUserId(authHeader);
    return this.contactsService.toggleBlock(userId, contactId);
  }

  @Get('groups')
  @ApiOperation({ summary: 'Lister les listes personnelles de contacts' })
  async getContactLists(@Headers('authorization') authHeader?: string) {
    const userId = await this.resolveUserId(authHeader);
    return this.contactsService.getUserContactLists(userId);
  }

  @Post('groups')
  @ApiOperation({ summary: 'Créer une liste personnelle de contacts (ex: Mes amis)' })
  async createContactList(
    @Body() body: { name: string; description?: string },
    @Headers('authorization') authHeader?: string
  ) {
    const userId = await this.resolveUserId(authHeader);
    return this.contactsService.createContactList(userId, body.name, body.description);
  }

  @Post('groups/:id/members')
  @ApiOperation({ summary: 'Ajouter un membre à une liste personnelle' })
  async addMemberToList(
    @Param('id') listId: string,
    @Body() body: { memberUserId: string },
    @Headers('authorization') authHeader?: string
  ) {
    const userId = await this.resolveUserId(authHeader);
    return this.contactsService.addMemberToList(userId, listId, body.memberUserId);
  }
}
