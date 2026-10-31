import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { TeacherService } from './teacher.service.js';
import { BatchesService } from './batches.service.js';
import { EnrollmentCodesService } from './enrollment-codes.service.js';
import { TimetableService } from './timetable.service.js';
import { BroadcastService } from './broadcast.service.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { STAFF_ROLES } from '../common/security/roles.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/types.js';

@Controller('teacher')
@UseGuards(AuthGuard, RolesGuard)
@Roles(...STAFF_ROLES)
export class TeacherController {
  constructor(
    @Inject(TeacherService) private readonly teacherService: TeacherService,
    @Inject(BatchesService) private readonly batches: BatchesService,
    @Inject(EnrollmentCodesService) private readonly codes: EnrollmentCodesService,
    @Inject(TimetableService) private readonly timetable: TimetableService,
    @Inject(BroadcastService) private readonly broadcast: BroadcastService,
  ) {}

  // 1. Dashboard Metrics
  @Get('dashboard')
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.teacherService.getDashboardMetrics(user);
  }

  // 2. Batches & Roster
  @Get('batches')
  getBatches(@CurrentUser() user: AuthenticatedUser, @Query('includeArchived') includeArchived?: string, @Query('limit') limit?: string) {
    return this.batches.list(user, { includeArchived: includeArchived === 'true', limit });
  }

  @Post('batches')
  @HttpCode(HttpStatus.CREATED)
  createBatch(@Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.batches.create(body, user);
  }

  @Get('batches/:batchId/students')
  getBatchRoster(@Param('batchId') batchId: string, @CurrentUser() user: AuthenticatedUser, @Query('limit') limit?: string) {
    return this.batches.roster(batchId, user, { limit });
  }

  @Patch('batches/:batchId')
  updateBatch(@Param('batchId') batchId: string, @Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.batches.update(batchId, body, user);
  }

  @Post('batches/:batchId/archive')
  @HttpCode(HttpStatus.OK)
  archiveBatch(@Param('batchId') batchId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.batches.setArchived(batchId, true, user);
  }

  @Post('batches/:batchId/unarchive')
  @HttpCode(HttpStatus.OK)
  unarchiveBatch(@Param('batchId') batchId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.batches.setArchived(batchId, false, user);
  }

  @Post('batches/:batchId/promote')
  @HttpCode(HttpStatus.OK)
  promoteBatch(
    @Param('batchId') batchId: string,
    @Body() body: { targetBatchId?: string; newBatch?: Record<string, unknown>; studentIds?: string[]; archiveSource?: boolean },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.batches.promote(batchId, body, user);
  }

  @Patch('batches/:batchId/students/:studentId')
  updateRoll(
    @Param('batchId') batchId: string,
    @Param('studentId') studentId: string,
    @Body('rollNumber') rollNumber: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.batches.updateRoll(batchId, studentId, rollNumber, user);
  }

  @Delete('batches/:batchId/students/:studentId')
  removeStudent(@Param('batchId') batchId: string, @Param('studentId') studentId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.batches.removeStudent(batchId, studentId, user);
  }

  // 2b. Weekly timetable (CRUD)
  @Get('batches/:batchId/timetable')
  getBatchTimetable(@Param('batchId') batchId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.timetable.list(user, { batchId });
  }

  @Post('batches/:batchId/timetable')
  @HttpCode(HttpStatus.CREATED)
  createSlot(@Param('batchId') batchId: string, @Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.timetable.create(batchId, body, user);
  }

  @Patch('timetable/:slotId')
  updateSlot(@Param('slotId') slotId: string, @Body() body: Record<string, unknown>, @CurrentUser() user: AuthenticatedUser) {
    return this.timetable.update(slotId, body, user);
  }

  @Delete('timetable/:slotId')
  deleteSlot(@Param('slotId') slotId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.timetable.remove(slotId, user);
  }

  // 3. Enrollment (invitation) codes
  @Get('invitations')
  getInvitations(@CurrentUser() user: AuthenticatedUser, @Query('batchId') batchId?: string, @Query('limit') limit?: string) {
    return this.codes.list(user, { batchId, limit });
  }

  @Post('invitations')
  @HttpCode(HttpStatus.CREATED)
  createInvitation(@Body() body: Record<string, any>, @CurrentUser() user: AuthenticatedUser) {
    return this.codes.create(body, user);
  }

  @Patch('invitations/:id')
  updateInvitation(@Param('id') id: string, @Body() body: Record<string, any>, @CurrentUser() user: AuthenticatedUser) {
    return this.codes.update(id, body, user);
  }

  @Post('invitations/:id/revoke')
  @HttpCode(HttpStatus.OK)
  revokeInvitation(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.codes.revoke(id, user);
  }

  @Post('invitations/:id/reactivate')
  @HttpCode(HttpStatus.OK)
  reactivateInvitation(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.codes.reactivate(id, user);
  }

  @Post('invitations/:id/regenerate')
  @HttpCode(HttpStatus.OK)
  regenerateInvitation(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.codes.regenerate(id, user);
  }

  // 4. Attendance
  @Get('attendance/:batchId/:date')
  getAttendanceSession(
    @Param('batchId') batchId: string,
    @Param('date') date: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teacherService.getAttendanceSession(batchId, date, user);
  }

  @Post('attendance')
  @HttpCode(HttpStatus.OK)
  saveAttendance(
    @Body()
    body: {
      batchId: string;
      date: string;
      records: { studentId: string; status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; note?: string }[];
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teacherService.saveAttendance(body, user);
  }

  @Put('attendance/records/:recordId')
  correctRecord(
    @Param('recordId') recordId: string,
    @Body() body: { status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; reason: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teacherService.correctRecord(recordId, body, user);
  }

  // 5. Assignments
  @Get('assignments')
  getAssignments(@CurrentUser() user: AuthenticatedUser) {
    return this.teacherService.getAssignments(user);
  }

  @Post('assignments')
  @HttpCode(HttpStatus.CREATED)
  createAssignment(
    @Body()
    body: {
      batchId: string;
      title: string;
      instructions: string;
      subject: string;
      dueDate: string;
      maxMarks?: number;
      attachmentUrl?: string;
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teacherService.createAssignment(body, user);
  }

  @Put('assignments/:assignmentId')
  updateAssignment(
    @Param('assignmentId') assignmentId: string,
    @Body() body: { title?: string; instructions?: string; subject?: string; dueDate?: string; maxMarks?: number; attachmentUrl?: string | null },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teacherService.updateAssignment(assignmentId, body, user);
  }

  @Get('assignments/:assignmentId/submissions')
  getSubmissions(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teacherService.getSubmissions(assignmentId, user);
  }

  @Post('assignments/submissions/:submissionId/grade')
  gradeSubmission(
    @Param('submissionId') submissionId: string,
    @Body() body: { marksObtained: number; feedback?: string; resubmit?: boolean },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teacherService.gradeSubmission(submissionId, body, user);
  }

  // 6. Tests & Quizzes
  @Get('tests')
  getTests(@CurrentUser() user: AuthenticatedUser) {
    return this.teacherService.getTests(user);
  }

  @Post('tests')
  @HttpCode(HttpStatus.CREATED)
  createTest(
    @Body()
    body: {
      batchId: string;
      title: string;
      subject: string;
      durationMinutes: number;
      scheduledDate: string;
      questions: any[];
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teacherService.createTest(body, user);
  }

  @Post('tests/:testId/release-results')
  releaseTestResults(
    @Param('testId') testId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teacherService.toggleTestResults(testId, user);
  }

  // 7. Lesson Plans & Syllabus
  @Get('lesson-plans')
  getLessonPlans(@CurrentUser() user: AuthenticatedUser) {
    return this.teacherService.getLessonPlans(user);
  }

  @Post('lesson-plans')
  @HttpCode(HttpStatus.CREATED)
  createLessonPlan(
    @Body()
    body: {
      batchId: string;
      title: string;
      topic: string;
      subject: string;
      weekNumber: number;
      content: string;
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teacherService.createLessonPlan(body, user);
  }

  @Put('lesson-plans/:planId/toggle')
  toggleLessonPlan(
    @Param('planId') planId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teacherService.toggleLessonPlanStatus(planId, user);
  }

  // 8. Timetable (all slots visible to the caller)
  @Get('timetable')
  getTimetable(@CurrentUser() user: AuthenticatedUser, @Query('batchId') batchId?: string) {
    return this.timetable.list(user, { batchId });
  }

  // 9. Academic broadcast (announcements)
  @Get('announcements')
  getAnnouncements(@CurrentUser() user: AuthenticatedUser, @Query('batchId') batchId?: string, @Query('limit') limit?: string) {
    return this.broadcast.list(user, { batchId, limit });
  }

  @Post('announcements')
  @HttpCode(HttpStatus.CREATED)
  createAnnouncement(
    @Body() body: { batchId?: string; title: string; content: string; priority?: 'NORMAL' | 'URGENT' },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.broadcast.create(body, user);
  }

  @Delete('announcements/:id')
  deleteAnnouncement(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.broadcast.remove(id, user);
  }

  // 10. Reports
  @Get('reports')
  getReports(@CurrentUser() user: AuthenticatedUser) {
    return this.teacherService.getReports(user);
  }

  // 11. Academic Queries & Replies
  @Get('queries')
  getQueries(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('batchId') batchId?: string,
  ) {
    return this.teacherService.getQueries(user, { status, batchId });
  }

  @Post('queries/:id/reply')
  replyToQuery(
    @Param('id') queryId: string,
    @Body('body') body: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teacherService.replyToQuery(queryId, body, user);
  }
}
