import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { sharedCorsConfig } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());
  app.enableCors(sharedCorsConfig);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Flow API')
    .setDescription('Core product API — projects, tasks, and more')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs/api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      url: '/api/docs/api-json',
    },
  });

  const port = process.env.API_PORT || 3000;
  await app.listen(port);
  console.log(`API is running on port ${port}`);
}
bootstrap();
