import { Module } from '@nestjs/common';
import { TuitionController } from './tuition.controller.js';
import { TuitionService } from './tuition.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [TuitionController],
  providers: [TuitionService],
  exports: [TuitionService],
})
export class TuitionModule {}

