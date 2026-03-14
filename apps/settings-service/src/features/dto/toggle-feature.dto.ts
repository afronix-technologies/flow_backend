import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleFeatureDto {
  @ApiProperty({ example: true, description: 'Set to true to enable, false to disable' })
  @IsBoolean()
  enabled: boolean;
}
