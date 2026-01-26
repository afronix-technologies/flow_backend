import {
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    VersionColumn,
    Index,
    BaseEntity
} from 'typeorm';

export abstract class SyncableEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    @Index() // Crucial for "Give me everything changed since X"
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;

    @VersionColumn()
    version: number;
}
