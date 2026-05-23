import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsArray } from 'class-validator';

export class UpdateNavigationItemDto {
  @ApiPropertyOptional({ example: 'Reports' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ example: 'pi-chart-bar' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: 'teams' })
  @IsOptional()
  @IsString()
  parentKey?: string;

  @ApiPropertyOptional({ example: '/dashboard/reports' })
  @IsOptional()
  @IsString()
  route?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ example: ['weekly_monthly_reports'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredFeatures?: string[];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  adminOnly?: boolean;
}
