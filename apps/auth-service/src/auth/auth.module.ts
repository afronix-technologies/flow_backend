import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './controllers/auth.controller';
import { UsersController } from './controllers/users.controller';
import { InvitationsController } from './controllers/invitations.controller';
import { OrganizationsController } from './controllers/organizations.controller';
import { TestVerificationController } from './controllers/test-verification.controller';

import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { EmailService } from './services/email.service';
import { UsersService } from './services/users.service';
import { RolesService } from './services/roles.service';
import { PermissionService } from './services/permission.service';

import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { AuthGateway } from './gateways/auth.gateway';

import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { UserOrganization } from './entities/user-organization.entity';
import { Invitation } from './entities/invitation.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { OAuthAccount } from './entities/oauth-account.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { OrganizationWorkspace } from './entities/organization-workspace.entity';
import { SessionService } from './services/session.service';
import { SessionGuard } from './guards/session.guard';
import { SubdomainGuard } from './guards/subdomain.guard';

import { OAuthController } from './controllers/oauth.controller';
import { OAuthService } from './services/oauth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { MicrosoftStrategy } from './strategies/microsoft.strategy';
import { buildUnconfiguredStrategy } from './strategies/unconfigured.strategy';
import { AuditLogWriterModule } from '@app/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Organization,
      UserOrganization,
      Invitation,
      Role,
      Permission,
      OAuthAccount,
      RefreshToken,
      OrganizationWorkspace,
    ]),
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION', '7d'),
        },
      }),
    }),
    AuditLogWriterModule,
  ],
  controllers: [
    AuthController,
    UsersController,
    InvitationsController,
    OrganizationsController,
    OAuthController,
    TestVerificationController,
  ],
  providers: [
    AuthService,
    PasswordService,
    EmailService,
    UsersService,
    RolesService,
    PermissionService,
    OAuthService,
    JwtStrategy,
    {
      provide: 'GOOGLE_STRATEGY',
      useFactory: (config: ConfigService) => {
        const clientID = config.get('GOOGLE_CLIENT_ID');
        const clientSecret = config.get('GOOGLE_CLIENT_SECRET');

        if (clientID && clientSecret) {
          return new GoogleStrategy(config);
        }

        const StrategyClass = buildUnconfiguredStrategy('google');
        return new StrategyClass();
      },
      inject: [ConfigService],
    },
    MicrosoftStrategy,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    AuthGateway,
    SessionService,
    SessionGuard,
    SubdomainGuard,
  ],
  exports: [
    AuthService,
    UsersService,
    RolesService,
    PermissionService,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    SessionService,
    SessionGuard,
    SubdomainGuard,
  ],
})
export class AuthModule {}
