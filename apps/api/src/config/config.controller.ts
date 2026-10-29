import { Controller, Get, Query, Inject } from '@nestjs/common';
import { ConfigService } from './config.service.js';

@Controller('config')
export class ConfigController {
  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {}

  @Get()
  async getConfig(@Query('instituteId') instituteId?: string) {
    return this.configService.getConfigForInstitute(instituteId);
  }
}
