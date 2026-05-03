import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  EXPIRED = 'expired',
  FAILED = 'failed',
}

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
}

@Entity('data_export_requests')
@Index(['userId'])
@Index(['status'])
export class DataExportRequest {
  @ApiProperty({ example: 'uuid-xxxx' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'uuid-xxxx' })
  @Column({ name: 'organization_id' })
  organizationId: string;

  @ApiProperty({ example: 'uuid-xxxx' })
  @Column({ name: 'user_id' })
  userId: string;

  @ApiProperty({ enum: ExportStatus, example: ExportStatus.PENDING })
  @Column({ type: 'enum', enum: ExportStatus, default: ExportStatus.PENDING })
  status: ExportStatus;

  @ApiPropertyOptional({ example: '2026-04-26T10:30:00Z' })
  @Column({ name: 'started_at', type: 'timestamp with time zone', nullable: true })
  startedAt: Date;

  @ApiPropertyOptional({ example: '2026-04-26T10:31:00Z' })
  @Column({ name: 'completed_at', type: 'timestamp with time zone', nullable: true })
  completedAt: Date;

  @ApiPropertyOptional({ example: '2026-04-27T10:31:00Z' })
  @Column({ name: 'expires_at', type: 'timestamp with time zone', nullable: true })
  expiresAt: Date;

  @ApiPropertyOptional({ example: 'https://storage.example.com/exports/uuid.json' })
  @Column({ name: 'download_url', type: 'text', nullable: true })
  downloadUrl: string;

  @ApiPropertyOptional({ example: 1024000 })
  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize: number;

  @ApiPropertyOptional({ example: ['profile', 'projects', 'tasks'] })
  @Column({ name: 'data_included', type: 'simple-array', nullable: true })
  dataIncluded: string[];

  @ApiProperty({ enum: ExportFormat, example: ExportFormat.JSON })
  @Column({ type: 'enum', enum: ExportFormat, default: ExportFormat.JSON })
  format: ExportFormat;

  @ApiPropertyOptional({ example: 'Personal backup' })
  @Column({ name: 'request_reason', type: 'text', nullable: true })
  requestReason: string;

  @ApiPropertyOptional({ example: '192.168.1.1' })
  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @ApiProperty({ example: '2026-04-25T10:30:00Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-25T10:30:00Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
