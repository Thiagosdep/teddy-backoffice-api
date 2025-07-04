import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

import { INestApplication } from '@nestjs/common';

export const createSwaggerDocument = (app: INestApplication): OpenAPIObject => {
  const options = new DocumentBuilder()
    .setTitle('TH Backoffice')
    .setDescription('The TH Backoffice API')
    .build();

  return SwaggerModule.createDocument(app, options, {
    extraModels: [],
  });
};

export const setupAppWithSwagger = (app: INestApplication) => {
  const document = createSwaggerDocument(app);
  SwaggerModule.setup('swagger', app, document);
};
