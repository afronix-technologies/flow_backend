import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('organization_features')
@Index(['organizationId', 'featureKey'], { unique: true })
export class OrganizationFeature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column()
  featureKey: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  enabledAt: Date;

  @Column({ nullable: true })
  enabledBy: string; // userId of admin who enabled it

  @CreateDateColumn()
  createdAt: Date;
}
