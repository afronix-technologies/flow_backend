import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { databaseConfig } from './core/config/database.config';
import { redisConfig } from './core/config/redis.config';
import { SettingsModule } from './settings/settings.module';
import { FeaturesModule } from './features/features.module';
import { NavigationModule } from './navigation/navigation.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { SeedModule } from './seed/seed.module';
import { WorkPoliciesModule } from './work-policies/work-policies.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    TypeOrmModule.forRootAsync(databaseConfig),
    CacheModule.registerAsync({
      isGlobal: true,
      ...redisConfig,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'redis'),
          port: parseInt(configService.get('REDIS_PORT', '6379')),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: 'notifications' }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    SettingsModule,
    FeaturesModule,
    NavigationModule,
    WorkspaceModule,
    SeedModule,
    WorkPoliciesModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
