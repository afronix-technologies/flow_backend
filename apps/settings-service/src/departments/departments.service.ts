import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { TeamMember } from '../members/entities/team-member.entity';
import { User } from '../../../auth-service/src/auth/entities/user.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentStatusDto } from './dto/update-department-status.dto';

const AVATAR_COLORS = [
  '#2563eb',
  '#0ea5e9',
  '#8b5cf6',
  '#f97316',
  '#10b981',
  '#ef4444',
  '#f59e0b',
  '#ec4899',
];

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const PREVIEW_LIMIT = 4;

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,

    @InjectRepository(TeamMember)
    private readonly memberRepo: Repository<TeamMember>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ── Helpers ────────────────────────────────────────────────────────────────

  private managerShape(user: User) {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
    return {
      id: user.id,
      fullName,
      roleTitle: user.role?.displayName ?? user.role?.name ?? 'Manager',
      email: user.email,
      avatarColor: avatarColor(user.id),
    };
  }

  private async deptShape(dept: Department) {
    const members = await this.memberRepo.find({ where: { departmentId: dept.id } });

    const membersCount = members.length;
    const membersPreview = members.slice(0, PREVIEW_LIMIT).map((m) => ({
      id: m.id,
      fullName: m.fullName,
      avatarColor: m.avatarColor ?? avatarColor(m.id),
    }));
    const extraMembersCount = Math.max(0, membersCount - PREVIEW_LIMIT);

    let manager = null;
    if (dept.managerId) {
      const u = await this.userRepo.findOne({ where: { id: dept.managerId } });
      if (u) manager = this.managerShape(u);
    }

    return {
      id: dept.id,
      name: dept.name,
      description: dept.description ?? null,
      status: dept.status,
      manager,
      membersCount,
      activeProjectsCount: 0,
      weeklyHours: 0,
      membersPreview,
      extraMembersCount,
      createdAt: dept.createdAt,
    };
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async findAll(organizationId: string) {
    const depts = await this.deptRepo.find({ where: { organizationId } });
    return Promise.all(depts.map((d) => this.deptShape(d)));
  }

  async create(organizationId: string, dto: CreateDepartmentDto) {
    const manager = await this.userRepo.findOne({
      where: { id: dto.managerId, organizationId },
    });
    if (!manager) {
      throw new NotFoundException(`Manager "${dto.managerId}" not found in this organization`);
    }

    const existing = await this.deptRepo.findOne({ where: { organizationId, name: dto.name } });
    if (existing) {
      throw new ConflictException(
        `A department named "${dto.name}" already exists in this organization`,
      );
    }

    const dept = this.deptRepo.create({
      organizationId,
      name: dto.name,
      description: dto.description,
      managerId: dto.managerId,
    });

    const saved = await this.deptRepo.save(dept);
    return this.deptShape(saved);
  }

  async updateStatus(organizationId: string, departmentId: string, dto: UpdateDepartmentStatusDto) {
    const dept = await this.deptRepo.findOne({ where: { id: departmentId, organizationId } });
    if (!dept) throw new NotFoundException(`Department "${departmentId}" not found`);

    dept.status = dto.status;
    await this.deptRepo.save(dept);
    return { id: dept.id, status: dept.status };
  }

  async getEligibleManagers(organizationId: string) {
    const users = await this.userRepo.find({ where: { organizationId, isActive: true } });
    return users.map((u) => this.managerShape(u));
  }
}
