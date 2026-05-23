import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum IntegrationAccessLevel {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
}

@Entity('third_party_integrations')
@Index(['userId'])
export class ThirdPartyIntegration {
  @ApiProperty({ example: 'uuid-xxxx' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'uuid-xxxx' })
  @Column({ name: 'organization_id' })
  organizationId: string;

  @ApiProperty({ example: 'uuid-xxxx' })
  @Column({ name: 'user_id' })
  userId: string;

  @ApiProperty({ example: 'slack-workspace' })
  @Column({ name: 'app_id' })
  appId: string;

  @ApiProperty({ example: 'Slack Integration' })
  @Column({ name: 'app_name' })
  appName: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @Column({ name: 'app_logo', type: 'text', nullable: true })
  appLogo: string;

  @ApiProperty({ enum: IntegrationAccessLevel, example: IntegrationAccessLevel.READ })
  @Column({ name: 'access_level', type: 'enum', enum: IntegrationAccessLevel })
  accessLevel: IntegrationAccessLevel;

  @ApiPropertyOptional({ example: ['users.read', 'projects.read'] })
  @Column({ type: 'simple-array', nullable: true })
  scope: string[];

  @ApiProperty({ example: '2026-03-15T10:00:00Z' })
  @Column({
    name: 'authorized_at',
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  authorizedAt: Date;

  @ApiPropertyOptional({ example: '2026-04-25T09:00:00Z' })
  @Column({ name: 'last_accessed_at', type: 'timestamp with time zone', nullable: true })
  lastAccessedAt: Date;

  @ApiPropertyOptional()
  @Column({ name: 'expires_at', type: 'timestamp with time zone', nullable: true })
  expiresAt: Date;

  @ApiPropertyOptional()
  @Column({ name: 'revoked_at', type: 'timestamp with time zone', nullable: true })
  revokedAt: Date;

  // Stored encrypted — never expose in API responses
  @Column({ name: 'oauth_token', type: 'text' })
  oauthToken: string;

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken: string;

  @ApiPropertyOptional({ example: {} })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ApiProperty({ example: '2026-03-15T10:00:00Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-15T10:00:00Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
