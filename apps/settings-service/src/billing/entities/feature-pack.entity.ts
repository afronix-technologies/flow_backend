import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('feature_packs')
export class FeaturePack {
  @PrimaryColumn()
  id: string; // slug e.g. 'time-pack'

  @Column()
  name: string;

  @Column()
  sourceConfig: string; // 'time-tracking' | 'project-management' | 'workforce'

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  features: string[]; // feature keys

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  pricePerSeat: number;

  @Column({ default: 'Professional' })
  minimumPlan: string; // 'Starter' | 'Professional' | 'Enterprise'
}
