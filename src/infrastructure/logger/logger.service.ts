import { Injectable, LoggerService } from '@nestjs/common';
import pino from 'pino';

@Injectable()
export class AppLogger implements LoggerService {
  private readonly logger = pino({
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  } as pino.LoggerOptions);

  log(message: string, context?: string) {
    this.logger.info(`[${context || 'APP'}] ${message}`);
  }

  error(message: string, trace?: string, context?: string) {
    const log = trace ? `${message} -> ${trace}` : message;
    this.logger.error(`[${context || 'APP'}] ${log}`);
  }

  warn(message: string, context?: string) {
    this.logger.warn(`[${context || 'APP'}] ${message}`);
  }

  debug(message: string, context?: string) {
    this.logger.debug(`[${context || 'APP'}] ${message}`);
  }
}
