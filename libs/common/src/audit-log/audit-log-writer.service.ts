import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuditLog,
  AuditAction,
  AuditActorType,
  AuditResourceType,
  AuditSeverity,
  AuditStatus,
} from './audit-log.entity';

export interface WriteAuditLogDto {
  organizationId: string;
  userId: string;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  actorType?: AuditActorType;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  resourceName?: string;
  status: AuditStatus;
  severity: AuditSeverity;
  description?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Fire-and-forget writer for the shared `audit_logs` table. Used by
 * services other than apps/api (which owns the table and exposes the
 * read/export API) to record actions without a cross-service HTTP call —
 * all services share the same database.
 */
@Injectable()
export class AuditLogWriterService {
  private readonly logger = new Logger(AuditLogWriterService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  async log(dto: WriteAuditLogDto): Promise<void> {
    const retentionDays = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '730', 10);
    const retentionUntil = new Date();
    retentionUntil.setDate(retentionUntil.getDate() + retentionDays);

    const entry = this.auditLogRepo.create({ ...dto, retentionUntil });
    await this.auditLogRepo.save(entry).catch((err) => {
      // Never let audit logging crash the calling operation.
      this.logger.warn(`Failed to write audit log entry: ${err?.message ?? err}`);
    });
  }
}
