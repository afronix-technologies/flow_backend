import { Controller, Post, Body, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ManualVerifyDto {
    @ApiProperty({ example: 'user@example.com', description: 'The email of the user to verify' })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}

@ApiTags('Test')
@Controller('auth/test')
export class TestVerificationController {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    @Post('verify-email')
    @ApiOperation({ summary: 'Manually verify a user email (TEST ONLY)' })
    @ApiResponse({ status: 200, description: 'User verified successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async verifyEmailManual(@Body() dto: ManualVerifyDto) {
        const user = await this.userRepository.findOne({ where: { email: dto.email } });

        if (!user) {
            throw new NotFoundException(`User with email ${dto.email} not found`);
        }

        if (user.emailVerified) {
            return { message: 'User is already verified', email: user.email };
        }

        user.emailVerified = true;
        user.emailVerificationToken = null;
        await this.userRepository.save(user);

        return { message: 'User verified successfully', email: user.email };
    }
}
