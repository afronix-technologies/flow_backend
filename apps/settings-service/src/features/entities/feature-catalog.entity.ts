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

  @CreateDateColumn()
  createdAt: Date;
}
