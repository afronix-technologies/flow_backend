import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('settings_contact')
@Index(['organizationId'], { unique: true })
export class ContactSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  /** Full name of the primary admin contact */
  @Column({ name: 'admin_name', nullable: true })
  adminName: string;

  /** Support / public-facing email address */
  @Column({ name: 'support_email', nullable: true })
  supportEmail: string;

  /** Country dial code for the phone number (e.g. "234") */
  @Column({ name: 'phone_country_code', nullable: true })
  phoneCountryCode: string;

  /** Primary phone number (without country code) */
  @Column({ name: 'phone_number', nullable: true })
  phoneNumber: string;

  /** Country dial code for the WhatsApp contact (e.g. "234") */
  @Column({ name: 'whatsapp_country_code', nullable: true })
  whatsappCountryCode: string;

  /** WhatsApp contact number (without country code) */
  @Column({ name: 'whatsapp_number', nullable: true })
  whatsappNumber: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
