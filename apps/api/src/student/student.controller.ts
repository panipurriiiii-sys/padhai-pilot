import {
  Controller,
  Get,
  Query,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { StudentService } from './student.service.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/types.js';

@Controller('student')
@UseGuards(AuthGuard)
export class StudentController {
  constructor(@Inject(StudentService) private readonly studentService: StudentService) {}

  @Get('dashboard')
  async getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.studentService.getDashboard(user);
  }

  @Get('attendance')
  async getAttendance(@CurrentUser() user: AuthenticatedUser) {
    return this.studentService.getAttendance(user);
  }

  @Get('results')
  async getResults(@CurrentUser() user: AuthenticatedUser) {
    return this.studentService.getResults(user);
  }

  @Get('materials')
  async getMaterials(
    @CurrentUser() user: AuthenticatedUser,
    @Query('batchId') batchId?: string,
    @Query('category') category?: string,
  ) {
    return this.studentService.getMaterials(user, batchId, category);
  }

  @Get('fees')
  async getFees(@CurrentUser() user: AuthenticatedUser) {
    return this.studentService.getFees(user);
  }

  @Get('announcements')
  async getAnnouncements(@CurrentUser() user: AuthenticatedUser) {
    return this.studentService.getAnnouncements(user);
  }
}
