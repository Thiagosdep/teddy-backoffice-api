import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import { setupAppWithSwagger } from './infrastructure/swagger/config';
import { validationPipe } from './infrastructure/pipe/validation.pipe';
import { WinstonLoggerService } from './infrastructure/observability/logger/winston-logger.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  const logger = app.get(WinstonLoggerService);
  app.useLogger(logger);

  app.useGlobalPipes(validationPipe);

  app.enableVersioning({ type: VersioningType.URI });

  const nodeEnv = process.env.NODE_ENV;

  if (!nodeEnv) {
    throw new Error('NODE_ENV is not set');
  }

  if (['local', 'dev'].includes(nodeEnv)) {
    setupAppWithSwagger(app);
  }

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  logger.log(
    `Application is running on: http://localhost:${port}`,
    'Bootstrap',
  );
}

bootstrap().catch((err) => console.error(err));
