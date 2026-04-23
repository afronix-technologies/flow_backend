import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { sharedCorsConfig } from '@app/common';
import * as basicAuth from 'express-basic-auth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(sharedCorsConfig);
  app.setGlobalPrefix('api/v1');

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(
    ['/api/docs/settings', '/api/docs/settings-json'],
    basicAuth({
      users: {
        [process.env.SWAGGER_USER || 'admin']: process.env.SWAGGER_PASSWORD || '',
      },
      challenge: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Flow Settings Service API')
    .setDescription('Organisation Settings — General, Contact & Regional Configuration')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs/settings', app, document, {
    customSiteTitle: 'Flow Settings API',
    swaggerOptions: {
      persistAuthorization: true,
      url: '/api/docs/settings-json',
    },
    customCssUrl: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css',
    customJs: [
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js',
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js',
    ],
  });

  const port = process.env.SETTINGS_SERVICE_PORT || 3005;
  await app.listen(port);
  console.log(`Settings Service is running on port ${port}`);
}
bootstrap();
