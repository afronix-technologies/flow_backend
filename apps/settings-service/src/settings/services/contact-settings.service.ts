import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactSettings } from '../entities/contact-settings.entity';
import { UpdateContactSettingsDto } from '../dto/update-contact-settings.dto';

@Injectable()
export class ContactSettingsService {
  constructor(
    @InjectRepository(ContactSettings)
    private readonly repo: Repository<ContactSettings>,
  ) {}

  async findByOrg(organizationId: string): Promise<ContactSettings> {
    let settings = await this.repo.findOne({ where: { organizationId } });

    if (!settings) {
      settings = this.repo.create({ organizationId });
      await this.repo.save(settings);
    }

    return settings;
  }

  async update(organizationId: string, dto: UpdateContactSettingsDto): Promise<ContactSettings> {
    let settings = await this.repo.findOne({ where: { organizationId } });

    if (!settings) {
      settings = this.repo.create({ organizationId });
    }

    Object.assign(settings, dto);
    return this.repo.save(settings);
  }
}
