import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GeneralSettings } from './entities/general-settings.entity';
import { ContactSettings } from './entities/contact-settings.entity';
import { RegionalSettings } from './entities/regional-settings.entity';

import { GeneralSettingsService } from './services/general-settings.service';
import { ContactSettingsService } from './services/contact-settings.service';
import { RegionalSettingsService } from './services/regional-settings.service';

import { GeneralSettingsController } from './controllers/general-settings.controller';
import { ContactSettingsController } from './controllers/contact-settings.controller';
import { RegionalSettingsController } from './controllers/regional-settings.controller';

import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([GeneralSettings, ContactSettings, RegionalSettings])],
  controllers: [GeneralSettingsController, ContactSettingsController, RegionalSettingsController],
  providers: [
    GeneralSettingsService,
    ContactSettingsService,
    RegionalSettingsService,
    JwtAuthGuard,
  ],
  exports: [GeneralSettingsService, ContactSettingsService, RegionalSettingsService],
})
export class SettingsModule {}
