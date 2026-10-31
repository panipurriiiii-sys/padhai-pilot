import { Module } from '@nestjs/common';
import { FinanceController, StudentFinanceController } from './finance.controller.js';
import { FinanceService } from './finance.service.js';
import { StudentLeavesService } from './leaves.service.js';
import { BrandingController, LetterheadService } from './branding.service.js';
import { DocumentsController } from '../documents/documents.controller.js';
import { DocumentsService } from '../documents/documents.service.js';

/** Batch fees/payments/receipts, student leaves, institute letterhead and server-rendered PDF documents. */
@Module({
  controllers: [FinanceController, StudentFinanceController, BrandingController, DocumentsController],
  providers: [FinanceService, StudentLeavesService, LetterheadService, DocumentsService],
  exports: [FinanceService, LetterheadService],
})
export class FinanceModule {}
