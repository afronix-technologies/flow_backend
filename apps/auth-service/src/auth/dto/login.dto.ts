import { IsEmail, IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'user@example.com', description: 'User email' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'password123', description: 'User password' })
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiPropertyOptional({ example: 'uuid-string', description: 'Organization ID for context' })
    @IsOptional()
    @IsUUID()
    organizationId?: string;
}
