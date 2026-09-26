import { Controller, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { AuthService } from '../services/auth.service';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';

@ApiTags('Organization')
@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private authService: AuthService) {}

  @Put('current')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current organization details (Onboarding)' })
  async updateCurrentOrganization(
    @CurrentUser() user: User,
    @Body() updateDto: UpdateOrganizationDto,
  ) {
    return this.authService.updateOrganization(user.organizationId, updateDto);
  }
}
