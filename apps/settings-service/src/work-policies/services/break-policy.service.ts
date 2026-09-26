import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BreakPolicy } from '../entities/break-policy.entity';
import { UpdateBreakPolicyDto } from '../dto/update-break-policy.dto';

@Injectable()
export class BreakPolicyService {
  constructor(
    @InjectRepository(BreakPolicy)
    private readonly repo: Repository<BreakPolicy>,
  ) {}

  async findByOrg(organizationId: string): Promise<BreakPolicy> {
    let policy = await this.repo.findOne({ where: { organizationId } });

    if (!policy) {
      policy = this.repo.create({
        organizationId,
        includeLunchBreak: false,
        durationMins: null,
        breakType: null,
      });
      await this.repo.save(policy);
    }

    return policy;
  }

  async update(organizationId: string, dto: UpdateBreakPolicyDto): Promise<BreakPolicy> {
    let policy = await this.repo.findOne({ where: { organizationId } });

    if (!policy) {
      policy = this.repo.create({ organizationId });
    }

    Object.assign(policy, dto);

    // Clear conditional fields when lunch break is disabled
    if (!dto.includeLunchBreak) {
      policy.durationMins = null;
      policy.breakType = null;
    }

    return this.repo.save(policy);
  }
}
