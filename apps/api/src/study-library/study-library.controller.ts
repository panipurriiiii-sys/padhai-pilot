import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
  Optional,
} from '@nestjs/common';
import { StudyLibraryService } from './study-library.service.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/types.js';
import type { ListLibraryQuery, CreateLibraryMaterialDto, UpdateLibraryMaterialDto } from './study-library.service.js';

@Controller('study-library')
export class StudyLibraryController {
  constructor(
    @Inject(StudyLibraryService) private readonly service: StudyLibraryService,
  ) {}

  /** Public list – no auth required. Auth is optional to show institute materials. */
  @Get()
  async list(
    @Query() query: ListLibraryQuery,
    @Optional() @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.service.list(query, user);
  }

  /** Meta for filter dropdowns */
  @Get('meta')
  async getMeta() {
    return this.service.getMeta();
  }

  /** Single item (increments view count) */
  @Get(':id')
  async getById(
    @Param('id') id: string,
    @Optional() @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.service.getById(id, user);
  }

  /** Create – TEACHER or SUPER_ADMIN */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('TEACHER', 'TUITION_OWNER', 'INSTITUTE_ADMIN', 'INSTITUTE_MANAGER', 'FACULTY', 'SUPER_ADMIN')
  async create(
    @Body() dto: CreateLibraryMaterialDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(dto, user);
  }

  /** Update – uploader or SUPER_ADMIN/INSTITUTE_MANAGER */
  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('TEACHER', 'TUITION_OWNER', 'INSTITUTE_ADMIN', 'INSTITUTE_MANAGER', 'FACULTY', 'SUPER_ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLibraryMaterialDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, user);
  }

  /** Delete – uploader or SUPER_ADMIN */
  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('TEACHER', 'TUITION_OWNER', 'INSTITUTE_ADMIN', 'INSTITUTE_MANAGER', 'FACULTY', 'SUPER_ADMIN')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.remove(id, user);
  }

  /** Approve – SUPER_ADMIN only */
  @Put(':id/approve')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.approve(id, user);
  }

  /** Admin list – all platform-level materials (any approval status) */
  @Get('admin/all')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async adminList(
    @Query() query: ListLibraryQuery,
  ) {
    return this.service.adminList(query);
  }
}
