import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  ArrayMinSize,
  IsIn,
  IsString,
  Matches,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

const VALID_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

function IsEndTimeAfterStartTime(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isEndTimeAfterStartTime',
      target: (object as any).constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          if (!value || !obj.startTime) return true;
          return value > obj.startTime;
        },
        defaultMessage() {
          return 'endTime must be after startTime';
        },
      },
    });
  };
}

export class UpdateWorkScheduleDto {
  @ApiProperty({
    description: 'Active work days for the organisation. At least one day required.',
    example: ['mon', 'tue', 'wed', 'thu', 'fri'],
    enum: VALID_DAYS,
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one work day is required' })
  @IsIn(VALID_DAYS, {
    each: true,
    message: 'Each work day must be one of: mon, tue, wed, thu, fri, sat, sun',
  })
  workDays: string[];

  @ApiProperty({
    description: 'Work start time in HH:mm 24-hour format',
    example: '08:00',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime must be in HH:mm format (e.g. 08:00)',
  })
  startTime: string;

  @ApiProperty({
    description: 'Work end time in HH:mm 24-hour format. Must be after startTime.',
    example: '17:30',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'endTime must be in HH:mm format (e.g. 17:30)' })
  @IsEndTimeAfterStartTime()
  endTime: string;
}
