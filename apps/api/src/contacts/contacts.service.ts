import { Injectable, NotFoundException } from '@nestjs/common';
import { Contact, ContactList, UserProfile } from '@messenger/types';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class ContactsService {
  private contacts = new Map<string, Contact[]>();
  private contactLists = new Map<string, ContactList[]>();

  constructor(private readonly authService: AuthService) {}

  getUserContacts(userId: string): Contact[] {
    return this.contacts.get(userId) || [];
  }

  searchVisibleUsers(query: string, currentUserId: string): UserProfile[] {
    const q = query.toLowerCase().trim();
    const all = this.authService.getAllProfiles();
    return all.filter(
      (p) =>
        p.id !== currentUserId &&
        (p.displayName.toLowerCase().includes(q) || p.username.toLowerCase().includes(q))
    );
  }

  addContact(userId: string, targetUserId: string): Contact {
    const targetProfile = this.authService.getAllProfiles().find((p) => p.id === targetUserId);
    if (!targetProfile) {
      throw new NotFoundException('Target user not found');
    }

    const userContacts = this.getUserContacts(userId);
    const existing = userContacts.find((c) => c.contactUser.id === targetUserId);
    if (existing) {
      return existing;
    }

    const newContact: Contact = {
      id: Math.random().toString(36).substring(2, 10),
      userId,
      contactUser: targetProfile,
      isFavorite: false,
      isBlocked: false,
      createdAt: new Date().toISOString(),
    };

    userContacts.push(newContact);
    this.contacts.set(userId, userContacts);
    return newContact;
  }

  toggleFavorite(userId: string, contactId: string): Contact {
    const list = this.getUserContacts(userId);
    const contact = list.find((c) => c.id === contactId);
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    contact.isFavorite = !contact.isFavorite;
    return contact;
  }

  toggleBlock(userId: string, contactId: string): Contact {
    const list = this.getUserContacts(userId);
    const contact = list.find((c) => c.id === contactId);
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    contact.isBlocked = !contact.isBlocked;
    return contact;
  }

  // Personal Contact Groups for AI commands
  getUserContactLists(userId: string): ContactList[] {
    return this.contactLists.get(userId) || [];
  }

  createContactList(userId: string, name: string, description?: string): ContactList {
    const lists = this.getUserContactLists(userId);
    const newList: ContactList = {
      id: Math.random().toString(36).substring(2, 10),
      userId,
      name,
      description,
      members: [],
      createdAt: new Date().toISOString(),
    };
    lists.push(newList);
    this.contactLists.set(userId, lists);
    return newList;
  }

  addMemberToList(userId: string, listId: string, memberUserId: string): ContactList {
    const lists = this.getUserContactLists(userId);
    const list = lists.find((l) => l.id === listId);
    if (!list) {
      throw new NotFoundException('Contact list not found');
    }
    const memberProfile = this.authService.getAllProfiles().find((p) => p.id === memberUserId);
    if (!memberProfile) {
      throw new NotFoundException('Member profile not found');
    }
    if (!list.members.some((m) => m.id === memberUserId)) {
      list.members.push(memberProfile);
    }
    return list;
  }
}
