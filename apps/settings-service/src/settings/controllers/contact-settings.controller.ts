import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ContactSettingsService } from '../services/contact-settings.service';
import { UpdateContactSettingsDto } from '../dto/update-contact-settings.dto';
import {
  AuditLogWriterService,
  AuditAction,
  AuditResourceType,
  AuditStatus,
  AuditSeverity,
} from '@app/common';

@ApiTags('Contact Settings')
@Controller('settings/contact')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContactSettingsController {
  constructor(
    private readonly contactSettingsService: ContactSettingsService,
    private readonly auditLogWriter: AuditLogWriterService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get contact information settings for the current organisation' })
  get(@Req() req: any) {
    return this.contactSettingsService.findByOrg(req.user.organizationId);
  }

  @Put()
  @ApiOperation({ summary: 'Update contact information settings (partial update supported)' })
  async update(@Req() req: any, @Body() dto: UpdateContactSettingsDto) {
    const result = await this.contactSettingsService.update(req.user.organizationId, dto);

    await this.auditLogWriter.log({
      organizationId: req.user.organizationId,
      userId: req.user.sub,
      actorId: req.user.sub,
      actorEmail: req.user.email,
      action: AuditAction.SETTINGS_CHANGE,
      resourceType: AuditResourceType.SETTINGS,
      resourceId: req.user.organizationId,
      resourceName: 'Contact settings',
      status: AuditStatus.SUCCESS,
      severity: AuditSeverity.MEDIUM,
      description: `${req.user.email ?? 'A user'} updated contact settings`,
      changes: dto as Record<string, any>,
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
    });

    return result;
  }
}
