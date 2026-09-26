import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MemberStatus {
  ACTIVE = 'active',
  PENDING_INVITE = 'pending_invite',
  SUSPENDED = 'suspended',
}

export enum MemberGender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non-binary',
  PREFER_NOT = 'prefer-not',
}

export enum MemberRole {
  STAFF = 'staff',
  MANAGER = 'manager',
  ADMINISTRATION = 'administration',
  TEAM_LEAD = 'team-lead',
}

export interface NotificationSettings {
  taskAssignments: boolean;
  deadlineReminders: boolean;
  dailySummary: boolean;
  weeklyReport: boolean;
  teamUpdates: boolean;
}

@Entity('team_members')
@Index(['organizationId', 'email'], { unique: true })
export class TeamMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'department_id', nullable: true })
  departmentId: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'date_of_birth', nullable: true, type: 'date' })
  dateOfBirth: string;

  @Column({ type: 'enum', enum: MemberGender, nullable: true })
  gender: MemberGender;

  @Column({ nullable: true, type: 'text' })
  address: string;

  @Column({
    name: 'user_role',
    type: 'enum',
    enum: MemberRole,
    default: MemberRole.STAFF,
  })
  userRole: MemberRole;

  @Column({ name: 'project_access', nullable: true })
  projectAccess: string;

  @Column({ name: 'avatar_color', nullable: true })
  avatarColor: string;

  @Column({ type: 'jsonb', name: 'notification_settings', nullable: true })
  notificationSettings: NotificationSettings;

  @Column({
    type: 'enum',
    enum: MemberStatus,
    default: MemberStatus.PENDING_INVITE,
  })
  status: MemberStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
