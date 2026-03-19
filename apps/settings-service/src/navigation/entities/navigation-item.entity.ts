import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('navigation_items')
export class NavigationItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  key: string;

  @Column()
  label: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  parentKey: string;

  @Column({ nullable: true })
  route: string;

  @Column({ default: 0 })
  sortOrder: number;

  /**
   * Stored as comma-separated feature keys (TypeORM simple-array).
   * Item is shown if ANY of these features is enabled for the org.
   * Null/empty means always visible.
   */
  @Column({ type: 'simple-array', nullable: true })
  requiredFeatures: string[];

  @Column({ default: false })
  adminOnly: boolean;
}
