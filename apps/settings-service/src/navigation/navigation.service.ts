import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NavigationItem } from './entities/navigation-item.entity';
import { NavigationRoleOverride } from './entities/navigation-role-override.entity';
import { FeaturesService } from '../features/features.service';
import { CreateNavigationItemDto } from './dto/create-navigation-item.dto';
import { UpdateNavigationItemDto } from './dto/update-navigation-item.dto';
import { UpsertNavigationOverrideDto } from './dto/upsert-navigation-override.dto';

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

    const cacheKey = `nav:features:${organizationId}`;
    const cachedFeatures = await this.cache.get<string[]>(cacheKey);
    let enabledFeatures: Set<string>;
    if (cachedFeatures) {
      enabledFeatures = new Set(cachedFeatures);
    } else {
      enabledFeatures = await this.featuresService.getEnabledFeatureKeys(organizationId);
      await this.cache.set(cacheKey, [...enabledFeatures]);
    }

    const allItems = await this.navItemRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });

    const visible = allItems.filter((item) => {
      const requiredFeatures = (item.requiredFeatures || []).filter((f) => f.trim() !== '');
      const featureOk =
        requiredFeatures.length === 0 || requiredFeatures.some((f) => enabledFeatures.has(f));
      const roleOk = !item.adminOnly || isAdmin;
      return featureOk && roleOk;
    });

    const overrides = await this.overrideRepo.find({ where: { role } });
    const overrideMap = new Map(overrides.map((o) => [o.navigationKey, o]));

    const processed = visible
      .filter((item) => !overrideMap.get(item.key)?.hidden)
      .map((item) => {
        const override = overrideMap.get(item.key);
        return { ...item, label: override?.labelOverride ?? item.label };
      });

    return {
      role,
      organizationId,
      navigation: this.buildTree(processed),
    };
  }

  // ─── Navigation Items CRUD ────────────────────────────────────────────────

  async getAllItems(): Promise<NavigationItem[]> {
    return this.navItemRepo.find({ order: { sortOrder: 'ASC' } });
  }

  async getItemById(id: string): Promise<NavigationItem> {
    const item = await this.navItemRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Navigation item with id "${id}" not found.`);
    return item;
  }

  async createItem(dto: CreateNavigationItemDto): Promise<NavigationItem> {
    const existing = await this.navItemRepo.findOne({ where: { key: dto.key } });
    if (existing) {
      throw new ConflictException(`A navigation item with key "${dto.key}" already exists.`);
    }

    if (dto.parentKey) {
      const parent = await this.navItemRepo.findOne({ where: { key: dto.parentKey } });
      if (!parent) {
        throw new BadRequestException(`Parent key "${dto.parentKey}" does not exist.`);
      }
    }

    const item = this.navItemRepo.create({ ...dto, isActive: true });
    return this.navItemRepo.save(item);
  }

  async updateItem(id: string, dto: UpdateNavigationItemDto): Promise<NavigationItem> {
    const item = await this.getItemById(id);

    if (dto.parentKey && dto.parentKey !== item.parentKey) {
      const parent = await this.navItemRepo.findOne({ where: { key: dto.parentKey } });
      if (!parent) {
        throw new BadRequestException(`Parent key "${dto.parentKey}" does not exist.`);
      }
    }

    Object.assign(item, dto);
    return this.navItemRepo.save(item);
  }

  async deactivateItem(id: string): Promise<{ message: string }> {
    const item = await this.getItemById(id);

    const activeChildren = await this.navItemRepo.count({
      where: { parentKey: item.key, isActive: true },
    });

    if (activeChildren > 0) {
      throw new BadRequestException(
        `Cannot deactivate "${item.key}" — it has ${activeChildren} active child item(s). Deactivate or re-parent them first.`,
      );
    }

    item.isActive = false;
    await this.navItemRepo.save(item);
    return { message: `Navigation item "${item.key}" has been deactivated.` };
  }

  // ─── Role Overrides CRUD ─────────────────────────────────────────────────

  async getOverridesForItem(navigationKey: string): Promise<NavigationRoleOverride[]> {
    await this.ensureItemKeyExists(navigationKey);
    return this.overrideRepo.find({ where: { navigationKey } });
  }

  async upsertOverride(
    navigationKey: string,
    dto: UpsertNavigationOverrideDto,
  ): Promise<NavigationRoleOverride> {
    await this.ensureItemKeyExists(navigationKey);

    let override = await this.overrideRepo.findOne({
      where: { navigationKey, role: dto.role },
    });

    if (override) {
      Object.assign(override, dto);
    } else {
      override = this.overrideRepo.create({ navigationKey, ...dto });
    }

    return this.overrideRepo.save(override);
  }

  async deleteOverride(navigationKey: string, role: string): Promise<{ message: string }> {
    await this.ensureItemKeyExists(navigationKey);

    const override = await this.overrideRepo.findOne({ where: { navigationKey, role } });
    if (!override) {
      throw new NotFoundException(
        `No override found for key "${navigationKey}" and role "${role}".`,
      );
    }

    await this.overrideRepo.remove(override);
    return { message: `Override for "${navigationKey}" / "${role}" has been deleted.` };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async ensureItemKeyExists(key: string): Promise<void> {
    const item = await this.navItemRepo.findOne({ where: { key } });
    if (!item) throw new NotFoundException(`Navigation item with key "${key}" not found.`);
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

    if (!item.route && children.length === 0) return null;

    const node: NavNode = { key: item.key, label: item.label };
    if (item.icon) node.icon = item.icon;
    if (item.route) node.route = item.route;
    if (children.length > 0) node.children = children;

    return node;
  }
}
