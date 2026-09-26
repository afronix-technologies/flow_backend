import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, Max, Min, ValidateIf } from 'class-validator';

export class UpdateOvertimePolicyDto {
  @ApiProperty({
    description: 'Whether overtime tracking is active for this organisation.',
    example: true,
  })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({
    description: 'Whether overtime hours require manager approval before being counted.',
    example: false,
  })
  @IsBoolean()
  requireApproval: boolean;

  @ApiPropertyOptional({
    description:
      'Hours per week after which overtime kicks in. Required when enabled is true. Min 1, max 168.',
    example: 40,
    minimum: 1,
    maximum: 168,
  })
  @ValidateIf((o) => o.enabled === true)
  @IsNumber({}, { message: 'weeklyThresholdHrs must be a number' })
  @Min(1, { message: 'weeklyThresholdHrs must be at least 1' })
  @Max(168, { message: 'weeklyThresholdHrs cannot exceed 168 (total hours in a week)' })
  weeklyThresholdHrs?: number;

  @ApiPropertyOptional({
    description:
      'Pay rate multiplier for overtime hours. Required when enabled is true. Min 1.0, max 5.0. E.g. 1.5 = time-and-a-half.',
    example: 1.5,
    minimum: 1.0,
    maximum: 5.0,
  })
  @ValidateIf((o) => o.enabled === true)
  @IsNumber({}, { message: 'rateMultiplier must be a number' })
  @Min(1.0, { message: 'rateMultiplier must be at least 1.0' })
  @Max(5.0, { message: 'rateMultiplier cannot exceed 5.0' })
  rateMultiplier?: number;
}
