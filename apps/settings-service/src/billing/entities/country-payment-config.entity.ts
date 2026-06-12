import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('country_payment_configs')
export class CountryPaymentConfig {
  // ISO 3166-1 alpha-2 code, or 'DEFAULT' for the fallback entry
  @PrimaryColumn()
  countryCode: string;

  @Column()
  currency: string; // ISO 4217 e.g. 'NGN', 'USD', 'GBP'

  @Column()
  currencySymbol: string; // e.g. '₦', '$', '£'

  // Accepted payment methods for this country e.g. ['paystack','flutterwave'] or ['card']
  @Column({ type: 'simple-array' })
  paymentMethods: string[];

  @UpdateDateColumn()
  updatedAt: Date;
}
