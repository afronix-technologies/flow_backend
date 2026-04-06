import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// ── Auth Service Entities ─────────────────────────────────────────────────────
import { User } from '../../auth-service/src/auth/entities/user.entity';
import { Organization } from '../../auth-service/src/auth/entities/organization.entity';
import { UserOrganization } from '../../auth-service/src/auth/entities/user-organization.entity';
import { Invitation } from '../../auth-service/src/auth/entities/invitation.entity';
import { Role } from '../../auth-service/src/auth/entities/role.entity';
import { Permission } from '../../auth-service/src/auth/entities/permission.entity';
import { OAuthAccount } from '../../auth-service/src/auth/entities/oauth-account.entity';
import { RefreshToken } from '../../auth-service/src/auth/entities/refresh-token.entity';

// ── Settings Service Entities ─────────────────────────────────────────────────
import { NavigationItem } from '../../settings-service/src/navigation/entities/navigation-item.entity';
import { NavigationRoleOverride } from '../../settings-service/src/navigation/entities/navigation-role-override.entity';
import { FeatureCatalog } from '../../settings-service/src/features/entities/feature-catalog.entity';
import { OrganizationFeature } from '../../settings-service/src/features/entities/organization-feature.entity';
import { WorkspacePackage } from '../../settings-service/src/workspace/entities/workspace-package.entity';
import { OrganizationWorkspace } from '../../settings-service/src/workspace/entities/organization-workspace.entity';
import { ContactSettings } from '../../settings-service/src/settings/entities/contact-settings.entity';
import { GeneralSettings } from '../../settings-service/src/settings/entities/general-settings.entity';
import { RegionalSettings } from '../../settings-service/src/settings/entities/regional-settings.entity';

// ── Work Policies Entities ─────────────────────────────────────────────────────
import { WorkSchedule } from '../../settings-service/src/work-policies/entities/work-schedule.entity';
import { BreakPolicy } from '../../settings-service/src/work-policies/entities/break-policy.entity';
import { OvertimePolicy } from '../../settings-service/src/work-policies/entities/overtime-policy.entity';
import { OrgHoliday } from '../../settings-service/src/work-policies/entities/org-holiday.entity';

// ── Team Service Entities ─────────────────────────────────────────────────────
import { Department } from '../../settings-service/src/departments/entities/department.entity';
import { TeamMember } from '../../settings-service/src/members/entities/team-member.entity';

// ── File Service Entities ─────────────────────────────────────────────────────
import { File } from '../../file-service/src/files/entities/file.entity';

export const ALL_ENTITIES = [
  User,
  Organization,
  UserOrganization,
  Invitation,
  Role,
  Permission,
  OAuthAccount,
  RefreshToken,
  NavigationItem,
  NavigationRoleOverride,
  FeatureCatalog,
  OrganizationFeature,
  WorkspacePackage,
  OrganizationWorkspace,
  ContactSettings,
  GeneralSettings,
  RegionalSettings,
  WorkSchedule,
  BreakPolicy,
  OvertimePolicy,
  OrgHoliday,
  Department,
  TeamMember,
  File,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST', 'localhost'),
        port: config.get<number>('DATABASE_PORT', 5432),
        username: config.get('DATABASE_USER'),
        password: config.get('DATABASE_PASSWORD'),
        database: config.get('DATABASE_NAME'),
        entities: ALL_ENTITIES,
        synchronize: false,
        ssl: config.get('DATABASE_SSL') === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),
  ],
})
export class DatabaseModule {}
