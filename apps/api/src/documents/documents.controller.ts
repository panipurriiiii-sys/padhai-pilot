import { Controller, Get, Inject, Param, Query, Res, StreamableFile, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { STAFF_ROLES } from '../common/security/roles.js';
import type { AuthenticatedUser } from '../common/types.js';
import { DocumentsService, type PdfResult } from './documents.service.js';

const ALL_MEMBERS = [...STAFF_ROLES, 'STUDENT'] as const;

function send(res: Response, pdf: PdfResult): StreamableFile {
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename="${pdf.fileName}"`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  return new StreamableFile(Buffer.from(pdf.bytes));
}

/** Server-rendered PDFs (identical on web and mobile). Fetch with the bearer token and open the blob. */
@Controller('documents')
@UseGuards(AuthGuard, RolesGuard)
export class DocumentsController {
  constructor(@Inject(DocumentsService) private readonly docs: DocumentsService) {}

  @Get('fee-receipt/:paymentId')
  @Roles(...ALL_MEMBERS)
  async feeReceipt(@CurrentUser() u: AuthenticatedUser, @Param('paymentId') id: string, @Res({ passthrough: true }) res: Response) {
    return send(res, await this.docs.feeReceipt(u, id));
  }

  @Get('report-card/:studentId')
  @Roles(...ALL_MEMBERS)
  async reportCard(
    @CurrentUser() u: AuthenticatedUser,
    @Param('studentId') studentId: string,
    @Query('batchId') batchId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return send(res, await this.docs.reportCard(u, studentId, batchId));
  }

  @Get('salary-slip/:recordId')
  @Roles(...STAFF_ROLES)
  async salarySlip(@CurrentUser() u: AuthenticatedUser, @Param('recordId') id: string, @Res({ passthrough: true }) res: Response) {
    return send(res, await this.docs.salarySlip(u, id));
  }

  @Get('attendance-report')
  @Roles(...ALL_MEMBERS)
  async attendance(
    @CurrentUser() u: AuthenticatedUser,
    @Query('batchId') batchId: string | undefined,
    @Query('studentId') studentId: string | undefined,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    return send(res, await this.docs.attendance(u, { batchId, studentId, from, to }));
  }

  @Get('result-sheet/:assessmentId')
  @Roles(...STAFF_ROLES)
  async resultSheet(@CurrentUser() u: AuthenticatedUser, @Param('assessmentId') id: string, @Res({ passthrough: true }) res: Response) {
    return send(res, await this.docs.resultSheet(u, id));
  }
}
