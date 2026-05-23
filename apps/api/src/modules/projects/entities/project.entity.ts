import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectTask } from './project-task.entity';

export enum ProjectCategory {
  BILLABLE = 'Billable',
  INTERNAL = 'Internal',
}

export enum ProjectStatus {
  ACTIVE = 'Active',
  ON_HOLD = 'On Hold',
  COMPLETED = 'Completed',
  ARCHIVED = 'Archived',
}

export enum ProjectHealth {
  ON_TRACK = 'On Track',
  AT_RISK = 'At Risk',
  CRITICAL = 'Critical',
}

export enum TimeEstimateUnit {
  DAYS = 'Days',
  WEEKS = 'Weeks',
  MONTHS = 'Months',
  YEARS = 'Years',
}

@Entity('projects')
@Index(['organizationId', 'projectCode'], { unique: true })
export class Project {
  @ApiProperty({ example: 'uuid-xxxx' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'uuid-xxxx' })
  @Column({ name: 'organization_id' })
  organizationId: string;

  @ApiProperty({ example: 'PROJ-001' })
  @Column({ name: 'project_code' })
  projectCode: string;

  @ApiProperty({ example: 'Website Redesign' })
  @Column()
  name: string;

  @ApiPropertyOptional({ example: 'Full redesign of the marketing site' })
  @Column({ nullable: true, type: 'text' })
  description: string;

  @ApiPropertyOptional({ example: 'Acme Corp' })
  @Column({ name: 'client_name', nullable: true })
  clientName: string;

  @ApiProperty({ enum: ProjectCategory, example: ProjectCategory.BILLABLE })
  @Column({ type: 'enum', enum: ProjectCategory, default: ProjectCategory.BILLABLE })
  category: ProjectCategory;

  @ApiProperty({ enum: ProjectStatus, example: ProjectStatus.ACTIVE })
  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  status: ProjectStatus;

  @ApiProperty({ enum: ProjectHealth, example: ProjectHealth.ON_TRACK })
  @Column({ type: 'enum', enum: ProjectHealth, default: ProjectHealth.ON_TRACK })
  health: ProjectHealth;

  @ApiProperty({ example: false })
  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @ApiPropertyOptional({ example: 3 })
  @Column({ name: 'time_estimate_amount', type: 'float', nullable: true })
  timeEstimateAmount: number;

  @ApiPropertyOptional({ enum: TimeEstimateUnit, example: TimeEstimateUnit.MONTHS })
  @Column({ name: 'time_estimate_unit', type: 'enum', enum: TimeEstimateUnit, nullable: true })
  timeEstimateUnit: TimeEstimateUnit;

  @ApiPropertyOptional({ example: 50000 })
  @Column({ type: 'float', nullable: true })
  budget: number;

  @ApiPropertyOptional({ example: 'NGN' })
  @Column({ name: 'budget_currency', nullable: true })
  budgetCurrency: string;

  @ApiProperty({ example: 45, description: 'Completion percentage (0–100)' })
  @Column({ name: 'completion_percentage', type: 'float', default: 0 })
  completionPercentage: number;

  @ApiPropertyOptional({ example: '2026-04-22T10:00:00.000Z' })
  @Column({ name: 'last_activity_at', type: 'timestamp', nullable: true })
  lastActivityAt: Date;

  @ApiProperty({ example: '2026-04-22T10:00:00.000Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-22T10:00:00.000Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ProjectTask, (task) => task.project)
  tasks: ProjectTask[];
}
