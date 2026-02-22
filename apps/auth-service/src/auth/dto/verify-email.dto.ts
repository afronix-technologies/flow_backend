import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ example: 'user@example.com', description: 'The email address to verify' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456', description: 'The 6-digit verification code' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}
