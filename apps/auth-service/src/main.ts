import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security - Modified for Swagger
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
  });

  app.setGlobalPrefix('api/v1');

  // Use helmet with CSP relaxed for Swagger
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable CSP for Swagger to work
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Flow Auth Service API')
    .setDescription('Authentication and User Management API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Flow Auth API',
    swaggerOptions: {
      persistAuthorization: true,
    },
    customCssUrl: '/api/docs/swagger-ui.css',
    customJs: [
      '/api/docs/swagger-ui-bundle.js',
      '/api/docs/swagger-ui-standalone-preset.js',
    ],
  });

  const port = process.env.AUTH_SERVICE_PORT || 3001;
  await app.listen(port);
  console.log(`Auth Service is running on port ${port}`);
}
bootstrap();