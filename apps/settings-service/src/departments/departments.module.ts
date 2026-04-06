import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from './entities/department.entity';
import { TeamMember } from '../members/entities/team-member.entity';
import { User } from '../../auth-service/src/auth/entities/user.entity';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { JwtAuthGuard } from '../settings/guards/jwt-auth.guard';
import { RolesGuard } from '../work-policies/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Department, TeamMember, User])],
  controllers: [DepartmentsController],
  providers: [DepartmentsService, JwtAuthGuard, RolesGuard],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
