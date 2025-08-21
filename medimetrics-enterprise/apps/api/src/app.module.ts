import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';

// Feature modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudiesModule } from './studies/studies.module';
import { ReportsModule } from './reports/reports.module';
import { InferenceModule } from './inference/inference.module';
import { DicomModule } from './dicom/dicom.module';
import { StorageModule } from './storage/storage.module';
import { AdminModule } from './admin/admin.module';
import { DatabaseModule } from './database/database.module';

// Common
import { HealthController } from './health/health.controller';
import { MetricsController } from './metrics/metrics.controller';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        logging: configService.get<string>('NODE_ENV') === 'development',
        ssl: configService.get<string>('NODE_ENV') === 'production' ? {
          rejectUnauthorized: false,
        } : false,
        poolSize: configService.get<number>('DB_POOL_SIZE', 20),
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ttl: 60,
        limit: 100,
        ignoreUserAgents: [/health-check/i],
        skipIf: (context) => {
          const request = context.switchToHttp().getRequest();
          return request.url === '/health' || request.url === '/metrics';
        },
      }),
      inject: [ConfigService],
    }),

    // Monitoring
    TerminusModule,

    // Feature modules
    DatabaseModule,
    AuthModule,
    UsersModule,
    StudiesModule,
    ReportsModule,
    InferenceModule,
    DicomModule,
    StorageModule,
    AdminModule,
  ],
  controllers: [HealthController, MetricsController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes('*')
      .apply(CsrfMiddleware)
      .exclude('(.*)/health', '(.*)/metrics')
      .forRoutes('*');
  }
}