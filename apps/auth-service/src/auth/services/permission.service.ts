import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class PermissionService {
    constructor(
        @InjectRepository(Permission)
        private permissionRepository: Repository<Permission>
    ) { }

    /**
     * Registers permissions for a module.
     * This should be called by each module on startup.
     */
    async registerPermissions(module: string, actions: string[]) {
        for (const action of actions) {
            const code = `${module}.${action}`;

            const existing = await this.permissionRepository.findOne({ where: { code } });

            if (!existing) {
                const permission = this.permissionRepository.create({
                    code,
                    module,
                    action,
                    description: `Permission to ${action} ${module}`
                });
                await this.permissionRepository.save(permission);
            }
        }
    }

    async findAll(): Promise<Permission[]> {
        return this.permissionRepository.find();
    }

    async findByCodes(codes: string[]): Promise<Permission[]> {
        if (!codes || codes.length === 0) return [];

        // Handle wildcard '*' permission
        if (codes.includes('*')) {
            const allPermissions = await this.permissionRepository.find();
            // We might want to handle '*' logically rather than fetching all, 
            // but for DB linking we need actual entities.
            // Actually, '*' usually just means "bypass check" in Guard, 
            // but if we want to assign "All Permissions" to a role in DB,
            // we might have a specific '*' permission entity or link all.
            // Let's assume there is a specific permission entity for '*' or we handle it in logic.
            // For now, let's just look for specific codes.

            // If '*' is passed, we check if there is a permission entity with code '*'
            // If not, maybe create it?
        }

        // TypeORM Where In
        return this.permissionRepository
            .createQueryBuilder('permission')
            .where('permission.code IN (:...codes)', { codes })
            .getMany();
    }
}
