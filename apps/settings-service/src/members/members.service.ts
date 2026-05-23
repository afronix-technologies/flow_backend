import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamMember, MemberStatus } from './entities/team-member.entity';
import { Department } from '../departments/entities/department.entity';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';

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

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(TeamMember)
    private readonly memberRepo: Repository<TeamMember>,

    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
  ) {}

  private async memberShape(member: TeamMember) {
    let departmentName: string | null = null;
    if (member.departmentId) {
      const dept = await this.deptRepo.findOne({ where: { id: member.departmentId } });
      departmentName = dept?.name ?? null;
    }

    return {
      id: member.id,
      fullName: member.fullName,
      phone: member.phone,
      email: member.email,
      dateOfBirth: member.dateOfBirth,
      gender: member.gender,
      address: member.address ?? null,
      departmentId: member.departmentId ?? null,
      departmentName,
      userRole: member.userRole,
      projectAccess: member.projectAccess ?? null,
      notificationSettings: member.notificationSettings,
      status: member.status,
      createdAt: member.createdAt,
    };
  }

  async create(organizationId: string, dto: CreateTeamMemberDto) {
    const existing = await this.memberRepo.findOne({
      where: { organizationId, email: dto.email },
    });
    if (existing) {
      throw new ConflictException(
        `A member with email "${dto.email}" already exists in this organization`,
      );
    }

    if (dto.departmentId) {
      const dept = await this.deptRepo.findOne({
        where: { id: dto.departmentId, organizationId },
      });
      if (!dept) {
        throw new BadRequestException(
          `Department "${dto.departmentId}" not found in this organization`,
        );
      }
    }

    const member = this.memberRepo.create({
      organizationId,
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
      dateOfBirth: dto.dateOfBirth,
      gender: dto.gender,
      address: dto.address,
      departmentId: dto.departmentId,
      userRole: dto.userRole,
      projectAccess: dto.projectAccess,
      notificationSettings: dto.notificationSettings,
      avatarColor: avatarColor(dto.email),
      status: MemberStatus.PENDING_INVITE,
    });

    const saved = await this.memberRepo.save(member);
    return this.memberShape(saved);
  }

  async findByDepartment(organizationId: string, departmentId: string) {
    const dept = await this.deptRepo.findOne({ where: { id: departmentId, organizationId } });
    if (!dept) throw new NotFoundException(`Department "${departmentId}" not found`);

    const members = await this.memberRepo.find({ where: { departmentId, organizationId } });
    return Promise.all(members.map((m) => this.memberShape(m)));
  }
}
