import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetupWorkspaceDto {
  @ApiProperty({
    description: 'The workspace package key to activate',
    enum: ['time-tracking', 'project-management', 'workforce'],
    example: 'project-management',
  })
  @IsString()
  @IsIn(['time-tracking', 'project-management', 'workforce'])
  packageKey: string;
}
