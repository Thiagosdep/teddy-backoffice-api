import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { WinstonLoggerService } from './infrastructure/observability/logger/winston-logger.service';

@ApiTags('healthcheck')
@Controller({ path: 'healthcheck', version: '1' })
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: WinstonLoggerService,
  ) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Returns the health status of the service.',
  })
  healthCheck(): string {
    try {
      this.logger.log('Health check requested', 'AppController');
      return this.appService.healthCheck();
    } catch (error) {
      this.logger.error(
        'Error on healthcheck',
        JSON.stringify(error),
        'AppController',
      );
      return this.appService.healthCheckDown();
    }
  }
}
