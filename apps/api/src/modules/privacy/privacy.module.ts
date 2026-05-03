import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataExportRequest } from './entities/data-export-request.entity';
import { DataDeletionRequest } from './entities/data-deletion-request.entity';
import { ThirdPartyIntegration } from './entities/third-party-integration.entity';
import { DataAccessLog } from './entities/data-access-log.entity';
import { UserConsent } from './entities/user-consent.entity';
import { PrivacyService } from './privacy.service';
import { PrivacyController } from './privacy.controller';
import { JwtStrategy } from '../../core/strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DataExportRequest,
      DataDeletionRequest,
      ThirdPartyIntegration,
      DataAccessLog,
      UserConsent,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION', '7d') },
      }),
    }),
  ],
  controllers: [PrivacyController],
  providers: [PrivacyService, JwtStrategy],
})
export class PrivacyModule {}
