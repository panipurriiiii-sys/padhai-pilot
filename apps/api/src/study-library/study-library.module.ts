import { Module } from '@nestjs/common';
import { StudyLibraryController } from './study-library.controller.js';
import { StudyLibraryService } from './study-library.service.js';

@Module({
  controllers: [StudyLibraryController],
  providers: [StudyLibraryService],
  exports: [StudyLibraryService],
})
export class StudyLibraryModule {}
