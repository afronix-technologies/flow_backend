import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { SyncableEntity } from '../../../common/entities/syncable.entity';
import { Client } from '../../clients/entities/client.entity';
import { Task } from './task.entity';

@Entity('projects')
export class Project extends SyncableEntity {
    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    status: string; // e.g., 'active', 'completed', 'archived'

    @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
    budget: number;

    @ManyToOne(() => Client, client => client.projects)
    client: Client;

    @Column({ nullable: true })
    clientId: string;

    @OneToMany(() => Task, task => task.project)
    tasks: Task[];
}
