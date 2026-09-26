import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('work_policies_break')
@Index(['organizationId'], { unique: true })
export class BreakPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  /** Whether the organisation enforces a lunch break */
  @Column({ name: 'include_lunch_break', default: false })
  includeLunchBreak: boolean;

  /** Break duration in minutes. Relevant only when includeLunchBreak is true */
  @Column({ name: 'duration_mins', nullable: true, type: 'int' })
  durationMins: number;

  /** Whether the break is paid or unpaid: "paid" | "unpaid" */
  @Column({ name: 'break_type', nullable: true })
  breakType: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
