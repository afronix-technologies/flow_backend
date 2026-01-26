import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OnboardingStep } from '../entities/organization.entity';

export class UpdateOrganizationDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    industry?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    companySize?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    template?: string;

    @ApiPropertyOptional({ enum: OnboardingStep })
    @IsOptional()
    @IsEnum(OnboardingStep)
    onboardingStep?: OnboardingStep;
}
