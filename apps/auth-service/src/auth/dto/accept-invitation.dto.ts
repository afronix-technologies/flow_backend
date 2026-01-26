import { IsNotEmpty, IsString, MinLength, MaxLength, Matches, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptInvitationDto {
    @ApiProperty({ description: 'Invitation token from email' })
    @IsNotEmpty()
    @IsString()
    token: string;

    @ApiProperty({ example: 'John', description: 'First name', minLength: 2, maxLength: 50 })
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    firstName: string;

    @ApiProperty({ example: 'Doe', description: 'Last name', minLength: 2, maxLength: 50 })
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    lastName: string;

    @ApiProperty({
        example: 'P@ssw0rd123',
        description: 'New password',
        minLength: 8
    })
    @IsString()
    @MinLength(8)
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'Password must contain uppercase, lowercase, and number or special character'
    })
    password: string;
}
