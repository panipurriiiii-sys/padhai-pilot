import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { TeacherService } from './teacher.service.js';
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
  constructor(@Inject(TeacherService) private readonly teacherService: TeacherService) {}

  // 1. Dashboard Metrics
  @Get('dashboard')
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.teacherService.getDashboardMetrics(user);
  }

  // 2. Batches & Roster
  @Get('batches')
  getBatches(@CurrentUser() user: AuthenticatedUser) {
    return this.teacherService.getBatches(user);
  }

  @Get('batches/:batchId/students')
  getBatchRoster(
    @Param('batchId') batchId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teacherService.getBatchRoster(batchId, user);
  }

  @Post('batches')
  @HttpCode(HttpStatus.CREATED)
  createBatch(
    @Body() body: { name: string; code?: string; subject: string; gradeLevel?: string; room?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teacherService.createBatch(body, user);
  }

  // 3. Student Invitations
  @Get('invitations')
  getInvitations(@CurrentUser() user: AuthenticatedUser) {
    return this.teacherService.getInvitations(user);
  }

  @Post('invitations')
  @HttpCode(HttpStatus.CREATED)
  createInvitation(
    @Body() body: { batchId?: string; maxUses?: number; expiryDays?: number },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teacherService.createInvitation(body, user);
  }

  @Post('invitations/:code/revoke')
  revokeInvitation(
    @Param('code') code: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teacherService.revokeInvitation(code, user);
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
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teacherService.createAssignment(body, user);
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

  // 8. Timetable
  @Get('timetable')
  getTimetable(@CurrentUser() user: AuthenticatedUser) {
    return this.teacherService.getTimetable(user);
  }

  // 9. Announcements
  @Get('announcements')
  getAnnouncements(@CurrentUser() user: AuthenticatedUser) {
    return this.teacherService.getAnnouncements(user);
  }

  @Post('announcements')
  @HttpCode(HttpStatus.CREATED)
  createAnnouncement(
    @Body() body: { batchId?: string; title: string; content: string; priority?: 'NORMAL' | 'URGENT' },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.teacherService.createAnnouncement(body, user);
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
