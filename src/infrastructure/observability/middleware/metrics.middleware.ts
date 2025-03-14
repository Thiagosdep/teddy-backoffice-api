import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrometheusService } from '../metrics/prometheus.service';
import { WinstonLoggerService } from '../logger/winston-logger.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(
    private readonly prometheusService: PrometheusService,
    private readonly logger: WinstonLoggerService,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const path = originalUrl.split('?')[0];

    this.prometheusService.startHttpRequest(method, path);
    const startTime = Date.now();

    this.logger.log(
      `Incoming request: ${method} ${originalUrl}`,
      'HttpRequest',
    );

    res.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000;
      const { statusCode } = res;

      this.prometheusService.recordHttpRequest(
        method,
        path,
        statusCode,
        duration,
      );
      this.prometheusService.endHttpRequest(method, path);

      this.logger.log(
        `Request completed: ${method} ${originalUrl} ${statusCode} ${duration}s`,
        'HttpResponse',
      );
    });

    next();
  }
}
