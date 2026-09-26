import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkSchedule } from './entities/work-schedule.entity';
import { BreakPolicy } from './entities/break-policy.entity';
import { OvertimePolicy } from './entities/overtime-policy.entity';
import { OrgHoliday } from './entities/org-holiday.entity';

import { WorkScheduleService } from './services/work-schedule.service';
import { BreakPolicyService } from './services/break-policy.service';
import { OvertimePolicyService } from './services/overtime-policy.service';
import { HolidayService } from './services/holiday.service';
import { NagerDateService } from './services/nager-date.service';

import { WorkScheduleController } from './controllers/work-schedule.controller';
import { BreakPolicyController } from './controllers/break-policy.controller';
import { OvertimePolicyController } from './controllers/overtime-policy.controller';
import { HolidayController } from './controllers/holiday.controller';

import { JwtAuthGuard } from '../settings/guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([WorkSchedule, BreakPolicy, OvertimePolicy, OrgHoliday])],
  controllers: [
    WorkScheduleController,
    BreakPolicyController,
    OvertimePolicyController,
    HolidayController,
  ],
  providers: [
    WorkScheduleService,
    BreakPolicyService,
    OvertimePolicyService,
    HolidayService,
    NagerDateService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [WorkScheduleService, BreakPolicyService, OvertimePolicyService, HolidayService],
})
export class WorkPoliciesModule {}
