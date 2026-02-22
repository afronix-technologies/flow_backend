import { IsOptional, IsString, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateContactSettingsDto {
  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Full name of the primary admin contact',
  })
  @IsOptional()
  @IsString()
  adminName?: string;

  @ApiPropertyOptional({ example: 'support@afronix.com', description: 'Support email address' })
  @IsOptional()
  @IsEmail()
  supportEmail?: string;

  @ApiPropertyOptional({
    example: '234',
    description: 'Country dial code for the main phone number',
  })
  @IsOptional()
  @IsString()
  phoneCountryCode?: string;

  @ApiPropertyOptional({
    example: '0192839201',
    description: 'Primary phone number (without country code)',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: '234', description: 'Country dial code for WhatsApp contact' })
  @IsOptional()
  @IsString()
  whatsappCountryCode?: string;

  @ApiPropertyOptional({
    example: '0192839201',
    description: 'WhatsApp number (without country code)',
  })
  @IsOptional()
  @IsString()
  whatsappNumber?: string;
}
