import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('navigation_role_overrides')
@Index(['navigationKey', 'role'], { unique: true })
export class NavigationRoleOverride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  navigationKey: string;

  @Column()
  role: string; // 'admin' | 'manager' | 'member'

  @Column({ nullable: true })
  labelOverride: string;

  @Column({ default: false })
  hidden: boolean;
}
