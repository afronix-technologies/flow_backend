import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { FeaturesService } from './features.service';
import { ToggleFeatureDto } from './dto/toggle-feature.dto';
import { SelectPackageDto } from './dto/select-package.dto';
import { JwtAuthGuard } from '../settings/guards/jwt-auth.guard';

@ApiTags('Features')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService) {}

  /**
   * GET /api/v1/organizations/:org_id/features
   * Returns all features with their enabled status for the given organization.
   */
  @Get(':org_id/features')
  @ApiOperation({ summary: 'Get all features with enabled status for an organisation' })
  @ApiParam({ name: 'org_id', description: 'Organisation UUID' })
  async getOrgFeatures(@Param('org_id') orgId: string, @Request() req: any) {
    this.assertSameOrg(req.user.organizationId, orgId);
    const features = await this.featuresService.getOrgFeatures(orgId);
    return { organization_id: orgId, features };
  }

  /**
   * PATCH /api/v1/organizations/:org_id/features/:feature_key
   * Enable or disable a feature (admin only).
   */
  @Patch(':org_id/features/:feature_key')
  @ApiOperation({ summary: 'Enable or disable a feature for an organisation (admin only)' })
  @ApiParam({ name: 'org_id', description: 'Organisation UUID' })
  @ApiParam({ name: 'feature_key', description: 'Feature key e.g. attendance_tracking' })
  async toggleFeature(
    @Param('org_id') orgId: string,
    @Param('feature_key') featureKey: string,
    @Body() dto: ToggleFeatureDto,
    @Request() req: any,
  ) {
    this.assertSameOrg(req.user.organizationId, orgId);
    this.assertAdmin(req.user.role);
    return this.featuresService.toggleFeature(orgId, featureKey, dto.enabled, req.user.sub);
  }

  /**
   * POST /api/v1/organizations/:org_id/package
   * Select a feature package during onboarding (admin only).
   */
  @Post(':org_id/package')
  @ApiOperation({
    summary:
      'Select a feature package during onboarding — bulk-enables all features in the package (admin only)',
  })
  @ApiParam({ name: 'org_id', description: 'Organisation UUID' })
  async selectPackage(
    @Param('org_id') orgId: string,
    @Body() dto: SelectPackageDto,
    @Request() req: any,
  ) {
    this.assertSameOrg(req.user.organizationId, orgId);
    this.assertAdmin(req.user.role);
    return this.featuresService.selectPackage(orgId, dto.package, req.user.sub);
  }

  private assertSameOrg(tokenOrgId: string, paramOrgId: string) {
    if (tokenOrgId !== paramOrgId) {
      throw new ForbiddenException('Access denied to this organization');
    }
  }

  private assertAdmin(role: string) {
    if (!['admin', 'owner'].includes(role)) {
      throw new ForbiddenException('Admin access required');
    }
  }
}
