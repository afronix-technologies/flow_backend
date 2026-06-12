import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ManagePackDto {
  @ApiProperty({ enum: ['add', 'remove'] })
  @IsEnum(['add', 'remove'])
  action: 'add' | 'remove';
}
