import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  DOWNLOAD = 'DOWNLOAD',
  UPLOAD = 'UPLOAD',
  SHARE = 'SHARE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  SETTINGS_CHANGE = 'SETTINGS_CHANGE',
}

export enum AuditResourceType {
  USER = 'User',
  PROJECT = 'Project',
  TASK = 'Task',
  TEAM = 'Team',
  DEPARTMENT = 'Department',
  SETTINGS = 'Settings',
  INTEGRATION = 'Integration',
  API_KEY = 'API Key',
}

export enum AuditActorType {
  USER = 'user',
  SYSTEM = 'system',
  API = 'api',
}

export enum AuditStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
}

export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Maps to the shared `audit_logs` table (owned/migrated by apps/api).
 * Other services connect to the same database and use this entity as a
 * write-only client — they must not run schema migrations for this table.
 */
@Entity('audit_logs')
@Index(['organizationId', 'timestamp'])
@Index(['userId', 'timestamp'])
@Index(['action'])
@Index(['status'])
@Index(['severity'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ name: 'actor_id', nullable: true })
  actorId: string;

  @Column({ name: 'actor_name', nullable: true })
  actorName: string;

  @Column({ name: 'actor_email', nullable: true })
  actorEmail: string;

  @Column({ name: 'actor_type', type: 'enum', enum: AuditActorType, default: AuditActorType.USER })
  actorType: AuditActorType;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ name: 'resource_type', type: 'enum', enum: AuditResourceType })
  resourceType: AuditResourceType;

  @Column({ name: 'resource_id', nullable: true })
  resourceId: string;

  @Column({ name: 'resource_name', nullable: true })
  resourceName: string;

  @Column({ type: 'enum', enum: AuditStatus })
  status: AuditStatus;

  @Column({ type: 'enum', enum: AuditSeverity })
  severity: AuditSeverity;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  changes: Record<string, any>;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'retention_until', type: 'timestamp with time zone', nullable: true })
  retentionUntil: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
