import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, Index } from 'typeorm';

@Entity('organization_workspaces')
@Index(['organizationId'], { unique: true })
export class OrganizationWorkspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column()
  packageKey: string; // FK → workspace_packages.key

  @Column({ default: 'pending' })
  setupStatus: string; // 'pending' | 'setting_up' | 'ready'

  @UpdateDateColumn()
  updatedAt: Date;
}
