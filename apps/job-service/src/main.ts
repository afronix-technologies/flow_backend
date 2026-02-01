import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Job Service API')
    .setDescription('Background Jobs and Cron API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs/jobs', app, document);

  // Job service might not need a port exposed if it only processes jobs/cron,
  // but for health checks or manual triggers, it's good.
  const port = process.env.JOB_SERVICE_PORT || 3003;
  await app.listen(port);
  console.log(`Job Service is running on port ${port}`);
}
bootstrap();
