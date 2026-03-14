import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureCatalog } from './entities/feature-catalog.entity';
import { OrganizationFeature } from './entities/organization-feature.entity';

@Injectable()
export class FeaturesService {
  constructor(
    @InjectRepository(FeatureCatalog)
    private readonly catalogRepo: Repository<FeatureCatalog>,

    @InjectRepository(OrganizationFeature)
    private readonly orgFeatureRepo: Repository<OrganizationFeature>,
  ) {}

  /**
   * Returns all features with enabled status for the given org.
   */
  async getOrgFeatures(organizationId: string) {
    const allFeatures = await this.catalogRepo.find({ order: { package: 'ASC', name: 'ASC' } });
    const orgFeatures = await this.orgFeatureRepo.find({ where: { organizationId } });

    const enabledMap = new Map(orgFeatures.map((f) => [f.featureKey, f]));

    return allFeatures.map((feature) => {
      const orgEntry = enabledMap.get(feature.key);
      return {
        key: feature.key,
        name: feature.name,
        package: feature.package,
        enabled: orgEntry?.enabled ?? false,
        enabledAt: orgEntry?.enabledAt ?? null,
      };
    });
  }

  /**
   * Enable or disable a single feature for an org.
   */
  async toggleFeature(
    organizationId: string,
    featureKey: string,
    enabled: boolean,
    userId: string,
  ) {
    const feature = await this.catalogRepo.findOne({ where: { key: featureKey } });
    if (!feature) {
      throw new NotFoundException(`Feature '${featureKey}' not found`);
    }

    let orgFeature = await this.orgFeatureRepo.findOne({
      where: { organizationId, featureKey },
    });

    if (!orgFeature) {
      orgFeature = this.orgFeatureRepo.create({ organizationId, featureKey });
    }

    orgFeature.enabled = enabled;
    orgFeature.enabledAt = enabled ? new Date() : null;
    orgFeature.enabledBy = userId;

    await this.orgFeatureRepo.save(orgFeature);

    return {
      key: featureKey,
      enabled,
      enabledAt: orgFeature.enabledAt,
      enabledBy: userId,
    };
  }

  /**
   * Bulk-enable all features from a package (called during onboarding).
   * Workforce Management also includes all Project Management features.
   */
  async selectPackage(organizationId: string, packageName: string, userId: string) {
    const packagesToEnable = [packageName];
    if (packageName === 'workforce_management') {
      packagesToEnable.push('project_management');
    }

    const features = await this.catalogRepo.find({
      where: packagesToEnable.map((p) => ({ package: p })),
    });

    for (const feature of features) {
      let orgFeature = await this.orgFeatureRepo.findOne({
        where: { organizationId, featureKey: feature.key },
      });

      if (!orgFeature) {
        orgFeature = this.orgFeatureRepo.create({
          organizationId,
          featureKey: feature.key,
        });
      }

      orgFeature.enabled = true;
      orgFeature.enabledAt = new Date();
      orgFeature.enabledBy = userId;

      await this.orgFeatureRepo.save(orgFeature);
    }

    return {
      package: packageName,
      featuresEnabled: features.length,
      features: features.map((f) => f.key),
    };
  }

  /**
   * Returns the set of enabled feature keys for an org.
   */
  async getEnabledFeatureKeys(organizationId: string): Promise<Set<string>> {
    const rows = await this.orgFeatureRepo.find({
      where: { organizationId, enabled: true },
    });
    return new Set(rows.map((r) => r.featureKey));
  }
}
