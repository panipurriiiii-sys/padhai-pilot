import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  Logger,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import type { AuthenticatedUser } from '../common/types.js';

export interface ListLibraryQuery {
  board?: string;
  classLevel?: string;
  subject?: string;
  contentType?: string;
  q?: string;
  page?: string;
  limit?: string;
}

export interface CreateLibraryMaterialDto {
  title: string;
  description?: string;
  board: string;
  classLevel?: string;
  subject?: string;
  contentType: string;
  fileUrl?: string;
  externalUrl?: string;
  yearOrEdition?: string;
  tags?: string[];
  instituteId?: string; // SUPER_ADMIN only - set to null for platform-level
}

export interface UpdateLibraryMaterialDto {
  title?: string;
  description?: string;
  board?: string;
  classLevel?: string;
  subject?: string;
  contentType?: string;
  fileUrl?: string;
  externalUrl?: string;
  yearOrEdition?: string;
  tags?: string[];
}

@Injectable()
export class StudyLibraryService {
  private readonly logger = new Logger(StudyLibraryService.name);
  private hasEnsuredTable = false;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Optional() @Inject(RedisService) private readonly redis?: RedisService,
  ) {}

  /** Ensures LibraryMaterial table and indexes exist in PostgreSQL (idempotent DDL). */
  async ensureTableExists(): Promise<void> {
    if (this.hasEnsuredTable || !this.prisma.isConnected) return;
    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "LibraryMaterial" (
            "id" TEXT NOT NULL,
            "instituteId" TEXT,
            "uploadedBy" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "description" TEXT,
            "board" TEXT NOT NULL,
            "classLevel" TEXT,
            "subject" TEXT,
            "contentType" TEXT NOT NULL,
            "fileUrl" TEXT,
            "externalUrl" TEXT,
            "yearOrEdition" TEXT,
            "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
            "isApproved" BOOLEAN NOT NULL DEFAULT false,
            "viewCount" INTEGER NOT NULL DEFAULT 0,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "LibraryMaterial_pkey" PRIMARY KEY ("id")
        );
        CREATE INDEX IF NOT EXISTS "LibraryMaterial_board_classLevel_subject_idx" ON "LibraryMaterial"("board","classLevel","subject");
        CREATE INDEX IF NOT EXISTS "LibraryMaterial_instituteId_idx" ON "LibraryMaterial"("instituteId");
        CREATE INDEX IF NOT EXISTS "LibraryMaterial_contentType_idx" ON "LibraryMaterial"("contentType");
      `);
      this.hasEnsuredTable = true;
      this.logger.log('LibraryMaterial table verified and ready.');
    } catch (err) {
      this.logger.warn(`Could not verify LibraryMaterial table: ${(err as Error).message}`);
    }
  }

  private async invalidateCache() {
    try {
      await this.redis?.del('study:admin:all:1:50');
      await this.redis?.del('study:admin:all:1:20');
      await this.redis?.del('study:admin:all:1:100');
    } catch {
      // Ignore cache invalidation failures
    }
  }

  async list(query: ListLibraryQuery, user?: AuthenticatedUser) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit ?? '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // Build visibility filter:
    // - Platform-level approved items are visible to all
    // - Institute items are visible only to that institute's users
    if (user?.instituteId) {
      where['OR'] = [
        { instituteId: null, isApproved: true },
        { instituteId: user.instituteId },
      ];
    } else {
      // No auth: only approved platform-level
      where['instituteId'] = null;
      where['isApproved'] = true;
    }

    if (query.board) where['board'] = query.board;
    if (query.classLevel) where['classLevel'] = query.classLevel;
    if (query.subject) where['subject'] = query.subject;
    if (query.contentType) where['contentType'] = query.contentType;

    if (query.q) {
      const search = query.q;
      const textOr = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];

      // Merge with existing OR if present
      if (where['OR']) {
        const visibilityOr = where['OR'] as unknown[];
        where['AND'] = [
          { OR: visibilityOr },
          { OR: textOr },
        ];
        delete where['OR'];
      } else {
        where['OR'] = textOr;
      }
    }

    try {
      const [items, total] = await Promise.all([
        this.prisma.libraryMaterial.findMany({
          where: where as any,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            title: true,
            description: true,
            board: true,
            classLevel: true,
            subject: true,
            contentType: true,
            fileUrl: true,
            externalUrl: true,
            yearOrEdition: true,
            tags: true,
            isApproved: true,
            viewCount: true,
            instituteId: true,
            createdAt: true,
            uploader: { select: { id: true, fullName: true } },
          },
        }),
        this.prisma.libraryMaterial.count({
          where: where as any,
        }),
      ]);
      return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    } catch {
      // Migration not yet applied — return empty list instead of 500
      return { items: [], total: 0, page, limit, totalPages: 0 };
    }
  }

  async getById(id: string, user?: AuthenticatedUser) {
    const item = await this.prisma.libraryMaterial.findUnique({
      where: { id },
      include: {
        uploader: { select: { id: true, fullName: true } },
      },
    });

    if (!item) throw new NotFoundException('Library material not found.');

    // Visibility check
    const isPlatformLevel = item.instituteId === null;
    const isFromUserInstitute = user?.instituteId && item.instituteId === user.instituteId;

    if (!isPlatformLevel && !isFromUserInstitute) {
      throw new ForbiddenException('Access denied.');
    }
    if (isPlatformLevel && !item.isApproved && user?.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Access denied.');
    }

    // Fire-and-forget: increment view count without blocking the response
    this.prisma.libraryMaterial.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => { /* non-critical counter — ignore errors */ });

    return item;
  }

  async create(dto: CreateLibraryMaterialDto, user: AuthenticatedUser) {
    const isSuperAdmin = user.role === 'SUPER_ADMIN';

    // Determine instituteId and approval status
    let instituteId: string | null;
    let isApproved: boolean;

    if (isSuperAdmin && !dto.instituteId) {
      // Platform-level: auto-approved for super admin
      instituteId = null;
      isApproved = true;
    } else if (isSuperAdmin && dto.instituteId) {
      instituteId = dto.instituteId;
      isApproved = true;
    } else {
      // TEACHER / other staff: institute-scoped, auto-approved
      instituteId = user.instituteId ?? null;
      isApproved = true;
    }

    const material = await this.prisma.libraryMaterial.create({
      data: {
        title: dto.title,
        description: dto.description,
        board: dto.board,
        classLevel: dto.classLevel,
        subject: dto.subject,
        contentType: dto.contentType,
        fileUrl: dto.fileUrl,
        externalUrl: dto.externalUrl,
        yearOrEdition: dto.yearOrEdition,
        tags: dto.tags ?? [],
        instituteId,
        uploadedBy: user.id,
        isApproved,
      },
    });

    void this.invalidateCache();
    return material;
  }

  async update(id: string, dto: UpdateLibraryMaterialDto, user: AuthenticatedUser) {
    const item = await this.prisma.libraryMaterial.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Library material not found.');

    const canEdit =
      item.uploadedBy === user.id ||
      user.role === 'SUPER_ADMIN' ||
      user.role === 'INSTITUTE_MANAGER';

    if (!canEdit) throw new ForbiddenException('Not authorized to edit this material.');

    const updated = await this.prisma.libraryMaterial.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.board !== undefined && { board: dto.board }),
        ...(dto.classLevel !== undefined && { classLevel: dto.classLevel }),
        ...(dto.subject !== undefined && { subject: dto.subject }),
        ...(dto.contentType !== undefined && { contentType: dto.contentType }),
        ...(dto.fileUrl !== undefined && { fileUrl: dto.fileUrl }),
        ...(dto.externalUrl !== undefined && { externalUrl: dto.externalUrl }),
        ...(dto.yearOrEdition !== undefined && { yearOrEdition: dto.yearOrEdition }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
      },
    });
    void this.invalidateCache();
    return updated;
  }

  async remove(id: string, user: AuthenticatedUser) {
    const item = await this.prisma.libraryMaterial.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Library material not found.');

    const canDelete = item.uploadedBy === user.id || user.role === 'SUPER_ADMIN';
    if (!canDelete) throw new ForbiddenException('Not authorized to delete this material.');

    await this.prisma.libraryMaterial.delete({ where: { id } });
    void this.invalidateCache();
    return { success: true };
  }

  async approve(id: string, user: AuthenticatedUser) {
    if (user.role !== 'SUPER_ADMIN') throw new ForbiddenException('SUPER_ADMIN only.');

    const item = await this.prisma.libraryMaterial.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Library material not found.');

    const approved = await this.prisma.libraryMaterial.update({
      where: { id },
      data: { isApproved: true },
    });
    void this.invalidateCache();
    return approved;
  }

  async getMeta() {
    try {
    const [boards, subjects, contentTypes, classLevels] = await Promise.all([
      this.prisma.libraryMaterial.findMany({
        where: { isApproved: true },
        select: { board: true },
        distinct: ['board'],
      }),
      this.prisma.libraryMaterial.findMany({
        where: { isApproved: true, subject: { not: null } },
        select: { subject: true },
        distinct: ['subject'],
      }),
      this.prisma.libraryMaterial.findMany({
        select: { contentType: true },
        distinct: ['contentType'],
      }),
      this.prisma.libraryMaterial.findMany({
        where: { classLevel: { not: null } },
        select: { classLevel: true },
        distinct: ['classLevel'],
      }),
    ]);

    return {
      boards: boards.map((r) => r.board).sort(),
      subjects: subjects.map((r) => r.subject).filter(Boolean).sort(),
      contentTypes: contentTypes.map((r) => r.contentType).sort(),
      classLevels: classLevels.map((r) => r.classLevel).filter(Boolean).sort(),
    };
    } catch {
      return { boards: [], subjects: [], contentTypes: [], classLevels: [] };
    }
  }

  // Admin: list all materials (any approval status) with Redis caching and self-healing
  async adminList(query: ListLibraryQuery) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
    const skip = (page - 1) * limit;
    const cacheKey = `study:admin:all:${page}:${limit}`;

    // Fast-path: Redis cache returns sub-10ms
    if (this.redis) {
      try {
        const cached = await this.redis.get<{ items: any[]; total: number; page: number; limit: number; totalPages: number }>(cacheKey);
        if (cached && Array.isArray(cached.items)) {
          return cached;
        }
      } catch {
        // Fall through to database
      }
    }

    const where: Record<string, unknown> = { instituteId: null }; // platform-level only for admin review

    try {
      const [items, total] = await Promise.all([
        this.prisma.libraryMaterial.findMany({
          where: where as any,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: { uploader: { select: { id: true, fullName: true, email: true } } },
        }),
        this.prisma.libraryMaterial.count({
          where: where as any,
        }),
      ]);

      const result = { items, total, page, limit, totalPages: Math.ceil(total / limit) };
      this.redis?.set(cacheKey, result, 60).catch(() => {});
      return result;
    } catch (err) {
      this.logger.warn(`Admin library lookup failed, attempting self-heal: ${(err as Error).message}`);
      await this.ensureTableExists();
      return { items: [], total: 0, page, limit, totalPages: 0 };
    }
  }
}
