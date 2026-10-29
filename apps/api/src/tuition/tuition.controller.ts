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
import { TuitionService } from './tuition.service.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/types.js';
import {
  UpdateTuitionProfileDto,
  CreateFacultyDto,
  UpdateFacultyDto,
  GenerateSalaryRecordDto,
  RecordPaymentDto,
  ApplyFacultyLeaveDto,
  ReviewFacultyLeaveDto,
  CreateTeachingDiaryDto,
  UpdateTeachingDiaryDto,
  CreateStudyMaterialDto,
  CreateStudentFeeRecordDto,
  DispatchFeeReminderDto,
} from './dto/tuition.dto.js';

@Controller('tuition')
@UseGuards(AuthGuard)
export class TuitionController {
  constructor(@Inject(TuitionService) private readonly tuitionService: TuitionService) {}

  // --------------------------------------------------------------------------
  // 1. BRANDING & TUITION PROFILE
  // --------------------------------------------------------------------------

  @Get('profile')
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.tuitionService.getBrandingProfile(user.instituteId);
  }

  @Put('profile')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTuitionProfileDto,
  ) {
    return this.tuitionService.updateBrandingProfile(user.instituteId, dto);
  }

  // --------------------------------------------------------------------------
  // 2. FACULTY MANAGEMENT
  // --------------------------------------------------------------------------

  @Get('faculties')
  async getFaculties(@CurrentUser() user: AuthenticatedUser) {
    return this.tuitionService.getFaculties(user.instituteId);
  }

  @Post('faculties')
  @HttpCode(HttpStatus.CREATED)
  async createFaculty(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFacultyDto,
  ) {
    return this.tuitionService.createFaculty(user.instituteId, dto);
  }

  @Put('faculties/:id')
  async updateFaculty(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') facultyId: string,
    @Body() dto: UpdateFacultyDto,
  ) {
    return this.tuitionService.updateFaculty(user.instituteId, facultyId, dto);
  }

  // --------------------------------------------------------------------------
  // 3. SALARY & PAYROLL
  // --------------------------------------------------------------------------

  @Get('salaries')
  async getSalaries(
    @CurrentUser() user: AuthenticatedUser,
    @Query('payPeriod') payPeriod?: string,
    @Query('facultyId') facultyId?: string,
  ) {
    return this.tuitionService.getSalaryRecords(user.instituteId, payPeriod, facultyId);
  }

  @Post('salaries/generate')
  @HttpCode(HttpStatus.CREATED)
  async generateSalary(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GenerateSalaryRecordDto,
  ) {
    return this.tuitionService.generateSalaryRecord(user.instituteId, dto);
  }

  @Put('salaries/:id/pay')
  async recordPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') salaryRecordId: string,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.tuitionService.recordSalaryPayment(user.instituteId, salaryRecordId, dto);
  }

  // --------------------------------------------------------------------------
  // 4. LEAVE MANAGEMENT
  // --------------------------------------------------------------------------

  @Get('leaves')
  async getLeaves(
    @CurrentUser() user: AuthenticatedUser,
    @Query('facultyId') facultyId?: string,
  ) {
    // If ordinary teacher, default to only their own leaves unless facultyId specified
    const targetFacultyId =
      user.role === 'TEACHER' ? user.id : facultyId;
    return this.tuitionService.getLeaveApplications(user.instituteId, targetFacultyId);
  }

  @Post('leaves/apply')
  @HttpCode(HttpStatus.CREATED)
  async applyLeave(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ApplyFacultyLeaveDto,
  ) {
    return this.tuitionService.applyLeave(user.instituteId, user.id, dto);
  }

  @Put('leaves/:id/review')
  async reviewLeave(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') leaveId: string,
    @Body() dto: ReviewFacultyLeaveDto,
  ) {
    return this.tuitionService.reviewLeave(user.instituteId, leaveId, user, dto);
  }

  // --------------------------------------------------------------------------
  // 5. DAILY TEACHING DIARY (LESSON JOURNAL)
  // --------------------------------------------------------------------------

  @Get('diaries')
  async getDiaries(
    @CurrentUser() user: AuthenticatedUser,
    @Query('batchId') batchId?: string,
    @Query('facultyId') facultyId?: string,
  ) {
    return this.tuitionService.getTeachingDiaries(user.instituteId, batchId, facultyId);
  }

  @Get('diaries/overview')
  async getDiariesOverview(@CurrentUser() user: AuthenticatedUser) {
    return this.tuitionService.getTeachingDiaryOverview(user.instituteId);
  }

  @Post('diaries')
  @HttpCode(HttpStatus.CREATED)
  async createDiary(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTeachingDiaryDto,
  ) {
    return this.tuitionService.createTeachingDiary(user.instituteId, user.id, dto);
  }

  @Put('diaries/:id')
  async updateDiary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') diaryId: string,
    @Body() dto: UpdateTeachingDiaryDto,
  ) {
    return this.tuitionService.updateTeachingDiary(user.instituteId, diaryId, user, dto);
  }

  // --------------------------------------------------------------------------
  // 6. STUDY MATERIAL & NOTES
  // --------------------------------------------------------------------------

  @Get('materials')
  async getMaterials(
    @CurrentUser() user: AuthenticatedUser,
    @Query('batchId') batchId?: string,
  ) {
    return this.tuitionService.getStudyMaterials(user.instituteId, batchId);
  }

  @Post('materials')
  @HttpCode(HttpStatus.CREATED)
  async createMaterial(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStudyMaterialDto,
  ) {
    return this.tuitionService.createStudyMaterial(user.instituteId, user.id, dto);
  }

  // --------------------------------------------------------------------------
  // 7. STUDENT FEES & FEE REMINDERS
  // --------------------------------------------------------------------------

  @Get('fees')
  async getFees(
    @CurrentUser() user: AuthenticatedUser,
    @Query('batchId') batchId?: string,
  ) {
    return this.tuitionService.getFeeRecords(user.instituteId, batchId);
  }

  @Get('fees/summary')
  async getFeeSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.tuitionService.getFeeSummary(user.instituteId);
  }

  @Post('fees/record')
  @HttpCode(HttpStatus.CREATED)
  async createFeeRecord(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStudentFeeRecordDto,
  ) {
    return this.tuitionService.createFeeRecord(user.instituteId, dto);
  }

  @Post('fees/remind')
  async dispatchFeeReminder(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DispatchFeeReminderDto,
  ) {
    return this.tuitionService.dispatchFeeReminder(user.instituteId, user.id, dto);
  }
}
