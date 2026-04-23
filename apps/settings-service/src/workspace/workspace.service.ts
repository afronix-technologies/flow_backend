import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspacePackage } from './entities/workspace-package.entity';
import { OrganizationWorkspace } from './entities/organization-workspace.entity';
import { FeatureCatalog } from '../features/entities/feature-catalog.entity';
import { OrganizationFeature } from '../features/entities/organization-feature.entity';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(WorkspacePackage)
    private readonly packageRepo: Repository<WorkspacePackage>,

    @InjectRepository(OrganizationWorkspace)
    private readonly orgWorkspaceRepo: Repository<OrganizationWorkspace>,

    @InjectRepository(FeatureCatalog)
    private readonly catalogRepo: Repository<FeatureCatalog>,

    @InjectRepository(OrganizationFeature)
    private readonly orgFeatureRepo: Repository<OrganizationFeature>,

    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,

    @InjectQueue('notifications')
    private readonly notificationsQueue: Queue,
  ) {}

  /**
   * Returns all workspace packages for the selection screen.
   */
  async getConfigs() {
    const packages = await this.packageRepo.find();
    return {
      data: packages.map((p) => ({
        key: p.key,
        title: p.title,
        badge: p.badge,
        recommended: p.recommended,
        description: p.description,
        perfectFor: p.perfectFor,
        features: p.baseFeatures,
        actionText: p.actionText,
      })),
    };
  }

  /**
   * Configure workspace for an org — wipes old features, bulk-enables new ones.
   */
  async setupWorkspace(organizationId: string, packageKey: string, userId: string) {
    const pkg = await this.packageRepo.findOne({ where: { key: packageKey } });
    if (!pkg) throw new NotFoundException(`Package '${packageKey}' not found`);

    // Upsert organization_workspaces
    let orgWorkspace = await this.orgWorkspaceRepo.findOne({ where: { organizationId } });
    if (!orgWorkspace) {
      orgWorkspace = this.orgWorkspaceRepo.create({ organizationId });
    }
    orgWorkspace.packageKey = packageKey;
    orgWorkspace.setupStatus = 'ready';
    await this.orgWorkspaceRepo.save(orgWorkspace);

    // Map workspace package keys to feature_catalog package values (DB uses underscores)
    const featurePackageMap: Record<string, string[]> = {
      'time-tracking': ['time_tracking'],
      'project-management': ['project_management'],
      workforce: ['workforce_management', 'project_management'],
    };
    const featurePackages = featurePackageMap[packageKey] ?? [packageKey];

    // Get all default features for those packages
    const features = await this.catalogRepo
      .createQueryBuilder('f')
      .where('f.package IN (:...packages)', { packages: featurePackages })
      .andWhere('f.isDefault = true')
      .getMany();

    // Wipe existing org features
    await this.orgFeatureRepo.delete({ organizationId });

    // Bulk insert new ones
    const now = new Date();
    const newFeatures = features.map((f) =>
      this.orgFeatureRepo.create({
        organizationId,
        featureKey: f.key,
        enabled: true,
        enabledAt: now,
        enabledBy: userId,
      }),
    );
    await this.orgFeatureRepo.save(newFeatures);

    // Invalidate the navigation cache for this org so next sidebar request is fresh
    await this.cache.del(`nav:features:${organizationId}`);

    // Broadcast workspace change to all org members via notification service
    await this.notificationsQueue.add('workspace-updated', {
      organizationId,
      packageKey,
      updatedBy: userId,
      message: `Workspace has been updated to ${pkg.title}. Your sidebar will refresh on next load.`,
    });

    return {
      status: 'success',
      packageKey,
      message: 'Workspace successfully configured and ready.',
    };
  }

  /**
   * Returns the current workspace setup for an org.
   */
  async getOrgWorkspace(organizationId: string) {
    const workspace = await this.orgWorkspaceRepo.findOne({ where: { organizationId } });
    return workspace ?? null;
  }
}
