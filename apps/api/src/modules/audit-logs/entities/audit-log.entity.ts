import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

@Entity('audit_logs')
@Index(['organizationId', 'timestamp'])
@Index(['userId', 'timestamp'])
@Index(['action'])
@Index(['status'])
@Index(['severity'])
export class AuditLog {
  @ApiProperty({ example: 'uuid-xxxx' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'uuid-xxxx' })
  @Column({ name: 'organization_id' })
  organizationId: string;

  @ApiProperty({ example: 'uuid-xxxx' })
  @Column({ name: 'user_id' })
  userId: string;

  @ApiProperty({ example: '2026-04-25T10:30:00Z' })
  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @ApiPropertyOptional({ example: 'uuid-xxxx' })
  @Column({ name: 'actor_id', nullable: true })
  actorId: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @Column({ name: 'actor_name', nullable: true })
  actorName: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @Column({ name: 'actor_email', nullable: true })
  actorEmail: string;

  @ApiProperty({ enum: AuditActorType, example: AuditActorType.USER })
  @Column({ name: 'actor_type', type: 'enum', enum: AuditActorType, default: AuditActorType.USER })
  actorType: AuditActorType;

  @ApiProperty({ enum: AuditAction, example: AuditAction.CREATE })
  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @ApiProperty({ enum: AuditResourceType, example: AuditResourceType.PROJECT })
  @Column({ name: 'resource_type', type: 'enum', enum: AuditResourceType })
  resourceType: AuditResourceType;

  @ApiPropertyOptional({ example: 'uuid-xxxx' })
  @Column({ name: 'resource_id', nullable: true })
  resourceId: string;

  @ApiPropertyOptional({ example: 'Marketing Project' })
  @Column({ name: 'resource_name', nullable: true })
  resourceName: string;

  @ApiProperty({ enum: AuditStatus, example: AuditStatus.SUCCESS })
  @Column({ type: 'enum', enum: AuditStatus })
  status: AuditStatus;

  @ApiProperty({ enum: AuditSeverity, example: AuditSeverity.LOW })
  @Column({ type: 'enum', enum: AuditSeverity })
  severity: AuditSeverity;

  @ApiPropertyOptional({ example: 'Created project: Marketing Project' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiPropertyOptional({ example: { before: { name: 'Old' }, after: { name: 'New' } } })
  @Column({ type: 'jsonb', nullable: true })
  changes: Record<string, any>;

  @ApiPropertyOptional({ example: '192.168.1.1' })
  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @ApiPropertyOptional({ example: 'Mozilla/5.0...' })
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @ApiPropertyOptional({ example: { sessionId: 'uuid' } })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ApiPropertyOptional({ example: '2028-04-25T10:30:00Z' })
  @Column({ name: 'retention_until', type: 'timestamp with time zone', nullable: true })
  retentionUntil: Date;

  @ApiProperty({ example: '2026-04-25T10:30:00Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
