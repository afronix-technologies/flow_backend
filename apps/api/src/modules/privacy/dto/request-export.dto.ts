import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsArray, IsString } from 'class-validator';
import { ExportFormat } from '../entities/data-export-request.entity';

export class RequestExportDto {
  @ApiProperty({ enum: ExportFormat, example: ExportFormat.JSON })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiPropertyOptional({ example: ['profile', 'projects', 'tasks', 'documents'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dataCategories?: string[];
}
