import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneralSettings } from '../entities/general-settings.entity';
import { UpdateGeneralSettingsDto } from '../dto/update-general-settings.dto';

@Injectable()
export class GeneralSettingsService {
  constructor(
    @InjectRepository(GeneralSettings)
    private readonly repo: Repository<GeneralSettings>,
  ) {}

  /**
   * Get the general settings for an org.
   * If no record exists yet, a default empty row is created automatically.
   */
  async findByOrg(organizationId: string): Promise<GeneralSettings> {
    let settings = await this.repo.findOne({ where: { organizationId } });

    if (!settings) {
      settings = this.repo.create({ organizationId });
      await this.repo.save(settings);
    }

    return settings;
  }

  async update(organizationId: string, dto: UpdateGeneralSettingsDto): Promise<GeneralSettings> {
    let settings = await this.repo.findOne({ where: { organizationId } });

    if (!settings) {
      settings = this.repo.create({ organizationId });
    }

    Object.assign(settings, dto);
    return this.repo.save(settings);
  }
}
