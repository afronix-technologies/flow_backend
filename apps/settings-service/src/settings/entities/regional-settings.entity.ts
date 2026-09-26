import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('settings_regional')
@Index(['organizationId'], { unique: true })
export class RegionalSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  /**
   * IANA timezone identifier, e.g. "Africa/Lagos"
   * Maps to UI label "West Africa Time - Lagos (GMT +01:00)"
   */
  @Column({ nullable: true, default: 'Africa/Lagos' })
  timezone: string;

  /**
   * ISO 4217 currency code, e.g. "NGN"
   * UI shows "NGN-Nigeria Naira (₦)"
   */
  @Column({ name: 'base_currency', nullable: true, default: 'NGN' })
  baseCurrency: string;

  /**
   * Date format string, e.g. "DD/MM/YY"
   * UI shows "DD/MM/YY (31/01/2024)"
   */
  @Column({ name: 'date_format', nullable: true, default: 'DD/MM/YY' })
  dateFormat: string;

  /**
   * Interface display language, e.g. "en"
   * UI shows "English"
   */
  @Column({ nullable: true, default: 'en' })
  language: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
