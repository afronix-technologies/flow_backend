import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('settings_general')
@Index(['organizationId'], { unique: true })
export class GeneralSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Links this record to an org from the auth-service */
  @Column({ name: 'organization_id' })
  organizationId: string;

  /** URL of the uploaded company logo (stored via file-service) */
  @Column({ name: 'logo_url', nullable: true })
  logoUrl: string;

  /** Legal / registered company name */
  @Column({ name: 'legal_name', nullable: true })
  legalName: string;

  /** Role of the primary contact within the company */
  @Column({ nullable: true })
  role: string;

  /** e.g. "Manufacturing", "Healthcare", "Finance" */
  @Column({ nullable: true })
  industry: string;

  /** e.g. "10-20", "50-100", "500+" */
  @Column({ name: 'company_size', nullable: true })
  companySize: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
