import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureCatalog } from '../features/entities/feature-catalog.entity';
import { NavigationItem } from '../navigation/entities/navigation-item.entity';
import { NavigationRoleOverride } from '../navigation/entities/navigation-role-override.entity';
import { WorkspacePackage } from '../workspace/entities/workspace-package.entity';
import { BillingPlan } from '../billing/entities/billing-plan.entity';
import { FeaturePack } from '../billing/entities/feature-pack.entity';
import { CountryPaymentConfig } from '../billing/entities/country-payment-config.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(FeatureCatalog)
    private readonly catalogRepo: Repository<FeatureCatalog>,

    @InjectRepository(NavigationItem)
    private readonly navItemRepo: Repository<NavigationItem>,

    @InjectRepository(NavigationRoleOverride)
    private readonly overrideRepo: Repository<NavigationRoleOverride>,

    @InjectRepository(WorkspacePackage)
    private readonly workspacePackageRepo: Repository<WorkspacePackage>,

    @InjectRepository(BillingPlan)
    private readonly billingPlanRepo: Repository<BillingPlan>,

    @InjectRepository(FeaturePack)
    private readonly featurePackRepo: Repository<FeaturePack>,

    @InjectRepository(CountryPaymentConfig)
    private readonly countryPaymentRepo: Repository<CountryPaymentConfig>,
  ) {}

  async onModuleInit() {
    await this.seedWorkspacePackages();
    await this.seedFeatureCatalog();
    await this.seedNavigationItems();
    await this.seedRoleOverrides();
    await this.seedBillingPlans();
    await this.seedFeaturePacks();
    await this.seedCountryPaymentConfigs();
  }

  // ---------------------------------------------------------------------------
  // Workspace Packages
  // ---------------------------------------------------------------------------

  private async seedWorkspacePackages() {
    const count = await this.workspacePackageRepo.count();
    if (count > 0) return;

    this.logger.log('Seeding workspace_packages...');

    const packages: Partial<WorkspacePackage>[] = [
      {
        key: 'time-tracking',
        title: 'Time Tracking',
        badge: 'Standard',
        recommended: false,
        description: 'Simple time tracking for accurate payroll and project billing.',
        perfectFor: ['Freelancers', 'Small Teams'],
        baseFeatures: [
          'Start/Stop Timer',
          'Manual Time Entry',
          'Basic Project Assignment',
          'Weekly/Monthly Reports',
        ],
        actionText: 'Select Time Tracking',
      },
      {
        key: 'project-management',
        title: 'Project Management',
        badge: 'Professional',
        recommended: true,
        description: 'Full project and task management with time tracking and team collaboration.',
        perfectFor: ['Growing Teams', 'Project-Based Businesses'],
        baseFeatures: [
          'Full Time Tracking',
          'Project & Task Management',
          'Deadlines & Priorities',
          'Performance Insights',
          'Team Collaboration',
        ],
        actionText: 'Select Project Management',
      },
      {
        key: 'workforce',
        title: 'Workforce Management',
        badge: 'Professional',
        recommended: false,
        description: 'Complete workforce management with attendance, leave, and shift scheduling.',
        perfectFor: ['Large Teams', 'HR Departments', 'Enterprises'],
        baseFeatures: [
          'Everything in Project Management',
          'Mandatory Clock In/Out',
          'Attendance Tracking',
          'Leave Management',
          'Shift Scheduling',
        ],
        actionText: 'Select Workforce Management',
      },
    ];

    await this.workspacePackageRepo.save(packages.map((p) => this.workspacePackageRepo.create(p)));
    this.logger.log(`Seeded ${packages.length} workspace packages.`);
  }

  // ---------------------------------------------------------------------------
  // Feature Catalog
  // ---------------------------------------------------------------------------

  private async seedFeatureCatalog() {
    this.logger.log('Upserting feature_catalog...');

    const features: Partial<FeatureCatalog>[] = [
      // Time Tracking package
      {
        key: 'start_stop_timer',
        name: 'Start/Stop Timer',
        package: 'time_tracking',
        sourceConfig: 'time-tracking',
        minimumPlan: 'Starter',
        description: 'Track time with a start/stop timer',
        isDefault: true,
      },
      {
        key: 'manual_time_entry',
        name: 'Manual Time Entry',
        package: 'time_tracking',
        sourceConfig: 'time-tracking',
        minimumPlan: 'Starter',
        description: 'Add time entries manually',
        isDefault: true,
      },
      {
        key: 'basic_project_assignment',
        name: 'Basic Project Assignment',
        package: 'time_tracking',
        sourceConfig: 'time-tracking',
        minimumPlan: 'Starter',
        description: 'Assign time to projects',
        isDefault: true,
      },
      {
        key: 'weekly_monthly_reports',
        name: 'Weekly/Monthly Reports',
        package: 'time_tracking',
        sourceConfig: 'time-tracking',
        minimumPlan: 'Starter',
        description: 'Generate weekly and monthly time reports',
        isDefault: true,
      },

      // Project Management package
      {
        key: 'full_time_tracking',
        name: 'Full Time Tracking',
        package: 'project_management',
        sourceConfig: 'project-management',
        minimumPlan: 'Starter',
        description: 'Complete time tracking suite',
        isDefault: true,
      },
      {
        key: 'project_task_management',
        name: 'Project & Task Management',
        package: 'project_management',
        sourceConfig: 'project-management',
        minimumPlan: 'Starter',
        description: 'Manage projects and tasks',
        isDefault: true,
      },
      {
        key: 'team_collaboration',
        name: 'Team Collaboration',
        package: 'project_management',
        sourceConfig: 'project-management',
        minimumPlan: 'Starter',
        description: 'Collaborate across teams',
        isDefault: true,
      },
      {
        key: 'deadlines_priorities',
        name: 'Deadlines & Priorities',
        package: 'project_management',
        sourceConfig: 'project-management',
        minimumPlan: 'Starter',
        description: 'Set deadlines and task priorities',
        isDefault: true,
      },
      {
        key: 'performance_insights',
        name: 'Performance Insights',
        package: 'project_management',
        sourceConfig: 'project-management',
        minimumPlan: 'Professional',
        tier: 'professional',
        description: 'Analytics and performance reports',
        isDefault: true,
      },

      // Workforce Management package
      {
        key: 'mandatory_clock_in_out',
        name: 'Mandatory Clock In/Out',
        package: 'workforce_management',
        sourceConfig: 'workforce',
        minimumPlan: 'Professional',
        tier: 'professional',
        description: 'Require employees to clock in and out',
        isDefault: true,
      },
      {
        key: 'attendance_tracking',
        name: 'Attendance Tracking',
        package: 'workforce_management',
        sourceConfig: 'workforce',
        minimumPlan: 'Professional',
        tier: 'professional',
        description: 'Track employee attendance',
        isDefault: true,
      },
      {
        key: 'leave_management',
        name: 'Leave Management',
        package: 'workforce_management',
        sourceConfig: 'workforce',
        minimumPlan: 'Professional',
        tier: 'professional',
        description: 'Manage employee leave requests',
        isDefault: true,
      },
      {
        key: 'shift_scheduling',
        name: 'Shift Scheduling',
        package: 'workforce_management',
        sourceConfig: 'workforce',
        minimumPlan: 'Professional',
        tier: 'professional',
        description: 'Schedule employee shifts',
        isDefault: true,
      },
    ];

    await this.catalogRepo.upsert(features as FeatureCatalog[], ['key']);
    this.logger.log(`Upserted ${features.length} feature catalog entries.`);
  }

  // ---------------------------------------------------------------------------
  // Billing Plans
  // ---------------------------------------------------------------------------

  private async seedBillingPlans() {
    this.logger.log('Upserting billing_plans...');

    const plans: Partial<BillingPlan>[] = [
      {
        name: 'Free',
        tagline: 'Get started at no cost',
        pricePerSeat: 0,
        annualDiscount: 0,
        seatLimit: 3,
        allowedConfigs: ['time-tracking'],
        highlights: ['Up to 3 seats', 'Time Tracking only', 'Community support', 'No feature packs'],
        sortOrder: 0,
      },
      {
        name: 'Starter',
        tagline: 'For small teams getting started',
        pricePerSeat: 5,
        annualDiscount: 0,
        seatLimit: 10,
        allowedConfigs: ['time-tracking', 'project-management'],
        highlights: ['Up to 10 seats', 'Time Tracking or Project Management', 'Community support', 'No feature packs'],
        sortOrder: 1,
      },
      {
        name: 'Professional',
        tagline: 'For growing teams that need flexibility',
        pricePerSeat: 12,
        annualDiscount: 0.20,
        seatLimit: 50,
        allowedConfigs: ['time-tracking', 'project-management', 'workforce'],
        highlights: [
          'Up to 50 seats',
          'Any workspace config',
          'Feature packs à la carte',
          'Priority support',
          'Save 20% annually',
        ],
        sortOrder: 2,
      },
      {
        name: 'Enterprise',
        tagline: 'For large orgs with custom needs',
        pricePerSeat: 0,
        annualDiscount: 0.20,
        seatLimit: null,
        allowedConfigs: ['time-tracking', 'project-management', 'workforce'],
        highlights: [
          'Unlimited seats',
          'All workspace configs',
          'All packs included',
          'SSO & SAML',
          'Dedicated success manager',
        ],
        sortOrder: 3,
      },
    ];

    await this.billingPlanRepo.upsert(plans as BillingPlan[], ['name']);
    this.logger.log(`Upserted ${plans.length} billing plans.`);
  }

  // ---------------------------------------------------------------------------
  // Feature Packs
  // ---------------------------------------------------------------------------

  private async seedFeaturePacks() {
    this.logger.log('Upserting feature_packs...');

    const packs: Partial<FeaturePack>[] = [
      {
        id: 'time-pack',
        name: 'Time Tracking Pack',
        sourceConfig: 'time-tracking',
        description: 'Simple time tracking for accurate payroll and client billing.',
        features: [
          'start_stop_timer',
          'manual_time_entry',
          'basic_project_assignment',
          'weekly_monthly_reports',
        ],
        pricePerSeat: 3,
        minimumPlan: 'Professional',
      },
      {
        id: 'workforce-pack',
        name: 'Workforce Pack',
        sourceConfig: 'workforce',
        description: 'Comprehensive team oversight with mandatory attendance tracking, shift management, and workforce coordination.',
        features: [
          'attendance_tracking',
          'leave_management',
          'shift_scheduling',
        ],
        pricePerSeat: 4,
        minimumPlan: 'Professional',
      },
    ];

    await this.featurePackRepo.upsert(packs as FeaturePack[], ['id']);
    this.logger.log(`Upserted ${packs.length} feature packs.`);
  }

  // ---------------------------------------------------------------------------
  // Country Payment Configs
  // ---------------------------------------------------------------------------

  private async seedCountryPaymentConfigs() {
    this.logger.log('Upserting country_payment_configs...');

    const configs: Partial<CountryPaymentConfig>[] = [
      // ── Fallback (must exist) ──────────────────────────────────────────────
      { countryCode: 'DEFAULT', currency: 'USD', currencySymbol: '$', paymentMethods: ['card'] },

      // ── Africa — Flutterwave + Paystack ────────────────────────────────────
      { countryCode: 'NG', currency: 'NGN', currencySymbol: '₦', paymentMethods: ['paystack', 'flutterwave'] },
      { countryCode: 'GH', currency: 'GHS', currencySymbol: 'GH₵', paymentMethods: ['paystack', 'flutterwave'] },
      { countryCode: 'KE', currency: 'KES', currencySymbol: 'KSh', paymentMethods: ['flutterwave'] },
      { countryCode: 'ZA', currency: 'ZAR', currencySymbol: 'R', paymentMethods: ['paystack', 'flutterwave'] },
      { countryCode: 'UG', currency: 'UGX', currencySymbol: 'USh', paymentMethods: ['flutterwave'] },
      { countryCode: 'TZ', currency: 'TZS', currencySymbol: 'TSh', paymentMethods: ['flutterwave'] },
      { countryCode: 'RW', currency: 'RWF', currencySymbol: 'RF', paymentMethods: ['flutterwave'] },
      { countryCode: 'ZM', currency: 'ZMW', currencySymbol: 'ZK', paymentMethods: ['flutterwave'] },
      { countryCode: 'CI', currency: 'XOF', currencySymbol: 'CFA', paymentMethods: ['flutterwave'] },
      { countryCode: 'SN', currency: 'XOF', currencySymbol: 'CFA', paymentMethods: ['flutterwave'] },
      { countryCode: 'CM', currency: 'XAF', currencySymbol: 'CFA', paymentMethods: ['flutterwave'] },
      { countryCode: 'ET', currency: 'ETB', currencySymbol: 'Br', paymentMethods: ['flutterwave'] },
      { countryCode: 'EG', currency: 'EGP', currencySymbol: 'E£', paymentMethods: ['flutterwave'] },
      { countryCode: 'MA', currency: 'MAD', currencySymbol: 'د.م.', paymentMethods: ['flutterwave'] },

      // ── UK & Europe — card ─────────────────────────────────────────────────
      { countryCode: 'GB', currency: 'GBP', currencySymbol: '£', paymentMethods: ['card'] },
      { countryCode: 'DE', currency: 'EUR', currencySymbol: '€', paymentMethods: ['card'] },
      { countryCode: 'FR', currency: 'EUR', currencySymbol: '€', paymentMethods: ['card'] },
      { countryCode: 'NL', currency: 'EUR', currencySymbol: '€', paymentMethods: ['card'] },
      { countryCode: 'ES', currency: 'EUR', currencySymbol: '€', paymentMethods: ['card'] },
      { countryCode: 'IT', currency: 'EUR', currencySymbol: '€', paymentMethods: ['card'] },
      { countryCode: 'PT', currency: 'EUR', currencySymbol: '€', paymentMethods: ['card'] },
      { countryCode: 'IE', currency: 'EUR', currencySymbol: '€', paymentMethods: ['card'] },
      { countryCode: 'SE', currency: 'SEK', currencySymbol: 'kr', paymentMethods: ['card'] },
      { countryCode: 'NO', currency: 'NOK', currencySymbol: 'kr', paymentMethods: ['card'] },
      { countryCode: 'DK', currency: 'DKK', currencySymbol: 'kr', paymentMethods: ['card'] },
      { countryCode: 'CH', currency: 'CHF', currencySymbol: 'CHF', paymentMethods: ['card'] },

      // ── Americas & Asia-Pacific — card ─────────────────────────────────────
      { countryCode: 'US', currency: 'USD', currencySymbol: '$', paymentMethods: ['card'] },
      { countryCode: 'CA', currency: 'CAD', currencySymbol: 'C$', paymentMethods: ['card'] },
      { countryCode: 'AU', currency: 'AUD', currencySymbol: 'A$', paymentMethods: ['card'] },
      { countryCode: 'NZ', currency: 'NZD', currencySymbol: 'NZ$', paymentMethods: ['card'] },
      { countryCode: 'SG', currency: 'SGD', currencySymbol: 'S$', paymentMethods: ['card'] },
      { countryCode: 'IN', currency: 'INR', currencySymbol: '₹', paymentMethods: ['card'] },
      { countryCode: 'AE', currency: 'AED', currencySymbol: 'د.إ', paymentMethods: ['card'] },
    ];

    await this.countryPaymentRepo.upsert(configs as CountryPaymentConfig[], ['countryCode']);
    this.logger.log(`Upserted ${configs.length} country payment configs.`);
  }

  // ---------------------------------------------------------------------------
  // Navigation Items
  // ---------------------------------------------------------------------------

  private async seedNavigationItems() {
    const count = await this.navItemRepo.count();
    if (count > 0) return;

    this.logger.log('Seeding navigation_items...');

    const items: Partial<NavigationItem>[] = [
      // ── Top level ──────────────────────────────────────────────────────────
      {
        key: 'dashboard',
        label: 'Dashboard',
        icon: 'pi-home',
        parentKey: null,
        route: '/dashboard',
        sortOrder: 1,
        requiredFeatures: [],
        adminOnly: false,
      },
      {
        key: 'teams',
        label: 'Teams',
        icon: 'pi-users',
        parentKey: null,
        route: null,
        sortOrder: 2,
        requiredFeatures: ['team_collaboration'],
        adminOnly: false,
      },
      {
        key: 'projects',
        label: 'Projects',
        icon: 'pi-briefcase',
        parentKey: null,
        route: '/dashboard/projects',
        sortOrder: 3,
        requiredFeatures: ['basic_project_assignment', 'project_task_management'],
        adminOnly: false,
      },
      {
        key: 'reports',
        label: 'Reports',
        icon: 'pi-chart-bar',
        parentKey: null,
        route: '/dashboard/reports',
        sortOrder: 4,
        requiredFeatures: ['weekly_monthly_reports', 'performance_insights'],
        adminOnly: false,
      },
      {
        key: 'time-tracking',
        label: 'Time Tracking',
        icon: 'pi-clock',
        parentKey: null,
        route: '/dashboard/time-tracking',
        sortOrder: 5,
        requiredFeatures: [
          'start_stop_timer',
          'full_time_tracking',
          'manual_time_entry',
          'mandatory_clock_in_out',
          'attendance_tracking',
        ],
        adminOnly: false,
      },
      {
        key: 'payroll',
        label: 'Payroll',
        icon: 'pi-wallet',
        parentKey: null,
        route: '/dashboard/payroll',
        sortOrder: 6,
        requiredFeatures: ['full_time_tracking'],
        adminOnly: true,
      },
      {
        key: 'notifications',
        label: 'Notifications',
        icon: 'pi-bell',
        parentKey: null,
        route: '/dashboard/notifications',
        sortOrder: 7,
        requiredFeatures: [],
        adminOnly: false,
      },
      {
        key: 'settings',
        label: 'Settings',
        icon: 'pi-cog',
        parentKey: null,
        route: null,
        sortOrder: 8,
        requiredFeatures: [],
        adminOnly: false,
      },
      {
        key: 'sync',
        label: 'Sync',
        icon: 'pi-sync',
        parentKey: null,
        route: '/dashboard/sync',
        sortOrder: 9,
        requiredFeatures: [],
        adminOnly: true,
      },

      // ── Teams children ─────────────────────────────────────────────────────
      {
        key: 'teams-general',
        label: 'General',
        parentKey: 'teams',
        route: '/dashboard/teams/general',
        sortOrder: 1,
        requiredFeatures: ['team_collaboration'],
        adminOnly: false,
      },
      {
        key: 'teams-work-policies',
        label: 'Work Policies',
        parentKey: 'teams',
        route: '/dashboard/teams/work-policies',
        sortOrder: 2,
        requiredFeatures: ['team_collaboration'],
        adminOnly: true,
      },
      {
        key: 'teams-features',
        label: 'Features',
        parentKey: 'teams',
        route: '/dashboard/teams/features',
        sortOrder: 3,
        requiredFeatures: ['team_collaboration'],
        adminOnly: true,
      },
      {
        key: 'teams-privacy',
        label: 'Privacy',
        parentKey: 'teams',
        route: '/dashboard/teams/privacy',
        sortOrder: 4,
        requiredFeatures: ['team_collaboration'],
        adminOnly: true,
      },
      {
        key: 'teams-employees',
        label: 'Employees',
        parentKey: 'teams',
        route: '/dashboard/teams/employees',
        sortOrder: 5,
        requiredFeatures: ['team_collaboration'],
        adminOnly: true,
      },
      {
        key: 'teams-departments',
        label: 'Departments',
        parentKey: 'teams',
        route: '/dashboard/teams/departments',
        sortOrder: 6,
        requiredFeatures: ['team_collaboration'],
        adminOnly: true,
      },

      // ── Projects children ──────────────────────────────────────────────────
      {
        key: 'task-management',
        label: 'Task Management',
        parentKey: 'projects',
        route: '/dashboard/projects/tasks',
        sortOrder: 1,
        requiredFeatures: ['basic_project_assignment', 'project_task_management'],
        adminOnly: false,
      },
      {
        key: 'calendar',
        label: 'Calendar',
        parentKey: 'projects',
        route: '/dashboard/projects/calendar',
        sortOrder: 2,
        requiredFeatures: ['project_task_management'],
        adminOnly: false,
      },

      // ── Reports children ───────────────────────────────────────────────────
      {
        key: 'analytics',
        label: 'Analytics',
        parentKey: 'reports',
        route: '/dashboard/reports/analytics',
        sortOrder: 1,
        requiredFeatures: ['weekly_monthly_reports', 'performance_insights'],
        adminOnly: false,
      },
      {
        key: 'documents',
        label: 'Documents',
        parentKey: 'reports',
        route: '/dashboard/reports/documents',
        sortOrder: 2,
        requiredFeatures: ['weekly_monthly_reports'],
        adminOnly: true,
      },
      {
        key: 'performance',
        label: 'Performance',
        parentKey: 'reports',
        route: '/dashboard/reports/performance',
        sortOrder: 3,
        requiredFeatures: ['performance_insights'],
        adminOnly: false,
      },

      // ── Time Tracking children ─────────────────────────────────────────────
      {
        key: 'attendance',
        label: 'Attendance',
        parentKey: 'time-tracking',
        route: '/dashboard/time-tracking/attendance',
        sortOrder: 1,
        requiredFeatures: [
          'start_stop_timer',
          'manual_time_entry',
          'full_time_tracking',
          'mandatory_clock_in_out',
          'attendance_tracking',
          'shift_scheduling',
        ],
        adminOnly: false,
      },
      {
        key: 'leave',
        label: 'Leave',
        parentKey: 'time-tracking',
        route: '/dashboard/time-tracking/leave',
        sortOrder: 2,
        requiredFeatures: ['leave_management', 'attendance_tracking'],
        adminOnly: false,
      },
      {
        key: 'approvals',
        label: 'Approvals',
        parentKey: 'time-tracking',
        route: '/dashboard/time-tracking/approvals',
        sortOrder: 3,
        requiredFeatures: ['leave_management'],
        adminOnly: true,
      },

      // ── Notifications children ─────────────────────────────────────────────
      {
        key: 'announcements',
        label: 'Announcements',
        parentKey: 'notifications',
        route: '/dashboard/notifications/announcements',
        sortOrder: 1,
        requiredFeatures: [],
        adminOnly: false,
      },

      // ── Settings children ──────────────────────────────────────────────────
      {
        key: 'settings-general',
        label: 'General',
        parentKey: 'settings',
        route: '/dashboard/settings/general',
        sortOrder: 1,
        requiredFeatures: [],
        adminOnly: false,
      },
      {
        key: 'settings-work-policies',
        label: 'Work Policies',
        parentKey: 'settings',
        route: '/dashboard/settings/work-policies',
        sortOrder: 2,
        requiredFeatures: [],
        adminOnly: true,
      },
      {
        key: 'settings-features',
        label: 'Features',
        parentKey: 'settings',
        route: '/dashboard/settings/features',
        sortOrder: 3,
        requiredFeatures: [],
        adminOnly: true,
      },
      {
        key: 'settings-privacy',
        label: 'Privacy',
        parentKey: 'settings',
        route: '/dashboard/settings/privacy',
        sortOrder: 4,
        requiredFeatures: [],
        adminOnly: false,
      },
    ];

    await this.navItemRepo.save(items.map((i) => this.navItemRepo.create(i)));
    this.logger.log(`Seeded ${items.length} navigation items.`);
  }

  // ---------------------------------------------------------------------------
  // Role Overrides
  // ---------------------------------------------------------------------------

  private async seedRoleOverrides() {
    const count = await this.overrideRepo.count();
    if (count > 0) return;

    this.logger.log('Seeding navigation_role_overrides...');

    const overrides: Partial<NavigationRoleOverride>[] = [
      {
        navigationKey: 'task-management',
        role: 'member',
        labelOverride: 'My Tasks',
        hidden: false,
      },
      { navigationKey: 'leave', role: 'member', labelOverride: 'Leave Requests', hidden: false },
      {
        navigationKey: 'settings-general',
        role: 'member',
        labelOverride: 'Profile',
        hidden: false,
      },
    ];

    await this.overrideRepo.save(overrides.map((o) => this.overrideRepo.create(o)));
    this.logger.log(`Seeded ${overrides.length} role overrides.`);
  }
}
