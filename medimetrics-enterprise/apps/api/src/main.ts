import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RedactInterceptor } from './common/interceptors/redact.interceptor';
import { WinstonLogger } from './common/utils/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new WinstonLogger(),
    cors: false, // Handled manually below
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 8000);
  const env = configService.get<string>('NODE_ENV', 'development');

  // Security
  app.use(helmet({
    contentSecurityPolicy: env === 'production',
    crossOriginEmbedderPolicy: env === 'production',
  }));
  
  app.use(compression());
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGINS', 'http://localhost:3000').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  // Global prefix and versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new RedactInterceptor(),
  );

  // Swagger documentation
  if (configService.get<boolean>('ENABLE_SWAGGER', true)) {
    const config = new DocumentBuilder()
      .setTitle('MediMetrics API')
      .setDescription('Medical Image Analysis Platform API')
      .setVersion('2.0.0')
      .addBearerAuth()
      .addCookieAuth('jwt')
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('studies', 'Medical studies')
      .addTag('inference', 'AI inference')
      .addTag('reports', 'Medical reports')
      .addTag('admin', 'Administration')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port);
  console.log(`🚀 MediMetrics API running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/swagger`);
  console.log(`📊 Metrics endpoint: http://localhost:${port}/metrics`);
}

bootstrap();