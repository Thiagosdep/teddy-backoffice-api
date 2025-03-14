import { Controller, Get, Header } from '@nestjs/common';
import { PrometheusService } from './prometheus.service';
import { Public } from '../../../auth/decorators/public.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('metrics')
@Controller({ path: 'metrics', version: '1' })
export class MetricsController {
  constructor(private readonly prometheusService: PrometheusService) {}

  @Public()
  @Get()
  @Header('Content-Type', 'text/plain')
  async getMetrics(): Promise<string> {
    return this.prometheusService.getMetrics();
  }
}
