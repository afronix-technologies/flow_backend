import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CountryPaymentConfig } from './entities/country-payment-config.entity';
import { GeneralSettings } from '../settings/entities/general-settings.entity';

export interface PaymentConfig {
  countryCode: string;
  currency: string;
  currencySymbol: string;
  paymentMethods: string[];
  isFallback: boolean;
}

@Injectable()
export class CountryPaymentService {
  constructor(
    @InjectRepository(CountryPaymentConfig)
    private readonly configRepo: Repository<CountryPaymentConfig>,

    @InjectRepository(GeneralSettings)
    private readonly generalSettingsRepo: Repository<GeneralSettings>,
  ) {}

  /**
   * Returns the payment config for a given country code.
   * Falls back to the DEFAULT entry if the country is unknown or not provided.
   */
  async getConfigForCountry(countryCode?: string): Promise<PaymentConfig> {
    if (countryCode) {
      const found = await this.configRepo.findOne({
        where: { countryCode: countryCode.toUpperCase() },
      });
      if (found) {
        return { ...found, isFallback: false };
      }
    }

    const fallback = await this.configRepo.findOne({ where: { countryCode: 'DEFAULT' } });
    return {
      countryCode: countryCode ?? 'DEFAULT',
      currency: fallback?.currency ?? 'USD',
      currencySymbol: fallback?.currencySymbol ?? '$',
      paymentMethods: fallback?.paymentMethods ?? ['card'],
      isFallback: true,
    };
  }

  /**
   * Resolves the payment config for an org by reading their country
   * from GeneralSettings, then looking it up in the registry.
   */
  async getConfigForOrg(organizationId: string): Promise<PaymentConfig> {
    const settings = await this.generalSettingsRepo.findOne({
      where: { organizationId },
    });
    return this.getConfigForCountry(settings?.country ?? undefined);
  }
}
