import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiProduces,
} from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { CurrentOrg } from '../../core/decorators/current-org.decorator';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
@ApiForbiddenResponse({ description: 'Admin or owner role required' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'owner')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  // Static routes first to avoid conflict with /:id

  @Get('available-actions')
  @ApiOperation({ summary: 'Get all available audit action types for filtering' })
  @ApiOkResponse({ description: 'List of action types' })
  getAvailableActions() {
    return this.auditLogsService.getAvailableActions();
  }

  @Get('available-resource-types')
  @ApiOperation({ summary: 'Get all available resource types for filtering' })
  @ApiOkResponse({ description: 'List of resource types' })
  getAvailableResourceTypes() {
    return this.auditLogsService.getAvailableResourceTypes();
  }

  @Get('export')
  @ApiOperation({ summary: 'Export audit logs as CSV' })
  @ApiProduces('text/csv')
  @ApiOkResponse({ description: 'CSV file download' })
  async exportCsv(
    @CurrentOrg() orgId: string,
    @Query() query: QueryAuditLogsDto,
    @Res() res: Response,
  ) {
    const csv = await this.auditLogsService.exportCsv(orgId, query);
    const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(csv);
  }

  @Get()
  @ApiOperation({
    summary: 'List audit log entries with filtering and pagination',
    description: 'Admin/owner only. Returns paginated audit log entries for the organization.',
  })
  @ApiOkResponse({ description: 'Paginated audit log entries' })
  findAll(@CurrentOrg() orgId: string, @Query() query: QueryAuditLogsDto) {
    return this.auditLogsService.findAll(orgId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single audit log entry' })
  @ApiParam({ name: 'id', description: 'Audit log entry ID', type: String })
  @ApiOkResponse({ description: 'Audit log entry' })
  @ApiNotFoundResponse({ description: 'Audit log entry not found' })
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.auditLogsService.findOne(orgId, id);
  }
}
