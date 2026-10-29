import { Global, Module } from '@nestjs/common';
import { ConfigService } from './config.service.js';
import { ConfigController } from './config.controller.js';

@Global()
@Module({
  controllers: [ConfigController],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
