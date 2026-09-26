import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../settings/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { OvertimePolicyService } from '../services/overtime-policy.service';
import { UpdateOvertimePolicyDto } from '../dto/update-overtime-policy.dto';

@ApiTags('Work Policies — Overtime')
@ApiBearerAuth()
@Controller('organizations/:orgId/work-policies/overtime')
@UseGuards(JwtAuthGuard)
export class OvertimePolicyController {
  constructor(private readonly service: OvertimePolicyService) {}

  @Get()
  @ApiOperation({
    summary: 'Get overtime policy',
    description:
      'Returns the overtime policy for the organisation. ' +
      'When enabled is false, weeklyThresholdHrs and rateMultiplier will be null.',
  })
  @ApiParam({ name: 'orgId', description: 'Organisation UUID' })
  @ApiResponse({
    status: 200,
    description: 'The current overtime policy for the organisation.',
    schema: {
      example: {
        id: 'uuid',
        organizationId: 'uuid',
        enabled: true,
        requireApproval: false,
        weeklyThresholdHrs: 40,
        rateMultiplier: 1.5,
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
    summary: 'Update overtime policy',
    description:
      'Creates or updates the overtime policy for the organisation. ' +
      'Requires admin or owner role. ' +
      'When enabled is true, both weeklyThresholdHrs and rateMultiplier become required. ' +
      'When enabled is false, those fields are cleared automatically. ' +
      'rateMultiplier range is 1.0–5.0 (e.g. 1.5 = time-and-a-half).',
  })
  @ApiParam({ name: 'orgId', description: 'Organisation UUID' })
  @ApiResponse({ status: 200, description: 'The updated overtime policy.' })
  @ApiResponse({
    status: 400,
    description: 'Validation error — check weeklyThresholdHrs and rateMultiplier.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid Bearer token.' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin or owner role required.' })
  update(@Param('orgId') orgId: string, @Req() req: any, @Body() dto: UpdateOvertimePolicyDto) {
    const organizationId = req.user.role === 'super_admin' ? orgId : req.user.organizationId;
    return this.service.update(organizationId, dto);
  }
}
