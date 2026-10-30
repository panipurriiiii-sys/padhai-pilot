import { Module } from '@nestjs/common';
import { StudentController } from './student.controller.js';
import { StudentService } from './student.service.js';
import { AssessmentModule } from '../assessment/assessment.module.js';
import { TuitionModule } from '../tuition/tuition.module.js';

@Module({
  imports: [AssessmentModule, TuitionModule],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
