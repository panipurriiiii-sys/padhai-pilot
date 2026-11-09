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
  Req,
  Header,
} from '@nestjs/common';
import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { StudyLibraryService } from './study-library.service.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/types.js';
import { getJwtSecret } from '../common/security/runtime.js';
import type { ListLibraryQuery, CreateLibraryMaterialDto, UpdateLibraryMaterialDto } from './study-library.service.js';

/** Silently extract user from Bearer/cookie without throwing when absent. */
function tryGetUser(req: Request): AuthenticatedUser | undefined {
  try {
    const header = req.headers?.authorization;
    const cookie = (req as any).cookies?.token;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : cookie;
    if (!token) return undefined;
    return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as AuthenticatedUser;
  } catch {
    return undefined;
  }
}

@Controller('study-library')
export class StudyLibraryController {
  constructor(private readonly service: StudyLibraryService) {}

  /** Public list – no auth required. Auth is optional to show institute materials. */
  @Get()
  @Header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  async list(@Query() query: ListLibraryQuery, @Req() req: Request) {
    return this.service.list(query, tryGetUser(req));
  }

  /** Meta for filter dropdowns — no auth required */
  @Get('meta')
  @Header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  async getMeta() {
    return this.service.getMeta();
  }

  /** Admin list — SUPER_ADMIN only (must come before :id wildcard) */
  @Get('admin/all')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async adminList(@Query() query: ListLibraryQuery) {
    return this.service.adminList(query);
  }

  /** Single item (increments view count) */
  @Get(':id')
  async getById(@Param('id') id: string, @Req() req: Request) {
    return this.service.getById(id, tryGetUser(req));
  }

  /** Create – TEACHER or SUPER_ADMIN */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('TEACHER', 'TUITION_OWNER', 'INSTITUTE_ADMIN', 'INSTITUTE_MANAGER', 'FACULTY', 'SUPER_ADMIN')
  async create(@Body() dto: CreateLibraryMaterialDto, @CurrentUser() user: AuthenticatedUser) {
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
  async remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user);
  }

  /** Approve – SUPER_ADMIN only */
  @Put(':id/approve')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async approve(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.approve(id, user);
  }
}
