import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany } from 'typeorm';
import { Role } from './role.entity';

@Entity('auth_permissions')
export class Permission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    code: string;  // e.g., 'users.create', 'departments.delete'

    @Column()
    module: string;  // e.g., 'users', 'departments', 'projects'

    @Column()
    action: string;  // e.g., 'create', 'read', 'update', 'delete', 'manage'

    @Column({ nullable: true })
    description: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @ManyToMany(() => Role, role => role.permissions)
    roles: Role[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
