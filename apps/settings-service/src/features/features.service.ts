import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureCatalog } from './entities/feature-catalog.entity';
import { OrganizationFeature } from './entities/organization-feature.entity';

const PLAN_RANK: Record<string, number> = {
  Free: 0,
  Starter: 1,
  Professional: 2,
  Enterprise: 3,
};

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
        description: feature.description ?? null,
        package: feature.package,
        tier: feature.tier,
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
   * Returns the full feature catalogue for an org, enriched with per-org enabled status,
   * upgrade requirements, and pack attribution.
   */
  async getCatalogue(organizationId: string, currentPlanName = 'Free') {
    const allFeatures = await this.catalogRepo.find({ order: { package: 'ASC', name: 'ASC' } });
    const orgFeatures = await this.orgFeatureRepo.find({ where: { organizationId } });
    const enabledMap = new Map(orgFeatures.map((f) => [f.featureKey, f.enabled]));
    const currentRank = PLAN_RANK[currentPlanName] ?? 0;

    return allFeatures.map((feature) => {
      const minimumPlan = feature.minimumPlan ?? 'Starter';
      const requiresUpgrade = (PLAN_RANK[minimumPlan] ?? 1) > currentRank;
      return {
        key: feature.key,
        name: feature.name,
        description: feature.description ?? null,
        sourceConfig: feature.sourceConfig ?? feature.package.replace(/_/g, '-'),
        minimumPlan,
        enabled: enabledMap.get(feature.key) ?? false,
        source: feature.packId ? 'pack' : 'plan',
        packId: feature.packId ?? null,
        requiresUpgrade,
      };
    });
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
