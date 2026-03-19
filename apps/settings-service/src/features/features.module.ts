import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeatureCatalog } from './entities/feature-catalog.entity';
import { OrganizationFeature } from './entities/organization-feature.entity';
import { FeaturesService } from './features.service';
import { FeaturesController } from './features.controller';
import { JwtAuthGuard } from '../settings/guards/jwt-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([FeatureCatalog, OrganizationFeature])],
  controllers: [FeaturesController],
  providers: [FeaturesService, JwtAuthGuard],
  exports: [FeaturesService],
})
export class FeaturesModule {}
