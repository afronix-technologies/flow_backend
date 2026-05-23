import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { NavigationService } from './navigation.service';
import { JwtAuthGuard } from '../settings/guards/jwt-auth.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { SystemKeyGuard } from './guards/system-key.guard';
import { CreateNavigationItemDto } from './dto/create-navigation-item.dto';
import { UpdateNavigationItemDto } from './dto/update-navigation-item.dto';
import { UpsertNavigationOverrideDto } from './dto/upsert-navigation-override.dto';

@ApiTags('Navigation')
@Controller('navigation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  // ─── Sidebar (all authenticated users) ───────────────────────────────────

  @Get('sidebar')
  @ApiOperation({ summary: 'Get the sidebar navigation tree for the authenticated user' })
  async getSidebar(@Request() req: any): Promise<any> {
    const { organizationId, role } = req.user;
    if (!organizationId) throw new ForbiddenException('User is not part of any organization');
    return this.navigationService.getSidebarNavigation(organizationId, role);
  }

  // ─── Navigation Items (super_admin only) ─────────────────────────────────

  @Get('items')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: '[SYSTEM] List all navigation items (including inactive)' })
  @ApiResponse({ status: 200, description: 'All navigation items returned' })
  getAllItems() {
    return this.navigationService.getAllItems();
  }

  @Get('items/:id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: '[SYSTEM] Get a single navigation item by id' })
  @ApiResponse({ status: 200, description: 'Navigation item returned' })
  @ApiResponse({ status: 404, description: 'Not found' })
  getItemById(@Param('id') id: string) {
    return this.navigationService.getItemById(id);
  }

  @Post('items')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: '[SYSTEM] Create a new navigation item' })
  @ApiResponse({ status: 201, description: 'Navigation item created' })
  @ApiResponse({ status: 409, description: 'Key already exists' })
  createItem(@Body() dto: CreateNavigationItemDto) {
    return this.navigationService.createItem(dto);
  }

  @Patch('items/:id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: '[SYSTEM] Update a navigation item' })
  @ApiResponse({ status: 200, description: 'Navigation item updated' })
  @ApiResponse({ status: 404, description: 'Not found' })
  updateItem(@Param('id') id: string, @Body() dto: UpdateNavigationItemDto) {
    return this.navigationService.updateItem(id, dto);
  }

  @Delete('items/:id')
  @UseGuards(SuperAdminGuard, SystemKeyGuard)
  @ApiOperation({ summary: '[SYSTEM] Soft-delete (deactivate) a navigation item' })
  @ApiHeader({ name: 'x-system-key', description: 'System management secret key', required: true })
  @ApiResponse({ status: 200, description: 'Navigation item deactivated' })
  @ApiResponse({ status: 400, description: 'Item has active children — deactivate them first' })
  @ApiResponse({ status: 403, description: 'Missing or invalid system key' })
  @ApiResponse({ status: 404, description: 'Not found' })
  deactivateItem(@Param('id') id: string) {
    return this.navigationService.deactivateItem(id);
  }

  // ─── Role Overrides (super_admin only) ───────────────────────────────────

  @Get('items/:navigationKey/overrides')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: '[SYSTEM] List all role overrides for a navigation item' })
  @ApiResponse({ status: 200, description: 'Overrides returned' })
  @ApiResponse({ status: 404, description: 'Navigation key not found' })
  getOverrides(@Param('navigationKey') navigationKey: string) {
    return this.navigationService.getOverridesForItem(navigationKey);
  }

  @Post('items/:navigationKey/overrides')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: '[SYSTEM] Create or update a role override for a navigation item' })
  @ApiResponse({ status: 200, description: 'Override saved' })
  @ApiResponse({ status: 404, description: 'Navigation key not found' })
  upsertOverride(
    @Param('navigationKey') navigationKey: string,
    @Body() dto: UpsertNavigationOverrideDto,
  ) {
    return this.navigationService.upsertOverride(navigationKey, dto);
  }

  @Delete('items/:navigationKey/overrides/:role')
  @UseGuards(SuperAdminGuard, SystemKeyGuard)
  @ApiOperation({ summary: '[SYSTEM] Delete a role override for a navigation item' })
  @ApiHeader({ name: 'x-system-key', description: 'System management secret key', required: true })
  @ApiResponse({ status: 200, description: 'Override deleted' })
  @ApiResponse({ status: 403, description: 'Missing or invalid system key' })
  @ApiResponse({ status: 404, description: 'Override not found' })
  deleteOverride(@Param('navigationKey') navigationKey: string, @Param('role') role: string) {
    return this.navigationService.deleteOverride(navigationKey, role);
  }
}
