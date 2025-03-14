import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import { setupAppWithSwagger } from './infrastructure/swagger/config';
import { validationPipe } from './infrastructure/pipe/validation.pipe';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  app.useGlobalPipes(validationPipe);

  app.enableVersioning({ type: VersioningType.URI });

  const nodeEnv = process.env.NODE_ENV;

  if (!nodeEnv) {
    throw new Error('NODE_ENV is not set');
  }

  if (['local', 'dev'].includes(nodeEnv)) {
    setupAppWithSwagger(app);
  }

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => console.error(err));
