import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('work_policies_holidays')
@Index(['organizationId', 'date'])
export class OrgHoliday {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  /** Display name of the holiday e.g. "New Year's Day" */
  @Column({ length: 100 })
  name: string;

  /** Holiday date in YYYY-MM-DD format */
  @Column({ type: 'date' })
  date: string;

  /** Holiday category: "national" | "religious" | "custom" */
  @Column({ length: 20 })
  type: string;

  /** Whether this holiday is currently active for the organisation */
  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
