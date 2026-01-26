import { IsArray, ValidateNested, IsEmail, IsNotEmpty, IsEnum, NotEquals } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../enums/user-role.enum';

export class InviteItemDto {
    @ApiProperty({ example: 'colleague@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'member', description: 'Role to assign' })
    @IsNotEmpty()
    role: string;
}

export class BulkInviteDto {
    @ApiProperty({ type: [InviteItemDto], description: 'List of users to invite' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InviteItemDto)
    invitations: InviteItemDto[];
}
