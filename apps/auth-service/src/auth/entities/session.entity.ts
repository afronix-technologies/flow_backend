import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity('auth_sessions')
@Index(['token'], { unique: true })
@Index(['userId'])
export class Session {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column()
    token: string;

    @Column({ name: 'ip_address', nullable: true })
    ipAddress: string;

    @Column({ name: 'user_agent', nullable: true })
    userAgent: string;

    @Column({ type: 'timestamp' })
    expiresAt: Date;

    @Column({ default: true })
    isValid: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
