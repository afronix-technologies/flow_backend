import { IsEmail, IsNotEmpty, IsString, MinLength, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'user@example.com', description: 'User email address' })
    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty()
    email: string;

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
        description: 'Password (min 8 chars, uppercase, lowercase, number/special)',
        minLength: 8
    })
    @IsString()
    @MinLength(8)
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'Password must contain uppercase, lowercase, and number or special character'
    })
    password: string;

    @ApiProperty({ example: 'Acme Corp', description: 'Organization name' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    organizationName: string;
}
