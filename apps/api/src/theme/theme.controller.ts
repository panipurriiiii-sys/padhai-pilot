import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ThemeService } from './theme.service.js';
import { BrandingService } from './branding.service.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { MANAGEMENT_ROLES } from '../common/security/roles.js';
import type { AuthenticatedUser } from '../common/types.js';
import { PublishThemeDto, RestoreThemeDto, UpdateBrandingDto, ValidateThemeDto } from './dto/theme.dto.js';

/** Edge/CDN friendly: browsers revalidate after 60s, shared caches keep it 5 min, stale copy served while refreshing. */
export const THEME_CACHE_CONTROL = 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400';

const parseIfNoneMatch = (header?: string): string[] =>
  (header ?? '')
    .split(',')
    .map((v) => v.trim().replace(/^W\//, '').replace(/^"|"$/g, ''))
    .filter(Boolean);

// ---------------------------------------------------------------------------------------------------------------------
// PUBLIC READ — unauthenticated by design (portals need it before login). GET only, no secrets, cacheable.
// ---------------------------------------------------------------------------------------------------------------------
@Controller('theme')
export class ThemeController {
  constructor(@Inject(ThemeService) private readonly theme: ThemeService) {}

  @Get()
  async getTheme(@Headers('if-none-match') ifNoneMatch: string | undefined, @Res({ passthrough: true }) res: Response) {
    const published = await this.theme.getPublished();
    res.setHeader('Cache-Control', THEME_CACHE_CONTROL);
    res.setHeader('ETag', `"${published.revisionId}"`);
    res.setHeader('X-Theme-Revision', published.revisionId);
    res.setHeader('Vary', 'Accept-Encoding, Origin');
    if (parseIfNoneMatch(ifNoneMatch).includes(published.revisionId)) {
      res.status(HttpStatus.NOT_MODIFIED);
      return;
    }
    return published;
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// SUPER_ADMIN — validate / publish / history / restore
// ---------------------------------------------------------------------------------------------------------------------
@Controller('admin/theme')
@UseGuards(AuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class ThemeAdminController {
  constructor(@Inject(ThemeService) private readonly theme: ThemeService) {}

  @Get()
  async overview() {
    const [published, history] = await Promise.all([this.theme.getPublished(), this.theme.history(20)]);
    return { success: true, data: { published, history } };
  }

  @Get('history')
  async history(@Query('limit') limit?: string) {
    return { success: true, data: await this.theme.history(limit ? parseInt(limit, 10) : 25) };
  }

  /** Dry run: validation errors/warnings, contrast report and the preview CSS. Stores nothing. */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validate(@Body() dto: ValidateThemeDto) {
    return { success: true, data: this.theme.validate(dto?.config) };
  }

  @Post('publish')
  @HttpCode(HttpStatus.CREATED)
  async publish(@CurrentUser() user: AuthenticatedUser, @Body() dto: PublishThemeDto) {
    const result = await this.theme.publish(dto?.config, { id: user.id, email: user.email }, dto?.reason);
    return {
      success: true,
      data: result,
      message: result.unchanged ? 'Theme is identical to the published revision; nothing changed.' : `Theme revision ${result.theme.revision} published.`,
    };
  }

  @Post('restore/:revision')
  @HttpCode(HttpStatus.CREATED)
  async restore(
    @CurrentUser() user: AuthenticatedUser,
    @Param('revision', ParseIntPipe) revision: number,
    @Body() dto: RestoreThemeDto,
  ) {
    const result = await this.theme.restore(revision, { id: user.id, email: user.email }, dto?.reason);
    return { success: true, data: result, message: `Revision ${revision} restored as revision ${result.theme.revision}.` };
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// INSTITUTE BRANDING — the institute is derived from the authenticated user, never from request input
// ---------------------------------------------------------------------------------------------------------------------
@Controller('branding')
@UseGuards(AuthGuard, RolesGuard)
export class BrandingController {
  constructor(@Inject(BrandingService) private readonly branding: BrandingService) {}

  /** Any signed-in member: the branding to apply for their institute. */
  @Get('me')
  async getMine(@CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: await this.branding.getMine(user) };
  }

  @Roles(...MANAGEMENT_ROLES)
  @Post('me/validate')
  @HttpCode(HttpStatus.OK)
  async validate(@Body() dto: UpdateBrandingDto) {
    return { success: true, data: this.branding.validate(dto) };
  }

  @Roles(...MANAGEMENT_ROLES)
  @Put('me')
  async update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateBrandingDto) {
    return { success: true, data: await this.branding.updateMine(user, dto), message: 'Branding updated.' };
  }
}
