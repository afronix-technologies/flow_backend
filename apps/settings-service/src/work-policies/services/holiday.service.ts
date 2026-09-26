import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrgHoliday } from '../entities/org-holiday.entity';
import { CreateHolidayDto } from '../dto/create-holiday.dto';
import { UpdateHolidayDto } from '../dto/update-holiday.dto';
import { ImportHolidaysDto } from '../dto/import-holidays.dto';
import { NagerDateService } from './nager-date.service';

@Injectable()
export class HolidayService {
  constructor(
    @InjectRepository(OrgHoliday)
    private readonly repo: Repository<OrgHoliday>,
    private readonly nagerDate: NagerDateService,
  ) {}

  async findAllByOrg(organizationId: string): Promise<OrgHoliday[]> {
    return this.repo.find({
      where: { organizationId },
      order: { date: 'ASC' },
    });
  }

  async create(organizationId: string, dto: CreateHolidayDto): Promise<OrgHoliday> {
    const holiday = this.repo.create({ ...dto, organizationId, enabled: true });
    return this.repo.save(holiday);
  }

  async update(
    organizationId: string,
    holidayId: string,
    dto: UpdateHolidayDto,
  ): Promise<OrgHoliday> {
    const holiday = await this.findOneOrFail(organizationId, holidayId);

    if ((dto.name !== undefined || dto.date !== undefined) && holiday.type !== 'custom') {
      throw new BadRequestException(
        'Only custom holidays can have their name or date changed. Use enabled to toggle national/religious holidays.',
      );
    }

    Object.assign(holiday, dto);
    return this.repo.save(holiday);
  }

  async remove(organizationId: string, holidayId: string): Promise<void> {
    const holiday = await this.findOneOrFail(organizationId, holidayId);

    if (holiday.type !== 'custom') {
      throw new BadRequestException(
        'Only custom holidays can be deleted. Use PATCH to disable national or religious holidays.',
      );
    }

    await this.repo.remove(holiday);
  }

  async importPresets(
    organizationId: string,
    dto: ImportHolidaysDto,
  ): Promise<{ imported: number; holidays: OrgHoliday[] }> {
    const year = dto.year ?? new Date().getFullYear();
    const presets = await this.nagerDate.getPublicHolidays(dto.country, year);

    // Replace all existing holidays for this org
    await this.repo.delete({ organizationId });

    const entities = presets.map((p) => this.repo.create({ ...p, organizationId, enabled: true }));

    const holidays = await this.repo.save(entities);
    return { imported: holidays.length, holidays };
  }

  async getPresets(country: string, year?: number) {
    const resolvedYear = year ?? new Date().getFullYear();
    return this.nagerDate.getPublicHolidays(country, resolvedYear);
  }

  async getAvailableCountries() {
    return this.nagerDate.getAvailableCountries();
  }

  private async findOneOrFail(organizationId: string, holidayId: string): Promise<OrgHoliday> {
    const holiday = await this.repo.findOne({
      where: { id: holidayId, organizationId },
    });

    if (!holiday) {
      throw new NotFoundException(`Holiday "${holidayId}" not found in this organisation.`);
    }

    return holiday;
  }
}
