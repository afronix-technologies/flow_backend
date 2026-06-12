import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateGeneralSettingsDto {
  @ApiPropertyOptional({
    description: 'Public URL of the company logo (uploaded via file-service)',
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'Wazi Inc.', description: 'Legal / registered company name' })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional({ example: 'CEO', description: 'Role of the primary contact' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ example: 'Manufacturing', description: 'Company industry' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ example: '10-20', description: 'Company size range' })
  @IsOptional()
  @IsString()
  companySize?: string;

  @ApiPropertyOptional({ example: 'NG', description: 'ISO 3166-1 alpha-2 country code, or "OTHER"' })
  @IsOptional()
  @IsString()
  country?: string;
}
