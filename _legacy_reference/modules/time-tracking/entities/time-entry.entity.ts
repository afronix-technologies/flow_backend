import { Entity, Column, ManyToOne } from 'typeorm';
import { SyncableEntity } from '../../../common/entities/syncable.entity';
import { Project } from '../../projects/entities/project.entity';
import { Task } from '../../projects/entities/task.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('time_entries')
export class TimeEntry extends SyncableEntity {
    @Column({ type: 'timestamp' })
    startTime: Date;

    @Column({ type: 'timestamp', nullable: true })
    endTime: Date;

    @Column({ nullable: true })
    description: string;

    @Column({ default: false })
    billable: boolean;

    @ManyToOne(() => Project)
    project: Project;

    @Column({ nullable: true })
    projectId: string;

    @ManyToOne(() => Task)
    task: Task;

    @Column({ nullable: true })
    taskId: string;

    @ManyToOne(() => User)
    user: User;

    @Column()
    userId: string;
}
