import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('organization_workspaces')
export class OrganizationWorkspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column({ nullable: true })
  packageKey: string;
}
