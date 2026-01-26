import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Security Hardening
    app.enableCors(); // Enable CORS with default settings (can be strictured later)
    app.setGlobalPrefix('api/v1'); // Set global prefix
    app.use(helmet()); // Set security headers

    // Global Validation
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true, // Strip properties not in DTO
        transform: true, // Transform payloads to DTO instances
        forbidNonWhitelisted: true // Throw error if extra properties present
    }));

    // Swagger Configuration
    const config = new DocumentBuilder()
        .setTitle('Auth Service API')
        .setDescription('Authentication and User Management API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    // Default port for Auth Service
    const port = process.env.AUTH_SERVICE_PORT || 3001;
    await app.listen(port);
    console.log(`Auth Service is running on port ${port}`);
}
bootstrap();
