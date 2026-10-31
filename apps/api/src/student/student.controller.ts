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
} from '@nestjs/common';
import { StudentService } from './student.service.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { STAFF_ROLES, MANAGEMENT_ROLES, STUDENT_ROLES, isManagement } from '../common/security/roles.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/types.js';
import {
  ValidateInvitationDto,
  JoinInstituteDto,
  SubmitAssignmentDto,
  SubmitTestAttemptDto,
  AttendanceCorrectionRequestDto,
  CreateAcademicQueryDto,
  CreateStudyTaskDto,
  UpdateStudyTaskDto,
  CreateSupportRequestDto,
  UpdateStudentProfileDto,
} from './dto/student.dto.js';

@Controller('student')
@UseGuards(AuthGuard, RolesGuard)
@Roles(...STUDENT_ROLES)
export class StudentController {
  constructor(@Inject(StudentService) private readonly studentService: StudentService) {}

  // 1. Dashboard Overview
  @Get('dashboard')
  async getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.studentService.getDashboard(user);
  }

  // 2. Invitation & Batch Enrollment
  @Post('validate-invitation')
  @HttpCode(HttpStatus.OK)
  async validateInvitation(@Body() dto: ValidateInvitationDto) {
    return this.studentService.validateInvitation(dto.code);
  }

  @Post('join-batch')
  @HttpCode(HttpStatus.OK)
  async joinBatch(@CurrentUser() user: AuthenticatedUser, @Body() dto: JoinInstituteDto) {
    return this.studentService.joinInstitute(user, dto.code);
  }

  // 3. Profile & Settings
  @Get('profile')
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.studentService.getStudentProfile(user);
  }

  @Put('profile')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateStudentProfileDto,
  ) {
    return this.studentService.updateStudentProfile(user, dto);
  }

  // 4. Daily Teaching Diary (Student View)
  @Get('diary')
  async getTeachingDiaries(
    @CurrentUser() user: AuthenticatedUser,
    @Query('subject') subject?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    return this.studentService.getTeachingDiaries(user, { subject, search, limit });
  }

  // 5. Timetable & Academic Calendar
  @Get('timetable')
  async getTimetable(@CurrentUser() user: AuthenticatedUser) {
    return this.studentService.getTimetable(user);
  }

  // 6. Attendance & History
  @Get('attendance')
  async getAttendance(@CurrentUser() user: AuthenticatedUser) {
    return this.studentService.getAttendance(user);
  }

  @Post('attendance/correction-request')
  @HttpCode(HttpStatus.CREATED)
  async submitAttendanceCorrection(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AttendanceCorrectionRequestDto,
  ) {
    return this.studentService.submitAttendanceCorrection(user, dto);
  }

  // 7. Homework & Assignments
  @Get('assignments')
  async getAssignments(@CurrentUser() user: AuthenticatedUser) {
    return this.studentService.getAssignments(user);
  }

  @Post('assignments/:id/submit')
  @HttpCode(HttpStatus.OK)
  async submitAssignment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') assignmentId: string,
    @Body() dto: SubmitAssignmentDto,
  ) {
    return this.studentService.submitAssignment(user, assignmentId, dto);
  }

  // 8. Tests, Quizzes & Examinations
  @Get('tests')
  async getTests(@CurrentUser() user: AuthenticatedUser) {
    return this.studentService.getTests(user);
  }

  @Get('tests/:id')
  async getTestDetails(@CurrentUser() user: AuthenticatedUser, @Param('id') testId: string) {
    return this.studentService.getTestDetails(user, testId);
  }

  @Post('tests/:id/attempt')
  @HttpCode(HttpStatus.OK)
  async submitTestAttempt(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') testId: string,
    @Body() dto: SubmitTestAttemptDto,
  ) {
    return this.studentService.submitTestAttempt(user, testId, dto.answers);
  }

  // 9. Results & Bulk Marks
  @Get('results')
  async getResults(@CurrentUser() user: AuthenticatedUser) {
    return this.studentService.getResults(user);
  }

  // 10. Notes & Study Materials Library
  @Get('materials')
  async getMaterials(
    @CurrentUser() user: AuthenticatedUser,
    @Query('batchId') batchId?: string,
    @Query('category') category?: string,
  ) {
    return this.studentService.getMaterials(user, batchId, category);
  }

  // 11. Fees, Receipts & Reminders
  @Get('fees')
  async getFees(@CurrentUser() user: AuthenticatedUser) {
    return this.studentService.getFees(user);
  }

  // 12. Announcements & Faculty Notices
  @Get('announcements')
  async getAnnouncements(@CurrentUser() user: AuthenticatedUser) {
    return this.studentService.getAnnouncements(user);
  }

  // 13. Student-to-Faculty Academic Queries
  @Get('queries')
  async getAcademicQueries(@CurrentUser() user: AuthenticatedUser) {
    return this.studentService.getAcademicQueries(user);
  }

  @Post('queries')
  @HttpCode(HttpStatus.CREATED)
  async submitAcademicQuery(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAcademicQueryDto,
  ) {
    return this.studentService.submitAcademicQuery(user, dto);
  }

  // 14. Study Planner & Personal Productivity
  @Get('study-tasks')
  async getStudyTasks(@CurrentUser() user: AuthenticatedUser) {
    return this.studentService.getStudyTasks(user);
  }

  @Post('study-tasks')
  @HttpCode(HttpStatus.CREATED)
  async createStudyTask(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateStudyTaskDto) {
    return this.studentService.createStudyTask(user, dto);
  }

  @Put('study-tasks/:id')
  async updateStudyTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') taskId: string,
    @Body() dto: UpdateStudyTaskDto,
  ) {
    return this.studentService.updateStudyTask(user, taskId, dto);
  }

  @Delete('study-tasks/:id')
  async deleteStudyTask(@CurrentUser() user: AuthenticatedUser, @Param('id') taskId: string) {
    return this.studentService.deleteStudyTask(user, taskId);
  }

  // 15. Student Documents & PDF Center
  @Get('documents')
  async getDocuments(@CurrentUser() user: AuthenticatedUser) {
    return this.studentService.getDocuments(user);
  }

  // 16. Support Request
  @Post('support-request')
  @HttpCode(HttpStatus.CREATED)
  async submitSupportRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSupportRequestDto,
  ) {
    return this.studentService.submitSupportRequest(user, dto);
  }
}
