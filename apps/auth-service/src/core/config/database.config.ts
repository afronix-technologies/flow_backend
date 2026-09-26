import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const databaseConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService): Promise<TypeOrmModuleOptions> => {
    const isSsl = configService.get<string>('DATABASE_SSL') === 'true';

    return {
      type: 'postgres',
      host: configService.get<string>('DATABASE_HOST'),
      port: configService.get<number>('DATABASE_PORT'),
      username: configService.get<string>('DATABASE_USER'),
      password: configService.get<string>('DATABASE_PASSWORD'),
      database: configService.get<string>('DATABASE_NAME'),
      entities: [__dirname + '/../../modules/**/*.entity{.ts,.js}'],
      synchronize: configService.get<string>('NODE_ENV') !== 'production', // True only in dev
      logging: configService.get<string>('NODE_ENV') !== 'production',
      ssl: isSsl ? { rejectUnauthorized: false } : false,
      autoLoadEntities: true,
    };
  },
};
