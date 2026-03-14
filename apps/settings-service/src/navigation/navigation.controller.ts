import { Controller, Get, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NavigationService } from './navigation.service';
import { JwtAuthGuard } from '../settings/guards/jwt-auth.guard';

@ApiTags('Navigation')
@Controller('navigation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  /**
   * GET /api/v1/navigation/sidebar
   * Returns the sidebar navigation tree for the authenticated user.
   */
  @Get('sidebar')
  @ApiOperation({
    summary:
      'Get the sidebar navigation tree for the authenticated user based on their org features and role',
  })
  async getSidebar(@Request() req: any) {
    const { organizationId, role } = req.user;

    if (!organizationId) {
      throw new ForbiddenException('User is not part of any organization');
    }

    return this.navigationService.getSidebarNavigation(organizationId, role);
  }
}
