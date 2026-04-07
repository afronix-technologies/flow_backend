import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from './entities/department.entity';
import { TeamMember } from '../members/entities/team-member.entity';
import { User } from '../../../auth-service/src/auth/entities/user.entity';
import { Organization } from '../../../auth-service/src/auth/entities/organization.entity';
import { Role } from '../../../auth-service/src/auth/entities/role.entity';
import { Permission } from '../../../auth-service/src/auth/entities/permission.entity';
import { UserOrganization } from '../../../auth-service/src/auth/entities/user-organization.entity';
import { OAuthAccount } from '../../../auth-service/src/auth/entities/oauth-account.entity';
import { Invitation } from '../../../auth-service/src/auth/entities/invitation.entity';
import { RefreshToken } from '../../../auth-service/src/auth/entities/refresh-token.entity';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { JwtAuthGuard } from '../settings/guards/jwt-auth.guard';
import { RolesGuard } from '../work-policies/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Department,
      TeamMember,
      User,
      Organization,
      Role,
      Permission,
      UserOrganization,
      OAuthAccount,
      Invitation,
      RefreshToken,
    ]),
  ],
  controllers: [DepartmentsController],
  providers: [DepartmentsService, JwtAuthGuard, RolesGuard],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
