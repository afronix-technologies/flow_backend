import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { UsersService } from '../services/users.service';
import { AuthService } from '../services/auth.service';

@ApiTags('Auth')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
    constructor(
        private usersService: UsersService,
        private authService: AuthService
    ) { }

    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    async getProfile(@CurrentUser() user: User) {
        return this.usersService.findOne(user.id);
    }

    @Put('me')
    @ApiOperation({ summary: 'Update user profile' })
    async updateProfile(@CurrentUser() user: User, @Body() body: { firstName?: string, lastName?: string }) {
        return this.usersService.update(user.id, body);
    }

    @Put('me/password')
    @ApiOperation({ summary: 'Change password' })
    async changePassword(@CurrentUser() user: User, @Body() body: { currentPassword: string, newPassword: string }) {
        return this.usersService.changePassword(user.id, body.currentPassword, body.newPassword);
    }

    @Get('organizations')
    @ApiOperation({ summary: 'List user organizations' })
    async getOrganizations(@CurrentUser() user: User) {
        return this.usersService.getOrganizations(user.id);
    }

    @Post('switch-organization')
    @ApiOperation({ summary: 'Switch organization context' })
    async switchOrganization(@CurrentUser() user: User, @Body() body: { organizationId: string }) {
        return this.authService.switchOrganization(user.id, body.organizationId);
    }
}
