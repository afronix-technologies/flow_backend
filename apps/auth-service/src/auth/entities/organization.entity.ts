import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Invitation } from './invitation.entity';
import { UserOrganization } from './user-organization.entity';

export enum OnboardingStep {
  REGISTERED = 'registered',
  EMAIL_VERIFIED = 'email_verified',
  TEAM_DETAILS = 'team_details',
  TEMPLATE_SELECTED = 'template_selected',
  COMPLETED = 'completed',
}

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true, unique: true })
  domain: string;

  @Column({ nullable: true })
  industry: string;

  @Column({ name: 'company_size', nullable: true })
  companySize: string;

  @Column({ nullable: true })
  timezone: string;

  @Column({ name: 'team_size', default: 0 })
  teamSize: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Onboarding Wizard Progress
  @Column({
    type: 'enum',
    enum: OnboardingStep,
    default: OnboardingStep.REGISTERED,
    name: 'onboarding_step',
  })
  onboardingStep: OnboardingStep;

  @Column({ nullable: true })
  template: string;

  // Shareable Join Link
  @Column({ name: 'join_link_token', nullable: true, unique: true })
  joinLinkToken: string;

  @Column({ name: 'join_link_expires_at', type: 'timestamp', nullable: true })
  joinLinkExpiresAt: Date;

  @Column({ name: 'join_link_enabled', default: false })
  joinLinkEnabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @OneToMany(() => Invitation, (invitation) => invitation.organization)
  invitations: Invitation[];

  @OneToMany(() => UserOrganization, (userOrg) => userOrg.organization)
  userOrganizations: UserOrganization[];
}
