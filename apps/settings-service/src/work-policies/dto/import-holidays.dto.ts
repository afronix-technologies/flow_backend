import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, Length, Matches, Max, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ImportHolidaysDto {
  @ApiProperty({
    description:
      'ISO 3166-1 alpha-2 country code (2 uppercase letters). ' +
      'Supports 100+ countries worldwide. Examples: US, GB, NG, GH, KE, ZA, DE, FR, IN, AU.',
    example: 'NG',
    minLength: 2,
    maxLength: 2,
  })
  @IsString()
  @Length(2, 2, { message: 'country must be a 2-letter ISO country code (e.g. US, GB, NG)' })
  @Matches(/^[A-Z]{2}$/, { message: 'country must be 2 uppercase letters (e.g. US, GB, NG)' })
  country: string;

  @ApiPropertyOptional({
    description: 'Year to import holidays for. Defaults to the current year.',
    example: 2026,
    minimum: 2020,
    maximum: 2030,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2030)
  year?: number;
}
