import { IsEmail, IsNotEmpty, IsEnum, NotEquals } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../enums/user-role.enum';

export class InviteUserDto {
    @ApiProperty({ example: 'colleague@example.com', description: 'Email to invite' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'member', description: 'Role to assign' })
    @IsNotEmpty()
    role: string;
}
