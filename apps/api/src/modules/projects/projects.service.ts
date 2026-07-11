import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectCategory, ProjectStatus, ProjectHealth } from './entities/project.entity';
import { ProjectTask } from './entities/project-task.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
  AuditAction,
  AuditResourceType,
  AuditStatus,
  AuditSeverity,
} from '../audit-logs/entities/audit-log.entity';

export interface AuditActor {
  userId: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    @InjectRepository(ProjectTask)
    private readonly taskRepo: Repository<ProjectTask>,

    private readonly auditLogsService: AuditLogsService,
  ) {}

  // ---------------------------------------------------------------------------
  // Projects
  // ---------------------------------------------------------------------------

  async findAllProjects(organizationId: string, category?: ProjectCategory): Promise<Project[]> {
    const where: any = { organizationId };
    if (category) where.category = category;
    return this.projectRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOneProject(organizationId: string, projectId: string): Promise<Project> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId, organizationId },
      relations: ['tasks'],
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async createProject(
    organizationId: string,
    dto: CreateProjectDto,
    actor?: AuditActor,
  ): Promise<Project> {
    const existing = await this.projectRepo.findOne({
      where: { organizationId, projectCode: dto.projectCode },
    });
    if (existing) {
      throw new ConflictException(`Project code '${dto.projectCode}' already exists`);
    }

    const project = this.projectRepo.create({
      ...dto,
      organizationId,
      lastActivityAt: new Date(),
    });
    const saved = await this.projectRepo.save(project);

    if (actor) {
      await this.auditLogsService.log({
        organizationId,
        userId: actor.userId,
        actorId: actor.userId,
        actorEmail: actor.email,
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.PROJECT,
        resourceId: saved.id,
        resourceName: saved.name,
        status: AuditStatus.SUCCESS,
        severity: AuditSeverity.LOW,
        description: `Created project "${saved.name}" (${saved.projectCode})`,
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      });
    }

    return saved;
  }

  async updateProject(
    organizationId: string,
    projectId: string,
    dto: UpdateProjectDto,
    actor?: AuditActor,
  ): Promise<Project> {
    const project = await this.findOneProject(organizationId, projectId);

    if (dto.projectCode && dto.projectCode !== project.projectCode) {
      const conflict = await this.projectRepo.findOne({
        where: { organizationId, projectCode: dto.projectCode },
      });
      if (conflict) throw new ConflictException(`Project code '${dto.projectCode}' already exists`);
    }

    const before = { ...project };
    Object.assign(project, dto, { lastActivityAt: new Date() });
    const saved = await this.projectRepo.save(project);

    if (actor) {
      const changes = Object.keys(dto).reduce((acc, key) => {
        const oldValue = (before as any)[key];
        const newValue = (saved as any)[key];
        if (oldValue !== newValue) acc[key] = { from: oldValue, to: newValue };
        return acc;
      }, {} as Record<string, any>);

      await this.auditLogsService.log({
        organizationId,
        userId: actor.userId,
        actorId: actor.userId,
        actorEmail: actor.email,
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.PROJECT,
        resourceId: saved.id,
        resourceName: saved.name,
        status: AuditStatus.SUCCESS,
        severity: AuditSeverity.LOW,
        description: `Updated project "${saved.name}" (${saved.projectCode})`,
        changes,
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      });
    }

    return saved;
  }

  async deleteProject(organizationId: string, projectId: string, actor?: AuditActor): Promise<void> {
    const project = await this.findOneProject(organizationId, projectId);
    await this.projectRepo.remove(project);

    if (actor) {
      await this.auditLogsService.log({
        organizationId,
        userId: actor.userId,
        actorId: actor.userId,
        actorEmail: actor.email,
        action: AuditAction.DELETE,
        resourceType: AuditResourceType.PROJECT,
        resourceId: projectId,
        resourceName: project.name,
        status: AuditStatus.SUCCESS,
        severity: AuditSeverity.MEDIUM,
        description: `Deleted project "${project.name}" (${project.projectCode})`,
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Tasks
  // ---------------------------------------------------------------------------

  async findAllTasks(organizationId: string, projectId: string): Promise<ProjectTask[]> {
    await this.findOneProject(organizationId, projectId); // ensure project belongs to org
    return this.taskRepo.find({ where: { projectId }, order: { createdAt: 'DESC' } });
  }

  async findOneTask(
    organizationId: string,
    projectId: string,
    taskId: string,
  ): Promise<ProjectTask> {
    await this.findOneProject(organizationId, projectId);
    const task = await this.taskRepo.findOne({ where: { id: taskId, projectId } });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async createTask(
    organizationId: string,
    projectId: string,
    dto: CreateTaskDto,
    actor?: AuditActor,
  ): Promise<ProjectTask> {
    await this.findOneProject(organizationId, projectId);
    const task = this.taskRepo.create({ ...dto, projectId });
    const saved = await this.taskRepo.save(task);
    await this.projectRepo.update({ id: projectId }, { lastActivityAt: new Date() });

    if (actor) {
      await this.auditLogsService.log({
        organizationId,
        userId: actor.userId,
        actorId: actor.userId,
        actorEmail: actor.email,
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.TASK,
        resourceId: saved.id,
        resourceName: (saved as any).title ?? (saved as any).name ?? saved.id,
        status: AuditStatus.SUCCESS,
        severity: AuditSeverity.LOW,
        description: `Created task in project ${projectId}`,
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      });
    }

    return saved;
  }

  async updateTask(
    organizationId: string,
    projectId: string,
    taskId: string,
    dto: UpdateTaskDto,
    actor?: AuditActor,
  ): Promise<ProjectTask> {
    const task = await this.findOneTask(organizationId, projectId, taskId);
    Object.assign(task, dto);
    const saved = await this.taskRepo.save(task);
    await this.projectRepo.update({ id: projectId }, { lastActivityAt: new Date() });

    if (actor) {
      await this.auditLogsService.log({
        organizationId,
        userId: actor.userId,
        actorId: actor.userId,
        actorEmail: actor.email,
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.TASK,
        resourceId: saved.id,
        resourceName: (saved as any).title ?? (saved as any).name ?? saved.id,
        status: AuditStatus.SUCCESS,
        severity: AuditSeverity.LOW,
        description: `Updated task ${taskId} in project ${projectId}`,
        changes: dto as Record<string, any>,
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      });
    }

    return saved;
  }

  async deleteTask(
    organizationId: string,
    projectId: string,
    taskId: string,
    actor?: AuditActor,
  ): Promise<void> {
    const task = await this.findOneTask(organizationId, projectId, taskId);
    await this.taskRepo.remove(task);

    if (actor) {
      await this.auditLogsService.log({
        organizationId,
        userId: actor.userId,
        actorId: actor.userId,
        actorEmail: actor.email,
        action: AuditAction.DELETE,
        resourceType: AuditResourceType.TASK,
        resourceId: taskId,
        resourceName: (task as any).title ?? (task as any).name ?? taskId,
        status: AuditStatus.SUCCESS,
        severity: AuditSeverity.LOW,
        description: `Deleted task ${taskId} in project ${projectId}`,
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  async getStats(organizationId: string) {
    const [total, active, onHold, completed, archived] = await Promise.all([
      this.projectRepo.count({ where: { organizationId } }),
      this.projectRepo.count({ where: { organizationId, status: ProjectStatus.ACTIVE } }),
      this.projectRepo.count({ where: { organizationId, status: ProjectStatus.ON_HOLD } }),
      this.projectRepo.count({ where: { organizationId, status: ProjectStatus.COMPLETED } }),
      this.projectRepo.count({ where: { organizationId, status: ProjectStatus.ARCHIVED } }),
    ]);

    const [onTrack, atRisk, critical] = await Promise.all([
      this.projectRepo.count({ where: { organizationId, health: ProjectHealth.ON_TRACK } }),
      this.projectRepo.count({ where: { organizationId, health: ProjectHealth.AT_RISK } }),
      this.projectRepo.count({ where: { organizationId, health: ProjectHealth.CRITICAL } }),
    ]);

    const billable = await this.projectRepo.count({
      where: { organizationId, category: ProjectCategory.BILLABLE },
    });
    const internal = await this.projectRepo.count({
      where: { organizationId, category: ProjectCategory.INTERNAL },
    });

    return {
      total,
      byStatus: { active, onHold, completed, archived },
      byHealth: { onTrack, atRisk, critical },
      byCategory: { billable, internal },
    };
  }

  // ---------------------------------------------------------------------------
  // Internal — seed default projects for a new org
  // ---------------------------------------------------------------------------

  async seedDefaultProjects(organizationId: string): Promise<void> {
    const existing = await this.projectRepo.count({ where: { organizationId } });
    if (existing > 0) return;

    const defaults: Partial<Project>[] = [
      {
        projectCode: 'ADMIN-001',
        name: 'General Administration',
        category: ProjectCategory.INTERNAL,
        status: ProjectStatus.ACTIVE,
        health: ProjectHealth.ON_TRACK,
        isDefault: true,
        lastActivityAt: new Date(),
      },
      {
        projectCode: 'TRAIN-002',
        name: 'Training & Development',
        category: ProjectCategory.INTERNAL,
        status: ProjectStatus.ACTIVE,
        health: ProjectHealth.ON_TRACK,
        isDefault: true,
        lastActivityAt: new Date(),
      },
      {
        projectCode: 'SALES-003',
        name: 'Business Development',
        category: ProjectCategory.INTERNAL,
        status: ProjectStatus.ACTIVE,
        health: ProjectHealth.ON_TRACK,
        isDefault: true,
        lastActivityAt: new Date(),
      },
      {
        projectCode: 'SUPPORT-004',
        name: 'Internal Operations',
        category: ProjectCategory.INTERNAL,
        status: ProjectStatus.ACTIVE,
        health: ProjectHealth.ON_TRACK,
        isDefault: true,
        lastActivityAt: new Date(),
      },
    ];

    const entities = defaults.map((d) => this.projectRepo.create({ ...d, organizationId }));
    await this.projectRepo.save(entities);
  }
}
