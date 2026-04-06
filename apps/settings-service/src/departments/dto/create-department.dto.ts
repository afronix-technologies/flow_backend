import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, IsOptional, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Engineering', description: 'Department name (min 2 chars, unique per org)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'user-uuid-here', description: 'UUID of the user to assign as department manager' })
  @IsString()
  @IsNotEmpty()
  managerId: string;

  @ApiPropertyOptional({
    example: 'Builds and maintains the core product.',
    description: 'Optional department description (max 500 chars)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
