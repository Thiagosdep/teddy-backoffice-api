import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { WinstonLoggerService } from './logger/winston-logger.service';
import { PrometheusService } from './metrics/prometheus.service';
import { MetricsController } from './metrics/metrics.controller';
import { MetricsMiddleware } from './middleware/metrics.middleware';

@Module({
  controllers: [MetricsController],
  providers: [WinstonLoggerService, PrometheusService],
  exports: [WinstonLoggerService, PrometheusService],
})
export class ObservabilityModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}
