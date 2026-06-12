import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('org_subscriptions')
@Index(['organizationId'], { unique: true })
export class OrgSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string;

  @Column({ default: 'Free' })
  planName: string; // 'Free' | 'Starter' | 'Professional' | 'Enterprise'

  @Column({ default: 'time-tracking' })
  workspaceConfig: string; // 'time-tracking' | 'project-management' | 'workforce'

  @Column({ default: 'Time Tracking' })
  workspaceLabel: string;

  @Column({ type: 'int', default: 1 })
  seatCount: number;

  @Column({ type: 'int', nullable: true, default: 3 })
  seatLimit: number; // null = unlimited

  @Column({ default: 'monthly' })
  billingCycle: string; // 'monthly' | 'annual'

  @Column({ default: 'active' })
  status: string; // 'active' | 'trialing' | 'past_due' | 'cancelled'

  @Column({ nullable: true })
  paymentMethod: string; // 'card' | 'flutterwave' | 'paystack'

  // Unique reference sent to payment provider; matched on webhook callback
  @Column({ nullable: true, unique: true })
  txRef: string;

  @Column({ nullable: true, type: 'timestamptz' })
  currentPeriodEnd: Date;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  monthlyTotal: number;

  // Resolved from the org's country at subscription time
  @Column({ default: 'USD' })
  currency: string;

  @Column({ default: '$' })
  currencySymbol: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
