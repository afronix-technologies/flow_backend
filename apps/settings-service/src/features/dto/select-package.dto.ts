import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SelectPackageDto {
  @ApiProperty({
    example: 'project_management',
    enum: ['time_tracking', 'project_management', 'workforce_management'],
    description: 'The feature package to activate for this organisation',
  })
  @IsIn(['time_tracking', 'project_management', 'workforce_management'])
  package: string;
}
