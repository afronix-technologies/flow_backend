import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NavigationItem } from './entities/navigation-item.entity';
import { NavigationRoleOverride } from './entities/navigation-role-override.entity';
import { FeaturesService } from '../features/features.service';

interface NavNode {
  key: string;
  label: string;
  icon?: string;
  route?: string;
  children?: NavNode[];
}

@Injectable()
export class NavigationService {
  constructor(
    @InjectRepository(NavigationItem)
    private readonly navItemRepo: Repository<NavigationItem>,

    @InjectRepository(NavigationRoleOverride)
    private readonly overrideRepo: Repository<NavigationRoleOverride>,

    private readonly featuresService: FeaturesService,

    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  async getSidebarNavigation(organizationId: string, role: string) {
    if (!organizationId) {
      return { error: 'NO_ORGANIZATION', message: 'User is not part of any organization' };
    }

    const isAdmin = ['admin', 'owner'].includes(role);

    // Step 2: Get the org's enabled features (cache-aside)
    // Store as array because cache serializes to JSON — Set is not preserved across cache reads
    const cacheKey = `nav:features:${organizationId}`;
    const cachedFeatures = await this.cache.get<string[]>(cacheKey);
    let enabledFeatures: Set<string>;
    if (cachedFeatures) {
      enabledFeatures = new Set(cachedFeatures);
    } else {
      enabledFeatures = await this.featuresService.getEnabledFeatureKeys(organizationId);
      await this.cache.set(cacheKey, [...enabledFeatures]);
    }

    // Step 3: Load and filter all nav items
    const allItems = await this.navItemRepo.find({ order: { sortOrder: 'ASC' } });

    const visible = allItems.filter((item) => {
      // Normalize: TypeORM simple-array stores [] as '' in DB, reads back as ['']
      const requiredFeatures = (item.requiredFeatures || []).filter((f) => f.trim() !== '');

      // Feature check: item is visible if no feature is required, or ANY required feature is enabled
      const featureOk =
        requiredFeatures.length === 0 || requiredFeatures.some((f) => enabledFeatures.has(f));

      // Role check: admin-only items hidden from non-admins
      const roleOk = !item.adminOnly || isAdmin;

      return featureOk && roleOk;
    });

    // Step 4: Apply per-role overrides
    const overrides = await this.overrideRepo.find({ where: { role } });
    const overrideMap = new Map(overrides.map((o) => [o.navigationKey, o]));

    const processed = visible
      .filter((item) => !overrideMap.get(item.key)?.hidden)
      .map((item) => {
        const override = overrideMap.get(item.key);
        return {
          ...item,
          label: override?.labelOverride ?? item.label,
        };
      });

    // Step 5: Build nested tree
    const navigation = this.buildTree(processed);

    return {
      role,
      organizationId,
      navigation,
    };
  }

  private buildTree(items: NavigationItem[]): NavNode[] {
    const itemMap = new Map(items.map((i) => [i.key, i]));
    const topLevel = items.filter((i) => !i.parentKey);

    return topLevel
      .map((item) => this.buildNode(item, itemMap, items))
      .filter((node): node is NavNode => node !== null);
  }

  private buildNode(
    item: NavigationItem,
    itemMap: Map<string, NavigationItem>,
    allItems: NavigationItem[],
  ): NavNode | null {
    const children = allItems
      .filter((i) => i.parentKey === item.key)
      .map((child) => this.buildNode(child, itemMap, allItems))
      .filter((n): n is NavNode => n !== null);

    // Skip groups that have no route and no children (empty groups shouldn't render)
    if (!item.route && children.length === 0) {
      return null;
    }

    const node: NavNode = {
      key: item.key,
      label: item.label,
    };

    if (item.icon) node.icon = item.icon;
    if (item.route) node.route = item.route;
    if (children.length > 0) node.children = children;

    return node;
  }
}
