import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RegionalSettingsService } from '../services/regional-settings.service';
import { UpdateRegionalSettingsDto } from '../dto/update-regional-settings.dto';
import {
  AuditLogWriterService,
  AuditAction,
  AuditResourceType,
  AuditStatus,
  AuditSeverity,
} from '@app/common';

@ApiTags('Regional Settings')
@Controller('settings/regional')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RegionalSettingsController {
  constructor(
    private readonly regionalSettingsService: RegionalSettingsService,
    private readonly auditLogWriter: AuditLogWriterService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get regional/locale settings for the current organisation' })
  get(@Req() req: any) {
    return this.regionalSettingsService.findByOrg(req.user.organizationId);
  }

  @Put()
  @ApiOperation({ summary: 'Update regional/locale settings (partial update supported)' })
  async update(@Req() req: any, @Body() dto: UpdateRegionalSettingsDto) {
    const result = await this.regionalSettingsService.update(req.user.organizationId, dto);

    await this.auditLogWriter.log({
      organizationId: req.user.organizationId,
      userId: req.user.sub,
      actorId: req.user.sub,
      actorEmail: req.user.email,
      action: AuditAction.SETTINGS_CHANGE,
      resourceType: AuditResourceType.SETTINGS,
      resourceId: req.user.organizationId,
      resourceName: 'Regional settings',
      status: AuditStatus.SUCCESS,
      severity: AuditSeverity.MEDIUM,
      description: `${req.user.email ?? 'A user'} updated regional settings`,
      changes: dto as Record<string, any>,
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
    });

    return result;
  }
}
