import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('work_policies_schedule')
@Index(['organizationId'], { unique: true })
export class WorkSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  /** Active work days e.g. ["mon","tue","wed","thu","fri"] */
  @Column('simple-array', { name: 'work_days' })
  workDays: string[];

  /** Work start time in HH:mm 24-hour format e.g. "08:00" */
  @Column({ name: 'start_time' })
  startTime: string;

  /** Work end time in HH:mm 24-hour format e.g. "17:30" */
  @Column({ name: 'end_time' })
  endTime: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
