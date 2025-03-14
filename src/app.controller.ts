import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { AppLogger } from './infrastructure/logger/logger.service';

@ApiTags('healthcheck')
@Controller({ version: '1' })
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly appLogger: AppLogger,
  ) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Returns the health status of the service.',
  })
  healthCheck(): string {
    try {
      return this.appService.healthCheck();
    } catch (error) {
      this.appLogger.error('Error on healthcheck', JSON.stringify(error));
      return this.appService.healthCheckDown();
    }
  }
}
