import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OvertimePolicy } from '../entities/overtime-policy.entity';
import { UpdateOvertimePolicyDto } from '../dto/update-overtime-policy.dto';

@Injectable()
export class OvertimePolicyService {
  constructor(
    @InjectRepository(OvertimePolicy)
    private readonly repo: Repository<OvertimePolicy>,
  ) {}

  async findByOrg(organizationId: string): Promise<OvertimePolicy> {
    let policy = await this.repo.findOne({ where: { organizationId } });

    if (!policy) {
      policy = this.repo.create({
        organizationId,
        enabled: false,
        requireApproval: false,
        weeklyThresholdHrs: null,
        rateMultiplier: null,
      });
      await this.repo.save(policy);
    }

    return policy;
  }

  async update(organizationId: string, dto: UpdateOvertimePolicyDto): Promise<OvertimePolicy> {
    let policy = await this.repo.findOne({ where: { organizationId } });

    if (!policy) {
      policy = this.repo.create({ organizationId });
    }

    Object.assign(policy, dto);

    // Clear conditional fields when overtime is disabled
    if (!dto.enabled) {
      policy.weeklyThresholdHrs = null;
      policy.rateMultiplier = null;
    }

    return this.repo.save(policy);
  }
}
