import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('user_consents')
@Index(['userId', 'organizationId'], { unique: true })
export class UserConsent {
  @ApiProperty({ example: 'uuid-xxxx' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'uuid-xxxx' })
  @Column({ name: 'user_id' })
  userId: string;

  @ApiProperty({ example: 'uuid-xxxx' })
  @Column({ name: 'organization_id' })
  organizationId: string;

  @ApiProperty({ example: false })
  @Column({ default: false })
  marketing: boolean;

  @ApiProperty({ example: true })
  @Column({ default: true })
  analytics: boolean;

  @ApiProperty({ example: false })
  @Column({ name: 'third_party_sharing', default: false })
  thirdPartySharing: boolean;

  @ApiProperty({ example: true })
  @Column({ name: 'profiling_for_personalization', default: true })
  profilingForPersonalization: boolean;

  @ApiProperty({ example: '2026-04-20T10:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
