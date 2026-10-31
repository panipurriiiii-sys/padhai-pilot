import { describe, it, expect, beforeEach } from 'vitest';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DEFAULT_THEME_CONFIG, BUILT_IN_REVISION_ID } from '@padhai-pilot/shared';
import { ThemeService } from './theme.service.js';
import { BrandingService } from './branding.service.js';
import { ThemeAdminController, ThemeController, BrandingController } from './theme.controller.js';
import { RolesGuard } from '../common/guards/roles.guard.js';

const guard = new RolesGuard(new Reflector());
const allows = (controller: { prototype: object }, method: string, role: string): boolean => {
  const handler = (controller.prototype as Record<string, unknown>)[method] as () => unknown;
  const ctx = {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => ({ user: { id: 'u1', role } }) }),
  } as unknown as ExecutionContext;
  try {
    return guard.canActivate(ctx);
  } catch {
    return false;
  }
};
const methodsOf = (c: { prototype: object }) => Object.getOwnPropertyNames(c.prototype).filter((m) => m !== 'constructor');

const actor = { id: 'sa1', email: 'super@example.com' };
const user = (role: string, instituteId = 'inst_a') => ({ id: 'u1', email: 'u@x.com', fullName: 'U', role, instituteId, instituteName: 'A' }) as never;

describe('theme API', () => {
  let theme: ThemeService;
  beforeEach(() => {
    theme = new ThemeService({ isConnected: false } as never);
  });

  it('serves the built-in default when no storage is available (fail safe, never throws)', async () => {
    const broken = new ThemeService({
      isConnected: true,
      platformThemeRevision: { findFirst: async () => { throw new Error('relation does not exist'); } },
    } as never);
    expect((await broken.getPublished()).revisionId).toBe(BUILT_IN_REVISION_ID);
    expect((await theme.getPublished()).config).toEqual(DEFAULT_THEME_CONFIG);
  });

  it('publish validates, audits actor, bumps revision, and is idempotent for identical configs', async () => {
    const cfg = { ...DEFAULT_THEME_CONFIG, brand: { primary: '#0A5BD6' } };
    const a = await theme.publish(cfg, actor, 'brand refresh');
    expect(a.theme.revision).toBe(1);
    expect(a.changes.join(' ')).toMatch(/brand\.primary/);
    expect((await theme.getPublished()).config.brand.primary).toBe('#0A5BD6');
    expect(theme.peekRevisionId()).toBe(a.theme.revisionId);
    expect((await theme.publish(cfg, actor)).unchanged).toBe(true);
    const hist = await theme.history();
    expect(hist[0]).toMatchObject({ actorEmail: 'super@example.com', reason: 'brand refresh', isActive: true });
    const b = await theme.restore(1, actor, 'again');
    expect(b.unchanged).toBe(true);
  });

  it('rejects invalid, non-approved-font and low-contrast configs without storing anything', async () => {
    await expect(theme.publish({ ...DEFAULT_THEME_CONFIG, brand: { primary: 'red' } }, actor)).rejects.toBeInstanceOf(BadRequestException);
    await expect(theme.publish({ ...DEFAULT_THEME_CONFIG, typography: { ...DEFAULT_THEME_CONFIG.typography, data: 'Geist' } }, actor)).rejects.toBeInstanceOf(BadRequestException);
    await expect(theme.publish({ ...DEFAULT_THEME_CONFIG, brand: { primary: '#FFEE99' } }, actor)).rejects.toBeInstanceOf(BadRequestException);
    expect((await theme.getPublished()).revisionId).toBe(BUILT_IN_REVISION_ID);
    const v = theme.validate({ ...DEFAULT_THEME_CONFIG, brand: { primary: '#0A5BD6' } });
    expect(v.ok).toBe(true);
    expect(v.previewCss).toContain('--brand-electric: #0A5BD6');
  });

  it('write endpoints are SUPER_ADMIN only; the public read has no guards', () => {
    for (const m of methodsOf(ThemeAdminController)) {
      for (const role of ['TUITION_OWNER', 'INSTITUTE_ADMIN', 'FACULTY', 'TEACHER', 'STUDENT']) {
        expect(allows(ThemeAdminController, m, role), `${role} -> ${m}`).toBe(false);
      }
      expect(allows(ThemeAdminController, m, 'SUPER_ADMIN'), m).toBe(true);
    }
    expect(Reflect.getMetadata('__guards__', ThemeController)).toBeUndefined();
    expect(methodsOf(ThemeController)).toEqual(['getTheme']);
  });

  it('institute branding writes need a management role; reads are for any member', () => {
    expect(allows(BrandingController, 'update', 'TUITION_OWNER')).toBe(true);
    for (const role of ['FACULTY', 'TEACHER', 'STUDENT']) expect(allows(BrandingController, 'update', role)).toBe(false);
    expect(allows(BrandingController, 'getMine', 'STUDENT')).toBe(true);
  });

  describe('institute branding service', () => {
    const features = (available: boolean) => ({ evaluateFeature: async () => ({ isAvailable: available }) }) as never;
    const prisma = (store: { logoUrl: string | null; primaryColor: string | null }, member = true) =>
      ({
        isConnected: true,
        instituteMembership: { findFirst: async () => (member ? { id: 'm1' } : null) },
        institute: {
          findUnique: async () => store,
          update: async ({ data }: { data: { logoUrl: string | null; primaryColor: string } }) => Object.assign(store, data),
        },
        auditLog: { create: async () => ({}) },
      }) as never;

    it('refuses writes when the plan is not entitled and when the contrast is too low', async () => {
      const store = { logoUrl: null, primaryColor: '#1677FF' };
      const denied = new BrandingService(prisma(store), features(false), theme);
      await expect(denied.updateMine(user('TUITION_OWNER'), { accentColor: '#0B6E4F' })).rejects.toBeInstanceOf(ForbiddenException);
      const ok = new BrandingService(prisma(store), features(true), theme);
      await expect(ok.updateMine(user('TUITION_OWNER'), { accentColor: '#FFFF00' })).rejects.toBeInstanceOf(BadRequestException);
      const saved = await ok.updateMine(user('TUITION_OWNER'), { accentColor: '#0B6E4F', logoUrl: 'https://cdn.example.com/l.png' });
      expect(saved.branding?.accentColor).toBe('#0B6E4F');
      expect(store.primaryColor).toBe('#0B6E4F');
    });

    it('applies no branding when not entitled, and never trusts a non-member', async () => {
      const store = { logoUrl: null, primaryColor: '#0B6E4F' };
      const svc = new BrandingService(prisma(store), features(false), theme);
      expect((await svc.getMine(user('STUDENT'))).branding).toBeNull();
      const stranger = new BrandingService(prisma(store, false), features(true), theme);
      await expect(stranger.getMine(user('STUDENT'))).rejects.toBeInstanceOf(ForbiddenException);
      expect((await svc.getMine(user('SUPER_ADMIN'))).instituteId).toBeNull();
    });
  });
});
