import { Controller, Post, Body, HttpCode, HttpStatus, Req, Inject } from '@nestjs/common';
import type { Request } from 'express';
import { EnrollmentCodesService } from '../teacher/enrollment-codes.service.js';

@Controller('invitations')
export class InvitationsController {
  constructor(@Inject(EnrollmentCodesService) private readonly codes: EnrollmentCodesService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validateCode(@Body('code') code: string, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    return this.codes.validatePublic(code, ip);
  }
}
