import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import {
  ProjectCategory,
  ProjectStatus,
  ProjectHealth,
  TimeEstimateUnit,
} from '../entities/project.entity';

export class CreateProjectDto {
  @ApiProperty({ example: 'PROJ-001' })
  @IsString()
  @IsNotEmpty()
  projectCode: string;

  @ApiProperty({ example: 'Website Redesign' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsString()
  @IsOptional()
  clientName?: string;

  @ApiProperty({ enum: ProjectCategory })
  @IsEnum(ProjectCategory)
  category: ProjectCategory;

  @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiPropertyOptional({ enum: ProjectHealth, default: ProjectHealth.ON_TRACK })
  @IsEnum(ProjectHealth)
  @IsOptional()
  health?: ProjectHealth;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  timeEstimateAmount?: number;

  @ApiPropertyOptional({ enum: TimeEstimateUnit })
  @IsEnum(TimeEstimateUnit)
  @IsOptional()
  timeEstimateUnit?: TimeEstimateUnit;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  budget?: number;

  @ApiPropertyOptional({ example: 'NGN' })
  @IsString()
  @IsOptional()
  budgetCurrency?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
