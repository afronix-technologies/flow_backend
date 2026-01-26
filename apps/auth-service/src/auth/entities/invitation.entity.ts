import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { Role } from './role.entity';

export enum InvitationStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    EXPIRED = 'expired',
    CANCELLED = 'cancelled'
}

@Entity('auth_invitations')
export class Invitation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'organization_id' })
    organizationId: string;

    @ManyToOne(() => Organization, org => org.invitations, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @Column({ name: 'invited_by_user_id' })
    invitedByUserId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'invited_by_user_id' })
    invitedBy: User;

    @Column()
    email: string;

    @ManyToOne(() => Role)
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @Column({ name: 'role_id' })
    roleId: string;

    @Column()
    token: string;

    @Column({
        type: 'enum',
        enum: InvitationStatus,
        default: InvitationStatus.PENDING
    })
    status: InvitationStatus;

    @Column({ name: 'expires_at', type: 'timestamp' })
    expiresAt: Date;

    @Column({ name: 'accepted_at', type: 'timestamp', nullable: true })
    acceptedAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
