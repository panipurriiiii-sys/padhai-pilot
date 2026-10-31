import { Module } from '@nestjs/common';
import { FacultyInvitationsController } from './faculty-invitations.controller.js';
import { FacultyInvitationsService } from './faculty-invitations.service.js';

@Module({
  controllers: [FacultyInvitationsController],
  providers: [FacultyInvitationsService],
  exports: [FacultyInvitationsService],
})
export class FacultyInvitationsModule {}
