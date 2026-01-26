import { Entity, Column, OneToMany } from 'typeorm';
import { SyncableEntity } from '../../../common/entities/syncable.entity';
import { Project } from '../../projects/entities/project.entity';

@Entity('clients')
export class Client extends SyncableEntity {
    @Column()
    name: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    address: string;

    @OneToMany(() => Project, project => project.client)
    projects: Project[];
}
