import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, Max, Min, ValidateIf } from 'class-validator';

export class UpdateBreakPolicyDto {
  @ApiProperty({
    description: 'Whether the organisation enforces a lunch/break period during the work day.',
    example: true,
  })
  @IsBoolean()
  includeLunchBreak: boolean;

  @ApiPropertyOptional({
    description:
      'Break duration in minutes. Required when includeLunchBreak is true. Min 5, max 180.',
    example: 30,
    minimum: 5,
    maximum: 180,
  })
  @ValidateIf((o) => o.includeLunchBreak === true)
  @IsInt({ message: 'durationMins must be an integer' })
  @Min(5, { message: 'durationMins must be at least 5 minutes' })
  @Max(180, { message: 'durationMins cannot exceed 180 minutes' })
  durationMins?: number;

  @ApiPropertyOptional({
    description: 'Whether the break is paid or unpaid. Required when includeLunchBreak is true.',
    example: 'unpaid',
    enum: ['paid', 'unpaid'],
  })
  @ValidateIf((o) => o.includeLunchBreak === true)
  @IsIn(['paid', 'unpaid'], { message: 'breakType must be "paid" or "unpaid"' })
  breakType?: string;
}
