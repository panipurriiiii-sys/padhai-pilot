import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { AccessService } from '../common/access/access.service.js';

@Global()
@Module({
  providers: [PrismaService, AccessService],
  exports: [PrismaService, AccessService],
})
export class PrismaModule {}
