import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../settings/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { BreakPolicyService } from '../services/break-policy.service';
import { UpdateBreakPolicyDto } from '../dto/update-break-policy.dto';

@ApiTags('Work Policies — Break')
@ApiBearerAuth()
@Controller('organizations/:orgId/work-policies/break')
@UseGuards(JwtAuthGuard)
export class BreakPolicyController {
  constructor(private readonly service: BreakPolicyService) {}

  @Get()
  @ApiOperation({
    summary: 'Get break policy',
    description:
      'Returns the lunch/break policy for the organisation. ' +
      'When includeLunchBreak is false, durationMins and breakType will be null.',
  })
  @ApiParam({ name: 'orgId', description: 'Organisation UUID' })
  @ApiResponse({
    status: 200,
    description: 'The current break policy for the organisation.',
    schema: {
      example: {
        id: 'uuid',
        organizationId: 'uuid',
        includeLunchBreak: true,
        durationMins: 30,
        breakType: 'unpaid',
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
    summary: 'Update break policy',
    description:
      'Creates or updates the break policy for the organisation. ' +
      'Requires admin or owner role. ' +
      'When includeLunchBreak is true, both durationMins and breakType become required. ' +
      'When includeLunchBreak is false, durationMins and breakType are cleared automatically.',
  })
  @ApiParam({ name: 'orgId', description: 'Organisation UUID' })
  @ApiResponse({ status: 200, description: 'The updated break policy.' })
  @ApiResponse({ status: 400, description: 'Validation error — check durationMins and breakType.' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid Bearer token.' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin or owner role required.' })
  update(@Param('orgId') orgId: string, @Req() req: any, @Body() dto: UpdateBreakPolicyDto) {
    const organizationId = req.user.role === 'super_admin' ? orgId : req.user.organizationId;
    return this.service.update(organizationId, dto);
  }
}
