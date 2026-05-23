import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamMember } from './entities/team-member.entity';
import { Department } from '../departments/entities/department.entity';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { JwtAuthGuard } from '../settings/guards/jwt-auth.guard';
import { RolesGuard } from '../work-policies/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([TeamMember, Department])],
  controllers: [MembersController],
  providers: [MembersService, JwtAuthGuard, RolesGuard],
  exports: [MembersService],
})
export class MembersModule {}
