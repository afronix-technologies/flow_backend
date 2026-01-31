import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Notification Service API')
    .setDescription('Email and Notification API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Default port for Notification Service
  const port = process.env.NOTIFICATION_SERVICE_PORT || 3002;
  await app.listen(port);
  console.log(`Notification Service is running on port ${port}`);
}
bootstrap();
