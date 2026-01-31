import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { PermissionService } from './permission.service';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    private permissionService: PermissionService,
  ) { }

  async onModuleInit() {
    await this.seedDefaultRoles();
  }

  async seedDefaultRoles() {
    const defaultRoles = [
      {
        name: 'admin',
        displayName: 'Admin',
        description: 'Full access to organization settings and users',
        isSystemRole: true,
        permissions: ['*'],
      },
      {
        name: 'hr',
        displayName: 'HR',
        description: 'Manage employees, onboarding, and departments',
        permissions: ['users.manage', 'departments.manage', 'invitations.manage'],
      },
      {
        name: 'management',
        displayName: 'Management',
        description: 'View access to team reports and approvals',
        permissions: ['users.view', 'reports.view', 'requests.manage'],
      },
      {
        name: 'member',
        displayName: 'Member',
        description: 'Standard employee access',
        isDefault: true,
        permissions: ['profile.manage', 'requests.create'],
      },
    ];

    // Ensure permissions exist
    const allPermissions = new Set(defaultRoles.flatMap((r) => r.permissions));
    // We can group them by module if we want, or just register them with a default module 'system'
    // Ideally modules register their own, but for these base roles we need to ensure they exist.

    // Let's manually register them to be safe
    const permissionsToRegister = Array.from(allPermissions).filter((p) => p !== '*');
    await this.permissionService.registerPermissions('system', permissionsToRegister);

    for (const roleData of defaultRoles) {
      const exists = await this.roleRepository.findOne({ where: { name: roleData.name } });
      if (!exists) {
        const role = this.roleRepository.create({
          name: roleData.name,
          displayName: roleData.displayName,
          description: roleData.description,
          isSystemRole: roleData.isSystemRole,
          isDefault: roleData.isDefault,
        });
        await this.roleRepository.save(role);

        // Assign permissions
        if (roleData.permissions && roleData.permissions.length > 0) {
          // Start transaction or just save
          // We need to assume permissions exist.
          // In a real app, we'd ensure permissions are registered first.
          // For '*' admin, permissions logic in Guard handles it,
          // but we can also link specific permissions if needed.
          // Let's link defined permissions.

          if (roleData.permissions.includes('*')) {
            // Special case: Admin gets all *current* permissions?
            // Or just assign a special '*' permission?
            // Let's try to find/create '*' permission
            let starPerm = await this.permissionRepository.findOne({ where: { code: '*' } });
            if (!starPerm) {
              starPerm = this.permissionRepository.create({
                code: '*',
                module: 'system',
                action: 'all',
                description: 'Super Admin Access',
              });
              await this.permissionRepository.save(starPerm);
            }
            role.permissions = [starPerm];
          } else {
            const perms = await this.permissionRepository
              .createQueryBuilder('p')
              .where('p.code IN (:...codes)', { codes: roleData.permissions })
              .getMany();
            role.permissions = perms;
          }

          await this.roleRepository.save(role);
        }
      }
    }
  }

  async findByName(name: string): Promise<Role> {
    return this.roleRepository.findOne({ where: { name } });
  }

  async findDefaultRole(): Promise<Role> {
    return this.roleRepository.findOne({ where: { isDefault: true } });
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find();
  }
}
