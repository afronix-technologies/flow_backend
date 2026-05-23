import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AccessType {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
}

export enum AccessStatus {
  SUCCESS = 'success',
  DENIED = 'denied',
}

@Entity('data_access_logs')
@Index(['userId', 'timestamp'])
@Index(['accessedBy'])
export class DataAccessLog {
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

  @ApiPropertyOptional({ example: 'user-uuid or system or integration-uuid' })
  @Column({ name: 'accessed_by', nullable: true })
  accessedBy: string;

  @ApiProperty({ enum: AccessType, example: AccessType.READ })
  @Column({ name: 'access_type', type: 'enum', enum: AccessType })
  accessType: AccessType;

  @ApiPropertyOptional({ example: 'projects' })
  @Column({ name: 'data_category', nullable: true })
  dataCategory: string;

  @ApiPropertyOptional({ example: 'Analytics Integrator' })
  @Column({ name: 'application_name', nullable: true })
  applicationName: string;

  @ApiPropertyOptional({ example: '192.168.1.1' })
  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @ApiProperty({ enum: AccessStatus, example: AccessStatus.SUCCESS })
  @Column({ type: 'enum', enum: AccessStatus, default: AccessStatus.SUCCESS })
  status: AccessStatus;

  @ApiPropertyOptional({ example: 'Routine analytics sync' })
  @Column({ type: 'text', nullable: true })
  reason: string;

  @ApiPropertyOptional({ example: ['name', 'budget', 'status'] })
  @Column({ name: 'changed_fields', type: 'simple-array', nullable: true })
  changedFields: string[];

  @ApiProperty({ example: '2026-04-25T10:30:00Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
