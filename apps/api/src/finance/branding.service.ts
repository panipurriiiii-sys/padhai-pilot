import { BadRequestException, Controller, Get, Inject, Injectable, NotFoundException, Put, Body, UseGuards } from '@nestjs/common';
import { AccessService } from '../common/access/access.service.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { MANAGEMENT_ROLES } from '../common/security/roles.js';
import { LOGO_EXTENSIONS, validateMediaUrl } from '../common/security/media-url.js';
import { optionalString, requireString } from '../common/db/db.js';
import type { AuthenticatedUser } from '../common/types.js';
import type { InstituteLetterhead } from '@padhai-pilot/shared';
import { validateInstituteBranding } from '@padhai-pilot/shared';

const SELECT = {
  name: true,
  logoUrl: true,
  address: true,
  contactPhone: true,
  contactEmail: true,
  website: true,
  footerText: true,
  signatoryName: true,
  signatoryTitle: true,
  primaryColor: true,
} as const;

const clean = (v: string | null | undefined): string | undefined => v || undefined;

export function toLetterhead(i: Record<string, string | null>): InstituteLetterhead {
  return {
    name: i.name as string,
    logoUrl: clean(i.logoUrl),
    address: clean(i.address),
    contactPhone: clean(i.contactPhone),
    contactEmail: clean(i.contactEmail),
    website: clean(i.website),
    footerText: clean(i.footerText),
    signatoryName: clean(i.signatoryName),
    signatoryTitle: clean(i.signatoryTitle),
    primaryColor: clean(i.primaryColor),
  };
}

@Injectable()
export class LetterheadService {
  constructor(@Inject(AccessService) private readonly access: AccessService) {}

  /** Institute id always comes from the JWT; students and faculty get the same read-only letterhead. */
  async get(instituteId: string): Promise<InstituteLetterhead> {
    const db = this.access.db();
    const i = await db.institute.findUnique({ where: { id: instituteId }, select: SELECT });
    if (!i) throw new NotFoundException('Institute not found.');
    return toLetterhead(i as Record<string, string | null>);
  }

  async update(user: AuthenticatedUser, body: any): Promise<InstituteLetterhead> {
    const db = this.access.db();
    await this.access.assertActiveMembership(user);
    const data: Record<string, string | null> = {};
    const text = (k: string, max: number) => {
      if (body?.[k] === undefined) return;
      data[k] = body[k] === null || body[k] === '' ? null : (optionalString(body[k], k, max) ?? null);
    };
    if (body?.name !== undefined) data.name = requireString(body.name, 'name', 120);
    text('address', 300);
    text('contactPhone', 40);
    text('footerText', 300);
    text('signatoryName', 80);
    text('signatoryTitle', 80);
    if (body?.contactEmail !== undefined) {
      const e = body.contactEmail === null ? '' : String(body.contactEmail).trim();
      if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new BadRequestException('contactEmail is not a valid email.');
      data.contactEmail = e || null;
    }
    if (body?.website !== undefined) {
      const w = body.website === null ? '' : String(body.website).trim();
      if (w && !/^https?:\/\/[^\s]+$/i.test(w)) throw new BadRequestException('website must start with http:// or https://.');
      data.website = w || null;
    }
    if (body?.logoUrl !== undefined) {
      data.logoUrl = body.logoUrl === null || body.logoUrl === '' ? null : (validateMediaUrl(body.logoUrl, 'logoUrl', LOGO_EXTENSIONS) ?? null);
    }
    if (body?.primaryColor) {
      const check = validateInstituteBranding({ accentColor: body.primaryColor });
      if (!check.ok) throw new BadRequestException({ message: 'Invalid brand colour.', errors: check.errors });
      data.primaryColor = check.branding?.accentColor ?? body.primaryColor;
    }
    const updated = await db.institute.update({ where: { id: user.instituteId }, data, select: SELECT });
    return toLetterhead(updated as Record<string, string | null>);
  }
}

@Controller('branding')
@UseGuards(AuthGuard, RolesGuard)
export class BrandingController {
  constructor(@Inject(LetterheadService) private readonly svc: LetterheadService) {}

  @Get()
  get(@CurrentUser() u: AuthenticatedUser) {
    return this.svc.get(u.instituteId);
  }

  @Put()
  @Roles(...MANAGEMENT_ROLES)
  update(@CurrentUser() u: AuthenticatedUser, @Body() body: unknown) {
    return this.svc.update(u, body);
  }
}
