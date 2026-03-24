import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../settings/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { WorkScheduleService } from '../services/work-schedule.service';
import { UpdateWorkScheduleDto } from '../dto/update-work-schedule.dto';

@ApiTags('Work Policies — Schedule')
@ApiBearerAuth()
@Controller('organizations/:orgId/work-policies/schedule')
@UseGuards(JwtAuthGuard)
export class WorkScheduleController {
  constructor(private readonly service: WorkScheduleService) {}

  @Get()
  @ApiOperation({
    summary: 'Get work schedule',
    description:
      'Returns the active work schedule for the organisation, including working days and start/end times. ' +
      'If no schedule has been configured yet, returns the system default (Mon–Fri, 08:00–17:00).',
  })
  @ApiParam({ name: 'orgId', description: 'Organisation UUID' })
  @ApiResponse({
    status: 200,
    description: 'The current work schedule for the organisation.',
    schema: {
      example: {
        id: 'uuid',
        organizationId: 'uuid',
        workDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        startTime: '08:00',
        endTime: '17:30',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid Bearer token.' })
  get(@Param('orgId') orgId: string, @Req() req: any) {
    const organizationId = req.user.role === 'super_admin' ? orgId : req.user.organizationId;
    return this.service.findByOrg(organizationId);
  }

  @Put()
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Update work schedule',
    description:
      'Creates or updates the work schedule for the organisation. ' +
      'Requires admin or owner role. ' +
      'All fields are required — this is a full replace, not a partial update. ' +
      'startTime must be before endTime. At least one work day must be provided.',
  })
  @ApiParam({ name: 'orgId', description: 'Organisation UUID' })
  @ApiResponse({
    status: 200,
    description: 'The updated work schedule.',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error — check workDays, startTime, endTime.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid Bearer token.' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin or owner role required.' })
  update(@Param('orgId') orgId: string, @Req() req: any, @Body() dto: UpdateWorkScheduleDto) {
    const organizationId = req.user.role === 'super_admin' ? orgId : req.user.organizationId;
    return this.service.update(organizationId, dto);
  }
}
