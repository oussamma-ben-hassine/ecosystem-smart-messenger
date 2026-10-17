import { Module } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { ContactsService } from './contacts/contacts.service';
import { ContactsController } from './contacts/contacts.controller';
import { CallsService } from './calls/calls.service';
import { CallsController } from './calls/calls.controller';
import { AIService } from './ai/ai.service';
import { AIController } from './ai/ai.controller';
import { AdminService } from './admin/admin.service';
import { AdminController } from './admin/admin.controller';

@Module({
  imports: [],
  controllers: [
    AuthController,
    ContactsController,
    CallsController,
    AIController,
    AdminController,
  ],
  providers: [
    AuthService,
    ContactsService,
    CallsService,
    AIService,
    AdminService,
  ],
})
export class AppModule {}
