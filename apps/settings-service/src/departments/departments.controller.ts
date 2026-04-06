import {
  Controller,
  Get,
  Post,
  Patch,
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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentStatusDto } from './dto/update-department-status.dto';
import { JwtAuthGuard } from '../settings/guards/jwt-auth.guard';
import { RolesGuard } from '../work-policies/guards/roles.guard';

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('organizations/:orgId')
@UseGuards(JwtAuthGuard)
export class DepartmentsController {
  constructor(private readonly service: DepartmentsService) {}

  @Get('departments')
  @ApiOperation({ summary: 'List all departments for the organization' })
  @ApiParam({ name: 'orgId', description: 'Organization UUID' })
  @ApiResponse({
    status: 200,
    description: 'Array of department objects with manager embed, member preview, and counters.',
    schema: {
      example: [
        {
          id: 'dept-uuid',
          name: 'Engineering',
          description: 'Builds and maintains the core product.',
          status: 'active',
          manager: {
            id: 'user-uuid',
            fullName: 'James Paul',
            roleTitle: 'Engineering Manager',
            email: 'james@afronix.com',
            avatarColor: '#2563eb',
          },
          membersCount: 18,
          activeProjectsCount: 0,
          weeklyHours: 0,
          membersPreview: [{ id: 'mem-uuid', fullName: 'Blessing Obi', avatarColor: '#2563eb' }],
          extraMembersCount: 14,
          createdAt: '2026-01-04T10:00:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — wrong organization.' })
  findAll(@Param('orgId') orgId: string, @Req() req: any) {
    this.assertOrg(req, orgId);
    return this.service.findAll(orgId);
  }

  @Get('department-managers')
  @ApiOperation({ summary: 'List eligible managers for the Add Department modal' })
  @ApiParam({ name: 'orgId', description: 'Organization UUID' })
  @ApiResponse({
    status: 200,
    description: 'Array of active org users that can be assigned as department manager.',
    schema: {
      example: [
        {
          id: 'user-uuid',
          fullName: 'Grace Adeyemi',
          roleTitle: 'HR Manager',
          email: 'grace@afronix.com',
          avatarColor: '#f97316',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — wrong organization.' })
  getManagers(@Param('orgId') orgId: string, @Req() req: any) {
    this.assertOrg(req, orgId);
    return this.service.getEligibleManagers(orgId);
  }

  @Post('departments')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new department' })
  @ApiParam({ name: 'orgId', description: 'Organization UUID' })
  @ApiResponse({ status: 201, description: 'Department created — returns full department shape.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin or owner required.' })
  @ApiResponse({ status: 404, description: 'Manager not found in this organization.' })
  @ApiResponse({ status: 409, description: 'Department name already exists in this organization.' })
  create(@Param('orgId') orgId: string, @Req() req: any, @Body() dto: CreateDepartmentDto) {
    this.assertOrg(req, orgId);
    return this.service.create(orgId, dto);
  }

  @Patch('departments/:departmentId/status')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update department status (active / suspended)' })
  @ApiParam({ name: 'orgId', description: 'Organization UUID' })
  @ApiParam({ name: 'departmentId', description: 'Department UUID' })
  @ApiResponse({
    status: 200,
    description: 'Status updated.',
    schema: { example: { id: 'dept-uuid', status: 'suspended' } },
  })
  @ApiResponse({ status: 400, description: 'Invalid status value.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin or owner required.' })
  @ApiResponse({ status: 404, description: 'Department not found.' })
  updateStatus(
    @Param('orgId') orgId: string,
    @Param('departmentId') departmentId: string,
    @Req() req: any,
    @Body() dto: UpdateDepartmentStatusDto,
  ) {
    this.assertOrg(req, orgId);
    return this.service.updateStatus(orgId, departmentId, dto);
  }

  private assertOrg(req: any, orgId: string) {
    if (req.user.role !== 'super_admin' && req.user.organizationId !== orgId) {
      throw new ForbiddenException('Access denied to this organization');
    }
  }
}
