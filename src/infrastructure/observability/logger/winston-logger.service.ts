import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import LokiTransport from 'winston-loki';

@Injectable()
export class WinstonLoggerService {
  private winstonLogger: winston.Logger;

  constructor() {
    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
        ),
      }),
    ];

    const lokiUrl = process.env.LOKI_URL || ' http://loki:3100';
    try {
      transports.push(
        new LokiTransport({
          host: lokiUrl,
          labels: { app: 'teddy-backoffice-api' },
          json: true,
          format: winston.format.json(),
          timeout: 10000,
          batching: false,
          interval: 1,
          replaceTimestamp: true,
          onConnectionError: (err) => {
            console.error('Loki connection error:', err);
          },
        }),
      );
      console.log(`Successfully configured Loki transport at ${lokiUrl}`);
    } catch (error) {
      console.error('Failed to initialize Loki transport:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    }

    this.winstonLogger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      defaultMeta: { service: 'teddy-backoffice-api' },
      transports,
    });
  }

  log(message: string, context?: string): void {
    this.winstonLogger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.winstonLogger.error(message, { trace, context });
  }

  warn(message: string, context?: string): void {
    this.winstonLogger.warn(message, { context });
  }

  debug(message: string, context?: string): void {
    this.winstonLogger.debug(message, { context });
  }
}
