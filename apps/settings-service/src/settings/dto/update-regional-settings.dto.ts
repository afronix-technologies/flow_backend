import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRegionalSettingsDto {
  @ApiPropertyOptional({
    example: 'Africa/Lagos',
    description: 'IANA timezone identifier, e.g. "Africa/Lagos" or "Europe/London"',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    example: 'NGN',
    description: 'ISO 4217 currency code, e.g. "NGN", "USD", "GBP"',
  })
  @IsOptional()
  @IsString()
  baseCurrency?: string;

  @ApiPropertyOptional({
    example: 'DD/MM/YY',
    description: 'Date format string, e.g. "DD/MM/YY", "MM/DD/YYYY", "YYYY-MM-DD"',
  })
  @IsOptional()
  @IsString()
  dateFormat?: string;

  @ApiPropertyOptional({
    example: 'en',
    description: 'Interface language code, e.g. "en", "fr", "ar"',
  })
  @IsOptional()
  @IsString()
  language?: string;
}
