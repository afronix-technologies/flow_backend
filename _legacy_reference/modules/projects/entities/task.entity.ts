import { Entity, Column, ManyToOne } from 'typeorm';
import { SyncableEntity } from '../../../common/entities/syncable.entity';
import { Project } from './project.entity';

@Entity('tasks')
export class Task extends SyncableEntity {
    @Column()
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ default: false })
    isCompleted: boolean;

    @ManyToOne(() => Project, project => project.tasks)
    project: Project;

    @Column()
    projectId: string;
}
