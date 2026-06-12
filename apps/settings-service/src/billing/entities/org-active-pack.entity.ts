import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('org_active_packs')
@Index(['organizationId', 'packId'], { unique: true })
export class OrgActivePack {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column()
  packId: string; // FK → feature_packs.id

  @CreateDateColumn()
  activatedAt: Date;
}
