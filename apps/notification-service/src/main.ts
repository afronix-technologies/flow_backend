import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

import { sharedCorsConfig } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(sharedCorsConfig);

  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('Flow Notification Service API')
    .setDescription('Email and Notification API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs/notifications', app, document, {
    customSiteTitle: 'Flow Notification API',
    swaggerOptions: {
      url: '/api/docs/notifications-json', // ← ADD THIS
    },
    customCssUrl: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css',
    customJs: [
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js',
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js',
    ],
  });

  const port = process.env.NOTIFICATION_SERVICE_PORT || 3002;
  await app.listen(port);
  console.log(`Notification Service is running on port ${port}`);
}
bootstrap();
