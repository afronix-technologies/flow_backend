import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class UpsertNavigationOverrideDto {
  @ApiProperty({ example: 'admin', enum: ['admin', 'manager', 'member'] })
  @IsString()
  @IsIn(['admin', 'manager', 'member'])
  role: string;

  @ApiPropertyOptional({ example: 'My Tasks' })
  @IsOptional()
  @IsString()
  labelOverride?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hidden?: boolean;
}
