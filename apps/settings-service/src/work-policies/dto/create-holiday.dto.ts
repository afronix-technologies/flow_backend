import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Matches, MaxLength } from 'class-validator';

export class CreateHolidayDto {
  @ApiProperty({
    description: 'Display name of the holiday. Maximum 100 characters.',
    example: 'Company Foundation Day',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100, { message: 'Holiday name cannot exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'Holiday date in YYYY-MM-DD format.',
    example: '2026-03-15',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  date: string;

  @ApiProperty({
    description: 'Holiday category.',
    example: 'custom',
    enum: ['national', 'religious', 'custom'],
  })
  @IsIn(['national', 'religious', 'custom'], {
    message: 'type must be one of: national, religious, custom',
  })
  type: string;
}
