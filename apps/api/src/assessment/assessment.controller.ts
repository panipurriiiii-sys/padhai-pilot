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
  Res,
  Inject,
} from '@nestjs/common';
import type { Response } from 'express';
import { AssessmentService } from './assessment.service.js';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/types.js';
import { BulkSaveDraftDto, CorrectMarkDto } from './dto/bulk-save-draft.dto.js';

@Controller('assessment')
@UseGuards(AuthGuard)
export class AssessmentController {
  constructor(@Inject(AssessmentService) private readonly assessmentService: AssessmentService) {}

  // -------------------------------------------------------------
  // TEACHER WORKFLOW ENDPOINTS
  // -------------------------------------------------------------

  @Get('batches')
  async getTeacherBatches(@CurrentUser() user: AuthenticatedUser) {
    return this.assessmentService.getTeacherBatches(user);
  }

  @Get('batches/:batchId/roster')
  async getBatchRoster(
    @Param('batchId') batchId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assessmentService.getBatchRoster(batchId, user);
  }

  @Get()
  async getAssessments(
    @Query('batchId') batchId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assessmentService.getAssessments(user, batchId);
  }

  @Get(':id')
  async getAssessmentDetails(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assessmentService.getAssessmentDetails(id, user);
  }

  @Post('draft')
  @HttpCode(HttpStatus.OK)
  async bulkSaveDraft(
    @Body() dto: BulkSaveDraftDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assessmentService.bulkSaveDraft(dto, user);
  }

  @Get(':id/review')
  async getPublishReview(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assessmentService.getPublishReviewSummary(id, user);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  async publishAssessment(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assessmentService.publishAssessment(id, user);
  }

  @Put(':id/marks/:markId/correct')
  @HttpCode(HttpStatus.OK)
  async correctMark(
    @Param('id') id: string,
    @Param('markId') markId: string,
    @Body() dto: CorrectMarkDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assessmentService.correctMark(id, markId, dto, user);
  }

  @Get(':id/export')
  async exportResultSheet(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const sheet = await this.assessmentService.exportResultSheet(id, user);
    res.setHeader('Content-Type', sheet.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${sheet.filename}"`);
    return res.send(sheet.data);
  }

  // -------------------------------------------------------------
  // STUDENT PORTAL ENDPOINTS
  // -------------------------------------------------------------

  @Get('student/results')
  async getStudentPublishedResults(@CurrentUser() user: AuthenticatedUser) {
    return this.assessmentService.getStudentPublishedResults(user);
  }

  @Get('student/notifications')
  async getStudentNotifications(@CurrentUser() user: AuthenticatedUser) {
    return this.assessmentService.getStudentNotifications(user);
  }

  @Put('student/notifications/:id/read')
  async markNotificationRead(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assessmentService.markNotificationRead(id, user);
  }
}

