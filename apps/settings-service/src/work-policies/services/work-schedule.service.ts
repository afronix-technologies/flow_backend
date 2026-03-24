import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkSchedule } from '../entities/work-schedule.entity';
import { UpdateWorkScheduleDto } from '../dto/update-work-schedule.dto';

@Injectable()
export class WorkScheduleService {
  constructor(
    @InjectRepository(WorkSchedule)
    private readonly repo: Repository<WorkSchedule>,
  ) {}

  async findByOrg(organizationId: string): Promise<WorkSchedule> {
    let schedule = await this.repo.findOne({ where: { organizationId } });

    if (!schedule) {
      schedule = this.repo.create({
        organizationId,
        workDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        startTime: '08:00',
        endTime: '17:00',
      });
      await this.repo.save(schedule);
    }

    return schedule;
  }

  async update(organizationId: string, dto: UpdateWorkScheduleDto): Promise<WorkSchedule> {
    let schedule = await this.repo.findOne({ where: { organizationId } });

    if (!schedule) {
      schedule = this.repo.create({ organizationId });
    }

    Object.assign(schedule, dto);
    return this.repo.save(schedule);
  }
}
