import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { sharedCorsConfig } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(sharedCorsConfig);

  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('Flow Job Service API')
    .setDescription('Background Jobs and Cron API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs/jobs', app, document, {
    customSiteTitle: 'Flow Job API',
    swaggerOptions: {
      url: '/api/docs/jobs-json', // ← ADD THIS
    },
    customCssUrl: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css',
    customJs: [
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js',
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js',
    ],
  });

  const port = process.env.JOB_SERVICE_PORT || 3003;
  await app.listen(port);
  console.log(`Job Service is running on port ${port}`);
}
bootstrap();
