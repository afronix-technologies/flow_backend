import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('work_policies_overtime')
@Index(['organizationId'], { unique: true })
export class OvertimePolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  /** Whether overtime tracking is active for this organisation */
  @Column({ default: false })
  enabled: boolean;

  /** Whether overtime hours require manager approval before being counted */
  @Column({ name: 'require_approval', default: false })
  requireApproval: boolean;

  /** Weekly hours threshold after which overtime kicks in e.g. 40 */
  @Column({ name: 'weekly_threshold_hrs', type: 'float', nullable: true })
  weeklyThresholdHrs: number;

  /** Pay rate multiplier for overtime hours e.g. 1.5 = time-and-a-half */
  @Column({ name: 'rate_multiplier', type: 'float', nullable: true })
  rateMultiplier: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
