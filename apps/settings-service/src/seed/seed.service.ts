import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureCatalog } from '../features/entities/feature-catalog.entity';
import { NavigationItem } from '../navigation/entities/navigation-item.entity';
import { NavigationRoleOverride } from '../navigation/entities/navigation-role-override.entity';

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
  ) {}

  async onModuleInit() {
    await this.seedFeatureCatalog();
    await this.seedNavigationItems();
    await this.seedRoleOverrides();
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
        package: 'time_tracking',
        description: 'Track time with a start/stop timer',
      },
      {
        key: 'manual_time_entry',
        name: 'Manual Time Entry',
        package: 'time_tracking',
        description: 'Add time entries manually',
      },
      {
        key: 'basic_project_assignment',
        name: 'Basic Project Assignment',
        package: 'time_tracking',
        description: 'Assign time to projects',
      },
      {
        key: 'weekly_monthly_reports',
        name: 'Weekly/Monthly Reports',
        package: 'time_tracking',
        description: 'Generate weekly and monthly time reports',
      },

      // Project Management package
      {
        key: 'full_time_tracking',
        name: 'Full Time Tracking',
        package: 'project_management',
        description: 'Complete time tracking suite',
      },
      {
        key: 'project_task_management',
        name: 'Project & Task Management',
        package: 'project_management',
        description: 'Manage projects and tasks',
      },
      {
        key: 'deadlines_priorities',
        name: 'Deadlines & Priorities',
        package: 'project_management',
        description: 'Set deadlines and task priorities',
      },
      {
        key: 'performance_insights',
        name: 'Performance Insights',
        package: 'project_management',
        description: 'Analytics and performance reports',
      },
      {
        key: 'team_collaboration',
        name: 'Team Collaboration',
        package: 'project_management',
        description: 'Collaborate across teams',
      },

      // Workforce Management package
      {
        key: 'mandatory_clock_in_out',
        name: 'Mandatory Clock In/Out',
        package: 'workforce_management',
        description: 'Require employees to clock in and out',
      },
      {
        key: 'attendance_tracking',
        name: 'Attendance Tracking',
        package: 'workforce_management',
        description: 'Track employee attendance',
      },
      {
        key: 'leave_management',
        name: 'Leave Management',
        package: 'workforce_management',
        description: 'Manage employee leave requests',
      },
      {
        key: 'shift_scheduling',
        name: 'Shift Scheduling',
        package: 'workforce_management',
        description: 'Schedule employee shifts',
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

    /**
     * requiredFeatures: item is shown if ANY of these features is enabled.
     * An empty array means always visible.
     *
     * Note: group items (like time-tracking) list ALL features that can make them visible.
     * e.g. time-tracking is visible if start_stop_timer OR full_time_tracking is enabled.
     */
    const items: Partial<NavigationItem>[] = [
      // ── Top level ──────────────────────────────────────────────────────────
      {
        key: 'dashboard',
        label: 'Dashboard',
        parentKey: null,
        route: '/dashboard',
        sortOrder: 1,
        requiredFeatures: [],
        adminOnly: false,
      },
      {
        key: 'teams',
        label: 'Teams',
        parentKey: null,
        route: null,
        sortOrder: 2,
        requiredFeatures: ['team_collaboration'],
        adminOnly: false,
      },
      {
        key: 'projects',
        label: 'Projects',
        parentKey: null,
        route: '/dashboard/projects',
        sortOrder: 3,
        requiredFeatures: ['basic_project_assignment', 'project_task_management'],
        adminOnly: false,
      },
      {
        key: 'reports',
        label: 'Reports',
        parentKey: null,
        route: '/dashboard/reports',
        sortOrder: 4,
        requiredFeatures: ['weekly_monthly_reports', 'performance_insights'],
        adminOnly: false,
      },
      {
        key: 'time-tracking',
        label: 'Time Tracking',
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
        parentKey: null,
        route: '/dashboard/payroll',
        sortOrder: 6,
        requiredFeatures: ['full_time_tracking'],
        adminOnly: true,
      },
      {
        key: 'notifications',
        label: 'Notifications',
        parentKey: null,
        route: '/dashboard/notifications',
        sortOrder: 7,
        requiredFeatures: [],
        adminOnly: false,
      },
      {
        key: 'settings',
        label: 'Settings',
        parentKey: null,
        route: null,
        sortOrder: 8,
        requiredFeatures: [],
        adminOnly: false,
      },
      {
        key: 'sync',
        label: 'Sync',
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
      // task-management: admin sees "Task Management", member sees "My Tasks"
      {
        navigationKey: 'task-management',
        role: 'member',
        labelOverride: 'My Tasks',
        hidden: false,
      },

      // leave: member sees "Leave Requests"
      { navigationKey: 'leave', role: 'member', labelOverride: 'Leave Requests', hidden: false },

      // settings-general: member sees "Profile"
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
