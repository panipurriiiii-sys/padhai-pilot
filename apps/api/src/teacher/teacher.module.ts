import { Module } from '@nestjs/common';
import { TeacherService } from './teacher.service.js';
import { TeacherController } from './teacher.controller.js';
import { BatchesService } from './batches.service.js';
import { EnrollmentCodesService } from './enrollment-codes.service.js';
import { TimetableService } from './timetable.service.js';
import { BroadcastService } from './broadcast.service.js';

@Module({
  controllers: [TeacherController],
  providers: [TeacherService, BatchesService, EnrollmentCodesService, TimetableService, BroadcastService],
  exports: [TeacherService, BatchesService, EnrollmentCodesService, TimetableService, BroadcastService],
})
export class TeacherModule {}
