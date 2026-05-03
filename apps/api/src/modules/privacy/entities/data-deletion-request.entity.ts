import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DeletionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('data_deletion_requests')
@Index(['userId'])
@Index(['status'])
@Index(['confirmationToken'], { unique: true, where: '"confirmation_token" IS NOT NULL' })
export class DataDeletionRequest {
  @ApiProperty({ example: 'uuid-xxxx' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'uuid-xxxx' })
  @Column({ name: 'organization_id' })
  organizationId: string;

  @ApiProperty({ example: 'uuid-xxxx' })
  @Column({ name: 'user_id' })
  userId: string;

  @ApiProperty({ enum: DeletionStatus, example: DeletionStatus.PENDING })
  @Column({ type: 'enum', enum: DeletionStatus, default: DeletionStatus.PENDING })
  status: DeletionStatus;

  @ApiPropertyOptional()
  @Column({ name: 'started_at', type: 'timestamp with time zone', nullable: true })
  startedAt: Date;

  @ApiPropertyOptional()
  @Column({ name: 'completed_at', type: 'timestamp with time zone', nullable: true })
  completedAt: Date;

  @ApiPropertyOptional({ example: 'abc123...' })
  @Column({ name: 'confirmation_token', nullable: true })
  confirmationToken: string;

  @ApiPropertyOptional()
  @Column({ name: 'confirmation_expires_at', type: 'timestamp with time zone', nullable: true })
  confirmationExpiresAt: Date;

  @ApiProperty({ example: false })
  @Column({ name: 'is_confirmed', default: false })
  isConfirmed: boolean;

  @ApiPropertyOptional()
  @Column({ name: 'data_deleted_at', type: 'timestamp with time zone', nullable: true })
  dataDeletedAt: Date;

  @ApiPropertyOptional({ example: { userProfiles: 1, projects: 5, tasks: 47 } })
  @Column({ name: 'deleted_records', type: 'jsonb', nullable: true })
  deletedRecords: Record<string, number>;

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
