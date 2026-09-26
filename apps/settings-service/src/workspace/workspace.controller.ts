import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { WorkspaceService } from './workspace.service';
import { SetupWorkspaceDto } from './dto/setup-workspace.dto';
import { JwtAuthGuard } from '../settings/guards/jwt-auth.guard';

@ApiTags('Workspace')
@Controller()
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  /**
   * GET /api/v1/workspaces/configs
   * Public — returns all available workspace packages for the selection screen.
   */
  @Get('workspaces/configs')
  @ApiOperation({ summary: 'Get all available workspace package configurations' })
  async getConfigs() {
    return this.workspaceService.getConfigs();
  }

  /**
   * POST /api/v1/organizations/:org_id/workspace
   * Admin only — configure the workspace for an org.
   */
  @Post('organizations/:org_id/workspace')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Set up / switch workspace package for an organisation (admin only)',
  })
  @ApiParam({ name: 'org_id', description: 'Organisation UUID' })
  async setupWorkspace(
    @Param('org_id') orgId: string,
    @Body() dto: SetupWorkspaceDto,
    @Request() req: any,
  ) {
    if (req.user.organizationId !== orgId) {
      throw new ForbiddenException('Access denied to this organization');
    }
    if (!['admin', 'owner'].includes(req.user.role)) {
      throw new ForbiddenException('Admin access required');
    }
    return this.workspaceService.setupWorkspace(orgId, dto.packageKey, req.user.sub);
  }

  /**
   * GET /api/v1/organizations/:org_id/workspace
   * Returns the current workspace setup for an org.
   */
  @Get('organizations/:org_id/workspace')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current workspace configuration for an organisation' })
  @ApiParam({ name: 'org_id', description: 'Organisation UUID' })
  async getOrgWorkspace(@Param('org_id') orgId: string, @Request() req: any) {
    if (req.user.organizationId !== orgId) {
      throw new ForbiddenException('Access denied to this organization');
    }
    return this.workspaceService.getOrgWorkspace(orgId);
  }
}
