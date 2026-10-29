import { Controller, Get, Inject, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(
    @Optional()
    @Inject(PrismaService)
    private readonly prisma?: PrismaService,
  ) {}

  @Get()
  checkHealth() {
    return {
      status: 'ok',
      service: 'padhai-pilot-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: this.prisma?.isConnected ? 'connected' : 'fallback-active',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
