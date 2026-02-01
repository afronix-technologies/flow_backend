import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
  });

  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('Flow Notification Service API')
    .setDescription('Email and Notification API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Flow Notification API',
    customCssUrl: '/api/docs/notifications/swagger-ui.css',
    customJs: [
      '/api/docs/notifications/swagger-ui-bundle.js',
      '/api/docs/notifications/swagger-ui-standalone-preset.js',
    ],
  });

  const port = process.env.NOTIFICATION_SERVICE_PORT || 3002;
  await app.listen(port);
  console.log(`Notification Service is running on port ${port}`);
}
bootstrap();