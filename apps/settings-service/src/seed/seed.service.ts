import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureCatalog } from '../features/entities/feature-catalog.entity';
import { NavigationItem } from '../navigation/entities/navigation-item.entity';
import { NavigationRoleOverride } from '../navigation/entities/navigation-role-override.entity';
import { WorkspacePackage } from '../workspace/entities/workspace-package.entity';

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
  ) {}

  async onModuleInit() {
    await this.seedWorkspacePackages();
    await this.seedFeatureCatalog();
    await this.seedNavigationItems();
    await this.seedRoleOverrides();
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
    const count = await this.catalogRepo.count();
    if (count > 0) return;

    this.logger.log('Seeding feature_catalog...');

    const features: Partial<FeatureCatalog>[] = [
      // Time Tracking package
      {
        key: 'start_stop_timer',
        name: 'Start/Stop Timer',
        package: 'time-tracking',
        description: 'Track time with a start/stop timer',
        isDefault: true,
      },
      {
        key: 'manual_time_entry',
        name: 'Manual Time Entry',
        package: 'time-tracking',
        description: 'Add time entries manually',
        isDefault: true,
      },
      {
        key: 'basic_project_assignment',
        name: 'Basic Project Assignment',
        package: 'time-tracking',
        description: 'Assign time to projects',
        isDefault: true,
      },
      {
        key: 'weekly_monthly_reports',
        name: 'Weekly/Monthly Reports',
        package: 'time-tracking',
        description: 'Generate weekly and monthly time reports',
        isDefault: true,
      },

      // Project Management package
      {
        key: 'full_time_tracking',
        name: 'Full Time Tracking',
        package: 'project-management',
        description: 'Complete time tracking suite',
        isDefault: true,
      },
      {
        key: 'project_task_management',
        name: 'Project & Task Management',
        package: 'project-management',
        description: 'Manage projects and tasks',
        isDefault: true,
      },
      {
        key: 'deadlines_priorities',
        name: 'Deadlines & Priorities',
        package: 'project-management',
        description: 'Set deadlines and task priorities',
        isDefault: true,
      },
      {
        key: 'performance_insights',
        name: 'Performance Insights',
        package: 'project-management',
        description: 'Analytics and performance reports',
        isDefault: true,
      },
      {
        key: 'team_collaboration',
        name: 'Team Collaboration',
        package: 'project-management',
        description: 'Collaborate across teams',
        isDefault: true,
      },

      // Workforce Management package
      {
        key: 'mandatory_clock_in_out',
        name: 'Mandatory Clock In/Out',
        package: 'workforce',
        description: 'Require employees to clock in and out',
        isDefault: true,
      },
      {
        key: 'attendance_tracking',
        name: 'Attendance Tracking',
        package: 'workforce',
        description: 'Track employee attendance',
        isDefault: true,
      },
      {
        key: 'leave_management',
        name: 'Leave Management',
        package: 'workforce',
        description: 'Manage employee leave requests',
        isDefault: true,
      },
      {
        key: 'shift_scheduling',
        name: 'Shift Scheduling',
        package: 'workforce',
        description: 'Schedule employee shifts',
        isDefault: true,
      },
    ];

    await this.catalogRepo.save(features.map((f) => this.catalogRepo.create(f)));
    this.logger.log(`Seeded ${features.length} features.`);
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
