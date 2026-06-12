import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { FeatureCatalog } from '../features/entities/feature-catalog.entity';
import { NavigationItem } from '../navigation/entities/navigation-item.entity';
import { NavigationRoleOverride } from '../navigation/entities/navigation-role-override.entity';
import { WorkspacePackage } from '../workspace/entities/workspace-package.entity';
import { BillingPlan } from '../billing/entities/billing-plan.entity';
import { FeaturePack } from '../billing/entities/feature-pack.entity';
import { CountryPaymentConfig } from '../billing/entities/country-payment-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeatureCatalog,
      NavigationItem,
      NavigationRoleOverride,
      WorkspacePackage,
      BillingPlan,
      FeaturePack,
      CountryPaymentConfig,
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
