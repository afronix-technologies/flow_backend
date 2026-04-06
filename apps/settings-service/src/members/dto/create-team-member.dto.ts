import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsOptional,
  IsBoolean,
  MinLength,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MemberGender, MemberRole } from '../entities/team-member.entity';

class NotificationSettingsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  taskAssignments: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  deadlineReminders: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  dailySummary: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  weeklyReport: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  teamUpdates: boolean;
}

export class CreateTeamMemberDto {
  @ApiProperty({ example: 'John Ossai', description: 'Full name (min 2 chars)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ example: '+234192090190922', description: 'Phone number (min 6 chars)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  phone: string;

  @ApiProperty({ example: 'john@afronix.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '1996-03-12', description: 'YYYY-MM-DD' })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiProperty({ enum: MemberGender, example: MemberGender.MALE })
  @IsEnum(MemberGender)
  gender: MemberGender;

  @ApiPropertyOptional({ example: '12 Admiralty Way, Lekki, Lagos' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 'dept-uuid-here',
    description: 'Optional — if provided must belong to the same org',
  })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({ enum: MemberRole, example: MemberRole.MANAGER })
  @IsEnum(MemberRole)
  userRole: MemberRole;

  @ApiPropertyOptional({ example: 'google-marketing-development' })
  @IsOptional()
  @IsString()
  projectAccess?: string;

  @ApiProperty({ type: NotificationSettingsDto })
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notificationSettings: NotificationSettingsDto;
}
