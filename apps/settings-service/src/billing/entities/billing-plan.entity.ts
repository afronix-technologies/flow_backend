import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('billing_plans')
export class BillingPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // 'Free' | 'Starter' | 'Professional' | 'Enterprise'

  @Column({ nullable: true })
  tagline: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  pricePerSeat: number;

  @Column({ type: 'numeric', precision: 5, scale: 4, default: 0 })
  annualDiscount: number; // fraction e.g. 0.20

  @Column({ nullable: true, type: 'int' })
  seatLimit: number; // null = unlimited (Enterprise)

  @Column({ type: 'simple-array', nullable: true })
  allowedConfigs: string[]; // ['time-tracking', 'project-management']

  @Column({ type: 'simple-array', nullable: true })
  highlights: string[];

  @Column({ default: 0 })
  sortOrder: number;
}
