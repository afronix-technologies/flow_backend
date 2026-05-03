import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { PrivacyService } from './privacy.service';
import { RequestExportDto } from './dto/request-export.dto';
import { RequestDeletionDto } from './dto/request-deletion.dto';
import { QueryAccessLogsDto } from './dto/query-access-logs.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../core/decorators/current-user.decorator';

@ApiTags('Privacy')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT token' })
@UseGuards(JwtAuthGuard)
@Controller('privacy')
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  // ─── Export ──────────────────────────────────────────────────────────────────

  @Post('export')
  @ApiOperation({
    summary: 'Request a personal data export',
    description: 'GDPR Article 15 — right of access. Max 1 request per week.',
  })
  @ApiCreatedResponse({ description: 'Export request submitted' })
  @ApiConflictResponse({ description: 'Export already requested this week' })
  requestExport(@CurrentUser() user: any, @Body() dto: RequestExportDto, @Request() req: any) {
    const ip = req.ip || req.headers['x-forwarded-for'];
    return this.privacyService.requestExport(user.userId, user.organizationId, user.email, dto, ip);
  }

  @Get('export/status')
  @ApiOperation({ summary: 'Get status of all data export requests' })
  @ApiOkResponse({ description: 'Export requests list' })
  getExportStatus(@CurrentUser() user: any) {
    return this.privacyService.getExportStatus(user.userId, user.organizationId);
  }

  // ─── Deletion ─────────────────────────────────────────────────────────────────

  @Post('delete')
  @ApiOperation({
    summary: 'Request or confirm permanent data deletion',
    description:
      'GDPR Article 17 — right to be forgotten. Send without confirmationToken to initiate; send with token to confirm.',
  })
  @ApiCreatedResponse({ description: 'Deletion request submitted or confirmed' })
  @ApiConflictResponse({ description: 'Pending request already exists' })
  @ApiBadRequestResponse({ description: 'Token expired' })
  @ApiNotFoundResponse({ description: 'Invalid token' })
  requestDeletion(@CurrentUser() user: any, @Body() dto: RequestDeletionDto, @Request() req: any) {
    const ip = req.ip || req.headers['x-forwarded-for'];
    return this.privacyService.requestDeletion(
      user.userId,
      user.organizationId,
      user.email,
      dto,
      ip,
    );
  }

  // ─── Access Logs ──────────────────────────────────────────────────────────────

  @Get('access-logs')
  @ApiOperation({ summary: 'Get data access activity logs for the current user' })
  @ApiOkResponse({ description: 'Paginated access logs' })
  getAccessLogs(@CurrentUser() user: any, @Query() query: QueryAccessLogsDto) {
    return this.privacyService.getAccessLogs(user.userId, user.organizationId, query);
  }

  // ─── Integrations ─────────────────────────────────────────────────────────────

  @Get('integrations')
  @ApiOperation({ summary: 'List third-party apps with access to user data' })
  @ApiOkResponse({ description: 'List of integrations' })
  getIntegrations(@CurrentUser() user: any) {
    return this.privacyService.getIntegrations(user.userId, user.organizationId);
  }

  @Post('integrations/:integrationId/revoke')
  @ApiOperation({ summary: 'Revoke access for a third-party application' })
  @ApiOkResponse({ description: 'Access revoked' })
  @ApiNotFoundResponse({ description: 'Integration not found' })
  @ApiConflictResponse({ description: 'Integration already revoked' })
  revokeIntegration(@CurrentUser() user: any, @Param('integrationId') integrationId: string) {
    return this.privacyService.revokeIntegration(user.userId, user.organizationId, integrationId);
  }

  // ─── Consent ──────────────────────────────────────────────────────────────────

  @Get('consent')
  @ApiOperation({ summary: 'Get current consent preferences' })
  @ApiOkResponse({ description: 'Consent preferences' })
  getConsent(@CurrentUser() user: any) {
    return this.privacyService.getConsent(user.userId, user.organizationId);
  }

  @Put('consent')
  @ApiOperation({ summary: 'Update consent preferences' })
  @ApiOkResponse({ description: 'Consent updated' })
  updateConsent(@CurrentUser() user: any, @Body() dto: UpdateConsentDto) {
    return this.privacyService.updateConsent(user.userId, user.organizationId, dto);
  }
}
