import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string; // Stored filename (uuid_originalname.ext)

  @Column()
  originalName: string; // Original uploaded filename

  @Column()
  mimeType: string;

  @Column('bigint')
  size: number; // File size in bytes

  @Column()
  path: string; // Relative path: YYYY/MM/DD/filename

  @Column({ type: 'text', nullable: true })
  metadata: string; // JSON string for custom metadata

  @CreateDateColumn()
  uploadedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date; // Soft delete support
}
