import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as axios from 'axios';
import { DataExportRequest, ExportStatus } from './entities/data-export-request.entity';
import { DataDeletionRequest, DeletionStatus } from './entities/data-deletion-request.entity';
import { ThirdPartyIntegration } from './entities/third-party-integration.entity';
import { DataAccessLog } from './entities/data-access-log.entity';
import { UserConsent } from './entities/user-consent.entity';
import { RequestExportDto } from './dto/request-export.dto';
import { RequestDeletionDto } from './dto/request-deletion.dto';
import { QueryAccessLogsDto } from './dto/query-access-logs.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';

@Injectable()
export class PrivacyService {
  private readonly notificationUrl =
    process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3002';

  constructor(
    @InjectRepository(DataExportRequest)
    private readonly exportRepo: Repository<DataExportRequest>,

    @InjectRepository(DataDeletionRequest)
    private readonly deletionRepo: Repository<DataDeletionRequest>,

    @InjectRepository(ThirdPartyIntegration)
    private readonly integrationRepo: Repository<ThirdPartyIntegration>,

    @InjectRepository(DataAccessLog)
    private readonly accessLogRepo: Repository<DataAccessLog>,

    @InjectRepository(UserConsent)
    private readonly consentRepo: Repository<UserConsent>,
  ) {}

  // ─── Data Export ─────────────────────────────────────────────────────────────

  async requestExport(
    userId: string,
    organizationId: string,
    email: string,
    dto: RequestExportDto,
    ipAddress: string,
  ) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentExport = await this.exportRepo.findOne({
      where: { userId, organizationId },
      order: { createdAt: 'DESC' },
    });

    if (recentExport && recentExport.createdAt > oneWeekAgo) {
      throw new ConflictException('You can only request one data export per week.');
    }

    const exportRequest = this.exportRepo.create({
      userId,
      organizationId,
      format: dto.format,
      dataIncluded: dto.dataCategories ?? ['profile', 'projects', 'tasks'],
      status: ExportStatus.PENDING,
      ipAddress,
    });

    await this.exportRepo.save(exportRequest);

    const estimatedCompletion = new Date();
    estimatedCompletion.setHours(estimatedCompletion.getHours() + 1);

    return {
      success: true,
      data: {
        requestId: exportRequest.id,
        status: ExportStatus.PENDING,
        estimatedCompletionTime: estimatedCompletion.toISOString(),
        message: "Your data export has been requested. You will receive an email when it's ready.",
      },
    };
  }

  async getExportStatus(userId: string, organizationId: string) {
    const exports = await this.exportRepo.find({
      where: { userId, organizationId },
      order: { createdAt: 'DESC' },
    });

    const lastExport = exports.find((e) => e.completedAt);

    return {
      success: true,
      data: {
        lastExportDate: lastExport?.completedAt ?? null,
        exports: exports.map((e) => ({
          id: e.id,
          status: e.status,
          createdAt: e.createdAt,
          expiresAt: e.expiresAt,
          downloadUrl: e.downloadUrl,
          fileSize: e.fileSize,
          format: e.format,
        })),
      },
    };
  }

  // ─── Data Deletion ────────────────────────────────────────────────────────────

  async requestDeletion(
    userId: string,
    organizationId: string,
    email: string,
    dto: RequestDeletionDto,
    ipAddress: string,
  ) {
    if (dto.confirmationToken) {
      return this.confirmDeletion(dto.confirmationToken);
    }

    const pending = await this.deletionRepo.findOne({
      where: { userId, organizationId, isConfirmed: false },
    });

    if (pending) {
      throw new ConflictException(
        'A pending deletion request already exists. Please check your email to confirm it.',
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const deletionRequest = this.deletionRepo.create({
      userId,
      organizationId,
      status: DeletionStatus.PENDING,
      confirmationToken: token,
      confirmationExpiresAt: expiresAt,
      isConfirmed: false,
      ipAddress,
    });

    await this.deletionRepo.save(deletionRequest);

    axios.default
      .post(`${this.notificationUrl}/api/v1/email/deletion-confirmation`, { email, token })
      .catch(() => {});

    return {
      success: true,
      data: {
        requestId: deletionRequest.id,
        status: DeletionStatus.PENDING,
        message: 'Deletion request submitted. Please check your email to confirm.',
        confirmationRequired: true,
        confirmationExpiresAt: expiresAt.toISOString(),
      },
    };
  }

  private async confirmDeletion(token: string) {
    const request = await this.deletionRepo.findOne({ where: { confirmationToken: token } });

    if (!request) throw new NotFoundException('Invalid confirmation token.');
    if (request.confirmationExpiresAt < new Date()) {
      throw new BadRequestException(
        'Confirmation token has expired. Please submit a new deletion request.',
      );
    }
    if (request.isConfirmed) {
      throw new ConflictException('This deletion request has already been confirmed.');
    }

    request.isConfirmed = true;
    request.status = DeletionStatus.PROCESSING;
    await this.deletionRepo.save(request);

    return {
      success: true,
      data: {
        requestId: request.id,
        status: DeletionStatus.PROCESSING,
        message: 'Your data is being deleted.',
      },
    };
  }

  // ─── Access Logs ──────────────────────────────────────────────────────────────

  async getAccessLogs(userId: string, organizationId: string, query: QueryAccessLogsDto) {
    const { page = 1, pageSize = 10, accessType, applicationName, dateFrom, dateTo } = query;

    const qb = this.accessLogRepo
      .createQueryBuilder('log')
      .where('log.userId = :userId AND log.organizationId = :organizationId', {
        userId,
        organizationId,
      });

    if (accessType) qb.andWhere('log.accessType = :accessType', { accessType });
    if (applicationName)
      qb.andWhere('log.applicationName ILIKE :applicationName', {
        applicationName: `%${applicationName}%`,
      });
    if (dateFrom) qb.andWhere('log.timestamp >= :dateFrom', { dateFrom: new Date(dateFrom) });
    if (dateTo) qb.andWhere('log.timestamp <= :dateTo', { dateTo: new Date(dateTo) });

    qb.orderBy('log.timestamp', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [logs, total] = await qb.getManyAndCount();

    return {
      success: true,
      data: { logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  // ─── Integrations ─────────────────────────────────────────────────────────────

  async getIntegrations(userId: string, organizationId: string) {
    const integrations = await this.integrationRepo.find({
      where: { userId, organizationId },
      order: { authorizedAt: 'DESC' },
    });

    return {
      success: true,
      data: integrations.map((integration) => {
        const { oauthToken, refreshToken, ...safe } = integration as any;
        void oauthToken;
        void refreshToken;
        return safe;
      }),
    };
  }

  async revokeIntegration(userId: string, organizationId: string, integrationId: string) {
    const integration = await this.integrationRepo.findOne({
      where: { id: integrationId, userId, organizationId },
    });

    if (!integration) throw new NotFoundException('Integration not found.');
    if (integration.revokedAt) throw new ConflictException('Integration already revoked.');

    integration.revokedAt = new Date();
    await this.integrationRepo.save(integration);

    return {
      success: true,
      data: { message: 'Access revoked successfully', revokedAt: integration.revokedAt },
    };
  }

  // ─── Consent ──────────────────────────────────────────────────────────────────

  async getConsent(userId: string, organizationId: string) {
    let consent = await this.consentRepo.findOne({ where: { userId, organizationId } });

    if (!consent) {
      consent = this.consentRepo.create({ userId, organizationId });
      await this.consentRepo.save(consent);
    }

    return {
      success: true,
      data: {
        marketing: consent.marketing,
        analytics: consent.analytics,
        thirdPartySharing: consent.thirdPartySharing,
        profilingForPersonalization: consent.profilingForPersonalization,
        updatedAt: consent.updatedAt,
      },
    };
  }

  async updateConsent(userId: string, organizationId: string, dto: UpdateConsentDto) {
    let consent = await this.consentRepo.findOne({ where: { userId, organizationId } });

    if (!consent) {
      consent = this.consentRepo.create({ userId, organizationId });
    }

    Object.assign(consent, dto);
    await this.consentRepo.save(consent);

    return { success: true, data: { message: 'Consent preferences updated' } };
  }
}
