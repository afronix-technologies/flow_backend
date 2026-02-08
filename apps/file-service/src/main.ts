import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security - CORS Configuration
  app.enableCors({
    origin: (origin, callback) => {
      const envOrigins = process.env.CORS_ORIGINS?.split(',') || [];
      const allowedOrigins: string[] = [];
      const allowedOriginPatterns: RegExp[] = [];

      envOrigins.forEach((o) => {
        const trimmed = o.trim();
        if (trimmed.includes('*')) {
          const regexStr = '^' + trimmed.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$';
          allowedOriginPatterns.push(new RegExp(regexStr));
        } else {
          allowedOrigins.push(trimmed);
        }
      });

      if (allowedOrigins.length === 0 && allowedOriginPatterns.length === 0) {
        allowedOrigins.push('http://localhost:4200');
      }

      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (allowedOriginPatterns.some((pattern) => pattern.test(origin)))
        return callback(null, true);

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
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
    .setTitle('Flow File Service API')
    .setDescription('Public File Storage and Management API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs/files', app, document, {
    customSiteTitle: 'Flow File API',
    swaggerOptions: {
      persistAuthorization: true,
      url: '/api/docs/files-json',
    },
    customCssUrl: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css',
    customJs: [
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js',
      'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js',
    ],
  });

  const port = process.env.FILE_SERVICE_PORT || 3004;
  await app.listen(port);
  console.log(`File Service is running on port ${port}`);
}
bootstrap();
