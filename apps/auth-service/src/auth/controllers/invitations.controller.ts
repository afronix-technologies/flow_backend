import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';
import { AuthService } from '../services/auth.service';
import { InviteUserDto } from '../dto/invite-user.dto';
import { BulkInviteDto } from '../dto/bulk-invite.dto';
import { AcceptInvitationDto } from '../dto/accept-invitation.dto';

@ApiTags('Auth')
@Controller('invitations')
export class InvitationsController {
  constructor(private authService: AuthService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invite user to organization' })
  async inviteUser(@CurrentUser() user: User, @Body() inviteDto: InviteUserDto) {
    return this.authService.inviteUser(user.id, inviteDto);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk invite users' })
  async bulkInvite(@CurrentUser() user: User, @Body() bulkInviteDto: BulkInviteDto) {
    return this.authService.bulkInvite(user.id, bulkInviteDto);
  }

  @Post('accept')
  @ApiOperation({ summary: 'Accept invitation (Public)' })
  async acceptInvitation(@Body() acceptDto: AcceptInvitationDto) {
    return this.authService.acceptInvitation(acceptDto);
  }

  // --- Shareable Link Endpoints ---

  @Post('link/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate or refresh organization join link' })
  async generateJoinLink(@CurrentUser() user: User) {
    return this.authService.generateJoinLink(user.id);
  }

  @Get('link/:token')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Validate join link' })
  async validateJoinLink(@Param('token') token: string) {
    return this.authService.validateJoinLink(token);
  }

  @Post('link/:token/join')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Join organization via link' })
  async joinViaLink(
    @Param('token') token: string,
    @Body() body: { email: string; password?: string; firstName: string; lastName: string },
  ) {
    return this.authService.joinViaLink(token, body);
  }
}
