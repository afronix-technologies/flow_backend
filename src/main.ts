import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { loggerConfig } from './core/config/logging.config';

import { sharedCorsConfig } from '@app/common';

async function bootstrap() {
  // Use Custom Winston Logger
  const app = await NestFactory.create(AppModule, {
    logger: loggerConfig,
  });

  // Security & Performance
  app.use(helmet());
  app.use(compression());

  // CORS Configuration
  app.enableCors(sharedCorsConfig);

  // Global Prefix & Versioning
  const globalPrefix = process.env.API_PREFIX || 'api';
  app.setGlobalPrefix(globalPrefix);

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Afronix Tracker API')
    .setDescription('The Afronix Tracker Business System API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document);

  // Start Server
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/${globalPrefix}/docs`);
}
bootstrap();
