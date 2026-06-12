import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('feature_catalog')
export class FeatureCatalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column()
  package: string; // 'time_tracking' | 'project_management' | 'workforce_management'

  @Column({ default: 'standard' })
  tier: string; // 'standard' | 'professional'

  @Column({ default: true })
  isDefault: boolean;

  // Workspace config in hyphenated format used by the frontend
  @Column({ nullable: true })
  sourceConfig: string; // 'time-tracking' | 'project-management' | 'workforce'

  // Minimum billing plan required to use this feature
  @Column({ nullable: true })
  minimumPlan: string; // 'Free' | 'Starter' | 'Professional' | 'Enterprise'

  // If the feature is delivered via a feature pack, the pack's id (e.g. 'time-pack')
  @Column({ nullable: true })
  packId: string;

  @CreateDateColumn()
  createdAt: Date;
}
