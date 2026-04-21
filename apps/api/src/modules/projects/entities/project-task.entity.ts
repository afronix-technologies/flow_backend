import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Project } from './project.entity';

export enum TaskStatus {
  TODO = 'Todo',
  IN_PROGRESS = 'In Progress',
  DONE = 'Done',
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

@Entity('project_tasks')
@Index(['projectId'])
export class ProjectTask {
  @ApiProperty({ example: 'uuid-xxxx' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'uuid-xxxx' })
  @Column({ name: 'project_id' })
  projectId: string;

  @ApiProperty({ example: 'Core Architecture Review' })
  @Column()
  title: string;

  @ApiPropertyOptional({ example: 'Review the overall system architecture' })
  @Column({ nullable: true, type: 'text' })
  description: string;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.TODO })
  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
  status: TaskStatus;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.HIGH })
  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @ApiPropertyOptional({ example: 'uuid-user-xxxx' })
  @Column({ name: 'assignee_id', nullable: true })
  assigneeId: string;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @Column({ name: 'assignee_name', nullable: true })
  assigneeName: string;

  @ApiPropertyOptional({ example: '2026-05-15T12:00:00.000Z' })
  @Column({ name: 'due_date', type: 'timestamp', nullable: true })
  dueDate: Date;

  @ApiProperty({ example: '2026-04-22T10:00:00.000Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ example: '2026-04-22T10:00:00.000Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Project, (project) => project.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
