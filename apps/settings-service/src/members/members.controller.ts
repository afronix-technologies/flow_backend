import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MembersService } from './members.service';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { JwtAuthGuard } from '../settings/guards/jwt-auth.guard';
import { RolesGuard } from '../work-policies/guards/roles.guard';

const MEMBER_EXAMPLE = {
  id: 'mem-uuid',
  fullName: 'John Ossai',
  phone: '+234192090190922',
  email: 'john@afronix.com',
  dateOfBirth: '1996-03-12',
  gender: 'male',
  address: '12 Admiralty Way, Lekki, Lagos',
  departmentId: 'dept-uuid',
  departmentName: 'Engineering',
  userRole: 'manager',
  projectAccess: 'google-marketing-development',
  notificationSettings: {
    taskAssignments: true,
    deadlineReminders: true,
    dailySummary: true,
    weeklyReport: false,
    teamUpdates: false,
  },
  status: 'pending_invite',
  createdAt: '2026-04-06T14:45:00.000Z',
};

@ApiTags('Team Members')
@ApiBearerAuth()
@Controller('organizations/:orgId')
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(private readonly service: MembersService) {}

  @Post('members')
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Create / invite a new team member',
    description:
      'Creates a member record with status "pending_invite". ' +
      'departmentId is optional — omit when launching from the global Add Member button.',
  })
  @ApiParam({ name: 'orgId', description: 'Organization UUID' })
  @ApiResponse({ status: 201, description: 'Member created.', schema: { example: MEMBER_EXAMPLE } })
  @ApiResponse({ status: 400, description: 'Validation error or invalid departmentId.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin or owner required.' })
  @ApiResponse({ status: 409, description: 'Email already exists in this organization.' })
  create(@Param('orgId') orgId: string, @Req() req: any, @Body() dto: CreateTeamMemberDto) {
    this.assertOrg(req, orgId);
    return this.service.create(orgId, dto);
  }

  @Get('departments/:departmentId/members')
  @ApiOperation({ summary: 'List all members of a specific department' })
  @ApiParam({ name: 'orgId', description: 'Organization UUID' })
  @ApiParam({ name: 'departmentId', description: 'Department UUID' })
  @ApiResponse({
    status: 200,
    description: 'Array of team member objects for this department.',
    schema: { example: [MEMBER_EXAMPLE] },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — wrong organization.' })
  @ApiResponse({ status: 404, description: 'Department not found.' })
  findByDepartment(
    @Param('orgId') orgId: string,
    @Param('departmentId') departmentId: string,
    @Req() req: any,
  ) {
    this.assertOrg(req, orgId);
    return this.service.findByDepartment(orgId, departmentId);
  }

  private assertOrg(req: any, orgId: string) {
    if (req.user.role !== 'super_admin' && req.user.organizationId !== orgId) {
      throw new ForbiddenException('Access denied to this organization');
    }
  }
}
