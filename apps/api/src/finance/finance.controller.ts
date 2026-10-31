import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { STAFF_ROLES, STUDENT_ROLES } from '../common/security/roles.js';
import type { AuthenticatedUser } from '../common/types.js';
import { FinanceService } from './finance.service.js';
import { StudentLeavesService } from './leaves.service.js';

/** Staff (batch teachers + owners): fee structures, payments, receipts, reminders, student leave review. */
@Controller('finance')
@UseGuards(AuthGuard, RolesGuard)
@Roles(...STAFF_ROLES)
export class FinanceController {
  constructor(
    @Inject(FinanceService) private readonly finance: FinanceService,
    @Inject(StudentLeavesService) private readonly leaves: StudentLeavesService,
  ) {}

  @Post('batches/:batchId/structures')
  @HttpCode(HttpStatus.CREATED)
  createStructure(@CurrentUser() u: AuthenticatedUser, @Param('batchId') batchId: string, @Body() body: unknown) {
    return this.finance.createStructure(u, batchId, body);
  }

  @Get('batches/:batchId/structures')
  listStructures(@CurrentUser() u: AuthenticatedUser, @Param('batchId') batchId: string) {
    return this.finance.listStructures(u, batchId);
  }

  @Post('structures/:id/void')
  @HttpCode(HttpStatus.OK)
  voidStructure(@CurrentUser() u: AuthenticatedUser, @Param('id') id: string, @Body() body: { reason?: string }) {
    return this.finance.voidStructure(u, id, body?.reason);
  }

  @Get('batches/:batchId/fees')
  ledger(@CurrentUser() u: AuthenticatedUser, @Param('batchId') batchId: string, @Query('studentId') studentId?: string) {
    return this.finance.batchLedger(u, batchId, studentId);
  }

  @Get('batches/:batchId/summary')
  summary(@CurrentUser() u: AuthenticatedUser, @Param('batchId') batchId: string) {
    return this.finance.batchSummary(u, batchId);
  }

  @Post('fees/:feeRecordId/payments')
  @HttpCode(HttpStatus.CREATED)
  recordPayment(@CurrentUser() u: AuthenticatedUser, @Param('feeRecordId') id: string, @Body() body: unknown) {
    return this.finance.recordPayment(u, id, body);
  }

  @Post('payments/:paymentId/void')
  @HttpCode(HttpStatus.OK)
  voidPayment(@CurrentUser() u: AuthenticatedUser, @Param('paymentId') id: string, @Body() body: { reason?: string }) {
    return this.finance.voidPayment(u, id, body?.reason);
  }

  @Post('reminders/send')
  @HttpCode(HttpStatus.OK)
  sendReminders(@CurrentUser() u: AuthenticatedUser, @Body() body: unknown) {
    return this.finance.sendReminders(u, body);
  }

  @Get('leaves')
  listLeaves(@CurrentUser() u: AuthenticatedUser, @Query('status') status?: string, @Query('batchId') batchId?: string) {
    return this.leaves.list(u, { status, batchId });
  }

  @Put('leaves/:id/review')
  reviewLeave(@CurrentUser() u: AuthenticatedUser, @Param('id') id: string, @Body() body: unknown) {
    return this.leaves.review(u, id, body);
  }
}

/** Student side: own fees/balance/receipts and own leave applications. */
@Controller('student')
@UseGuards(AuthGuard, RolesGuard)
@Roles(...STUDENT_ROLES)
export class StudentFinanceController {
  constructor(
    @Inject(FinanceService) private readonly finance: FinanceService,
    @Inject(StudentLeavesService) private readonly leaves: StudentLeavesService,
  ) {}

  @Get('finance/fees')
  fees(@CurrentUser() u: AuthenticatedUser) {
    return this.finance.studentLedger(u);
  }

  @Get('leaves')
  myLeaves(@CurrentUser() u: AuthenticatedUser) {
    return this.leaves.mine(u);
  }

  @Post('leaves')
  @HttpCode(HttpStatus.CREATED)
  applyLeave(@CurrentUser() u: AuthenticatedUser, @Body() body: unknown) {
    return this.leaves.apply(u, body);
  }

  @Post('leaves/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelLeave(@CurrentUser() u: AuthenticatedUser, @Param('id') id: string) {
    return this.leaves.cancel(u, id);
  }
}
