import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { FacultyInvitationsService } from './faculty-invitations.service.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { MANAGEMENT_ROLES } from '../common/security/roles.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/types.js';
import {
  CreateFacultyInvitationDto,
  AcceptFacultyInvitationDto,
} from './dto/faculty-invitation.dto.js';

@Controller('faculty-invitations')
export class FacultyInvitationsController {
  constructor(
    @Inject(FacultyInvitationsService)
    private readonly invitationsService: FacultyInvitationsService,
  ) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(...MANAGEMENT_ROLES)
  @HttpCode(HttpStatus.CREATED)
  createInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFacultyInvitationDto,
  ) {
    return this.invitationsService.createInvitation(user.instituteId, user.id, dto);
  }

  @Get(':token')
  previewInvitation(@Param('token') token: string) {
    return this.invitationsService.previewInvitation(token);
  }

  @Post('accept')
  @HttpCode(HttpStatus.OK)
  acceptInvitation(@Body() dto: AcceptFacultyInvitationDto) {
    return this.invitationsService.acceptInvitation(dto);
  }
}
