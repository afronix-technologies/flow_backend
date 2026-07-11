import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GeneralSettingsService } from '../services/general-settings.service';
import { UpdateGeneralSettingsDto } from '../dto/update-general-settings.dto';
import {
  AuditLogWriterService,
  AuditAction,
  AuditResourceType,
  AuditStatus,
  AuditSeverity,
} from '@app/common';

@ApiTags('General Settings')
@Controller('settings/general')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GeneralSettingsController {
  constructor(
    private readonly generalSettingsService: GeneralSettingsService,
    private readonly auditLogWriter: AuditLogWriterService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get general/company configuration for the current organisation' })
  get(@Req() req: any) {
    return this.generalSettingsService.findByOrg(req.user.organizationId);
  }

  @Put()
  @ApiOperation({ summary: 'Update general/company configuration (partial update supported)' })
  async update(@Req() req: any, @Body() dto: UpdateGeneralSettingsDto) {
    const result = await this.generalSettingsService.update(req.user.organizationId, dto);

    await this.auditLogWriter.log({
      organizationId: req.user.organizationId,
      userId: req.user.sub,
      actorId: req.user.sub,
      actorEmail: req.user.email,
      action: AuditAction.SETTINGS_CHANGE,
      resourceType: AuditResourceType.SETTINGS,
      resourceId: req.user.organizationId,
      resourceName: 'General settings',
      status: AuditStatus.SUCCESS,
      severity: AuditSeverity.MEDIUM,
      description: `${req.user.email ?? 'A user'} updated general settings`,
      changes: dto as Record<string, any>,
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
    });

    return result;
  }
}
