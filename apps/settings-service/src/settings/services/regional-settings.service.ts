import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegionalSettings } from '../entities/regional-settings.entity';
import { UpdateRegionalSettingsDto } from '../dto/update-regional-settings.dto';

@Injectable()
export class RegionalSettingsService {
  constructor(
    @InjectRepository(RegionalSettings)
    private readonly repo: Repository<RegionalSettings>,
  ) {}

  async findByOrg(organizationId: string): Promise<RegionalSettings> {
    let settings = await this.repo.findOne({ where: { organizationId } });

    if (!settings) {
      // Seed with sensible defaults matching the UI (West Africa)
      settings = this.repo.create({
        organizationId,
        timezone: 'Africa/Lagos',
        baseCurrency: 'NGN',
        dateFormat: 'DD/MM/YY',
        language: 'en',
      });
      await this.repo.save(settings);
    }

    return settings;
  }

  async update(organizationId: string, dto: UpdateRegionalSettingsDto): Promise<RegionalSettings> {
    let settings = await this.repo.findOne({ where: { organizationId } });

    if (!settings) {
      settings = this.repo.create({ organizationId });
    }

    Object.assign(settings, dto);
    return this.repo.save(settings);
  }
}
