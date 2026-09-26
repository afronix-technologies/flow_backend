import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('workspace_packages')
export class WorkspacePackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string; // 'time-tracking' | 'project-management' | 'workforce'

  @Column()
  title: string;

  @Column()
  badge: string; // 'Standard' | 'Professional'

  @Column({ default: false })
  recommended: boolean;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'simple-json', nullable: true })
  perfectFor: string[]; // ["Freelancers", "Small Teams"]

  @Column({ type: 'simple-json', nullable: true })
  baseFeatures: string[]; // UI display only

  @Column({ nullable: true })
  actionText: string;
}
