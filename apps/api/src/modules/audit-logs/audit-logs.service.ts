import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import {
  AuditLog,
  AuditAction,
  AuditResourceType,
  AuditActorType,
  AuditStatus,
  AuditSeverity,
} from './entities/audit-log.entity';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

export interface CreateAuditLogDto {
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

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  async log(dto: CreateAuditLogDto): Promise<void> {
    const retentionDays = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '730');
    const retentionUntil = new Date();
    retentionUntil.setDate(retentionUntil.getDate() + retentionDays);

    const entry = this.auditLogRepo.create({ ...dto, retentionUntil });
    await this.auditLogRepo.save(entry).catch(() => {
      // Fire-and-forget: never let audit logging crash the main operation
    });
  }

  async findAll(organizationId: string, query: QueryAuditLogsDto) {
    const {
      page = 1,
      pageSize = 20,
      action,
      resourceType,
      status,
      severity,
      actor,
      dateFrom,
      dateTo,
    } = query;

    const where: FindOptionsWhere<AuditLog> = { organizationId };

    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (dateFrom && dateTo) {
      where.timestamp = Between(new Date(dateFrom), new Date(dateTo));
    }

    const qb = this.auditLogRepo
      .createQueryBuilder('log')
      .where('log.organizationId = :organizationId', { organizationId });

    if (action) qb.andWhere('log.action = :action', { action });
    if (resourceType) qb.andWhere('log.resourceType = :resourceType', { resourceType });
    if (status) qb.andWhere('log.status = :status', { status });
    if (severity) qb.andWhere('log.severity = :severity', { severity });
    if (actor)
      qb.andWhere('(log.actorEmail ILIKE :actor OR log.actorName ILIKE :actor)', {
        actor: `%${actor}%`,
      });
    if (dateFrom) qb.andWhere('log.timestamp >= :dateFrom', { dateFrom: new Date(dateFrom) });
    if (dateTo) qb.andWhere('log.timestamp <= :dateTo', { dateTo: new Date(dateTo) });

    qb.orderBy('log.timestamp', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [entries, total] = await qb.getManyAndCount();

    return {
      success: true,
      data: {
        entries,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(organizationId: string, id: string) {
    const entry = await this.auditLogRepo.findOne({ where: { id, organizationId } });
    if (!entry) throw new NotFoundException('Audit log entry not found');
    return { success: true, data: entry };
  }

  async exportCsv(organizationId: string, query: QueryAuditLogsDto): Promise<string> {
    const { action, resourceType, status, severity, actor, dateFrom, dateTo } = query;

    const qb = this.auditLogRepo
      .createQueryBuilder('log')
      .where('log.organizationId = :organizationId', { organizationId });

    if (action) qb.andWhere('log.action = :action', { action });
    if (resourceType) qb.andWhere('log.resourceType = :resourceType', { resourceType });
    if (status) qb.andWhere('log.status = :status', { status });
    if (severity) qb.andWhere('log.severity = :severity', { severity });
    if (actor)
      qb.andWhere('(log.actorEmail ILIKE :actor OR log.actorName ILIKE :actor)', {
        actor: `%${actor}%`,
      });
    if (dateFrom) qb.andWhere('log.timestamp >= :dateFrom', { dateFrom: new Date(dateFrom) });
    if (dateTo) qb.andWhere('log.timestamp <= :dateTo', { dateTo: new Date(dateTo) });

    qb.orderBy('log.timestamp', 'DESC');

    const entries = await qb.getMany();

    const headers =
      'Timestamp,User Name,User Email,Action,Resource Type,Resource Name,Status,Severity,IP Address,Description';
    const rows = entries.map((e) =>
      [
        e.timestamp?.toISOString() ?? '',
        e.actorName ?? '',
        e.actorEmail ?? '',
        e.action,
        e.resourceType,
        e.resourceName ?? '',
        e.status,
        e.severity,
        e.ipAddress ?? '',
        (e.description ?? '').replace(/,/g, ';'),
      ].join(','),
    );

    return [headers, ...rows].join('\n');
  }

  getAvailableActions() {
    return { success: true, data: Object.values(AuditAction) };
  }

  getAvailableResourceTypes() {
    return { success: true, data: Object.values(AuditResourceType) };
  }
}
