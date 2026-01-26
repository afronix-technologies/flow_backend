import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Permission } from './permission.entity';

@Entity('auth_roles')
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;  // e.g., 'admin', 'hr', 'management', 'member'

    @Column({ name: 'display_name', nullable: true })
    displayName: string;  // e.g., 'Admin', 'HR', 'Management', 'Member'

    @Column({ nullable: true })
    description: string;

    @Column({ name: 'is_default', default: false })
    isDefault: boolean;  // True for 'member' - auto-assigned to new invited users

    @Column({ name: 'is_system_role', default: false })
    isSystemRole: boolean;  // True for 'admin' - cannot be deleted

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @ManyToMany(() => Permission, permission => permission.roles, { eager: true })
    @JoinTable({
        name: 'role_permissions',
        joinColumn: { name: 'role_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' }
    })
    permissions: Permission[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Helper method to check if role has a specific permission
    hasPermission(permissionCode: string): boolean {
        if (!this.permissions) return false;
        // Admin with '*' permission has access to everything
        return this.permissions.some(p => p.code === '*' || p.code === permissionCode);
    }
}
