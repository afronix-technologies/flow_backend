import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { BillingPlan } from './entities/billing-plan.entity';
import { FeaturePack } from './entities/feature-pack.entity';
import { OrgSubscription } from './entities/org-subscription.entity';
import { OrgActivePack } from './entities/org-active-pack.entity';
import { Invoice } from './entities/invoice.entity';
import { CountryPaymentConfig } from './entities/country-payment-config.entity';
import { BillingService } from './billing.service';
import { CountryPaymentService } from './country-payment.service';
import { PaymentProviderService } from './payment-provider.service';
import { BillingController } from './billing.controller';
import { SubscriptionController } from './subscription.controller';
import { JwtAuthGuard } from '../settings/guards/jwt-auth.guard';
import { GeneralSettings } from '../settings/entities/general-settings.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      BillingPlan,
      FeaturePack,
      OrgSubscription,
      OrgActivePack,
      Invoice,
      CountryPaymentConfig,
      GeneralSettings,
    ]),
    BullModule.registerQueue({ name: 'notifications' }),
  ],
  controllers: [BillingController, SubscriptionController],
  providers: [BillingService, CountryPaymentService, PaymentProviderService, JwtAuthGuard],
  exports: [BillingService, CountryPaymentService],
})
export class BillingModule {}
