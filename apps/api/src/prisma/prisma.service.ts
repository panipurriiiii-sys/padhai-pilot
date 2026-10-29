import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public isConnected = false;

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    if (process.env.DATABASE_URL) {
      try {
        await this.$connect();
        this.isConnected = true;
        this.logger.log('Connected to PostgreSQL successfully');
      } catch (err) {
        this.logger.warn(`Could not connect to PostgreSQL, operating with seed/memory store: ${(err as Error).message}`);
        this.isConnected = false;
      }
    } else {
      this.logger.warn('DATABASE_URL not set. Running with built-in resilient mock store.');
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
    }
  }
}
