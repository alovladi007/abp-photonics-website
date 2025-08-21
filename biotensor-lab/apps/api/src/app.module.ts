import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './controllers/health.controller';
import { PredictController } from './controllers/predict.controller';
import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { Patient } from './entities/patient.entity';
import { SignalChunk } from './entities/signal-chunk.entity';
import { Feature } from './entities/feature.entity';
import { SignalsController } from './controllers/signals.controller';
import { DbBootstrapService } from './services/db-bootstrap.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        autoLoadEntities: true,
        synchronize: true
      })
    }),
    TypeOrmModule.forFeature([User, Organization, Patient, SignalChunk, Feature])
  ],
  controllers: [HealthController, PredictController, SignalsController],
  providers: [DbBootstrapService]
})
export class AppModule {}
