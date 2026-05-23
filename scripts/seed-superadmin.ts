/**
 * seed-superadmin.ts
 *
 * Non-interactive super admin seed script — safe to run on every deploy.
 * Skips silently if the account already exists.
 *
 * Credentials are read from environment variables:
 *   SUPERADMIN_EMAIL         (required)
 *   SUPERADMIN_PASSWORD      (required)
 *   SUPERADMIN_FIRST_NAME    (optional, default: "Afronix")
 *   SUPERADMIN_LAST_NAME     (optional, default: "Admin")
 *
 * Usage:
 *   npm run seed:superadmin
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

import { User } from '../apps/auth-service/src/auth/entities/user.entity';
import { Role } from '../apps/auth-service/src/auth/entities/role.entity';
import { Organization } from '../apps/auth-service/src/auth/entities/organization.entity';
import { Permission } from '../apps/auth-service/src/auth/entities/permission.entity';
import { UserOrganization } from '../apps/auth-service/src/auth/entities/user-organization.entity';
import { Invitation } from '../apps/auth-service/src/auth/entities/invitation.entity';
import { OAuthAccount } from '../apps/auth-service/src/auth/entities/oauth-account.entity';
import { RefreshToken } from '../apps/auth-service/src/auth/entities/refresh-token.entity';

const EMAIL = process.env.SUPERADMIN_EMAIL;
const PASSWORD = process.env.SUPERADMIN_PASSWORD;
const FIRST_NAME = process.env.SUPERADMIN_FIRST_NAME || 'Afronix';
const LAST_NAME = process.env.SUPERADMIN_LAST_NAME || 'Admin';

if (!EMAIL || !PASSWORD) {
  console.error(
    '\n[seed:superadmin] SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be set in environment.\n',
  );
  process.exit(1);
}

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [
    User,
    Role,
    Organization,
    Permission,
    UserOrganization,
    Invitation,
    OAuthAccount,
    RefreshToken,
  ],
  synchronize: true,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function seed() {
  await AppDataSource.initialize();

  const roleRepo = AppDataSource.getRepository(Role);
  const userRepo = AppDataSource.getRepository(User);
  const orgRepo = AppDataSource.getRepository(Organization);

  // 1. Ensure super_admin role exists
  let role = await roleRepo.findOne({ where: { name: 'super_admin' } });
  if (!role) {
    role = roleRepo.create({
      name: 'super_admin',
      displayName: 'Super Admin',
      description: 'Full system access. Do not delete.',
      isSystemRole: true,
      isActive: true,
    });
    await roleRepo.save(role);
    console.log('[seed:superadmin] Created super_admin role.');
  }

  // 2. Ensure system organisation exists
  let org = await orgRepo.findOne({ where: { slug: 'afronix-system' } });
  if (!org) {
    org = orgRepo.create({ name: 'Afronix System', slug: 'afronix-system', isActive: true });
    await orgRepo.save(org);
    console.log('[seed:superadmin] Created system organisation.');
  }

  // 3. Skip if account already exists
  const existing = await userRepo
    .createQueryBuilder('user')
    .select(['user.id', 'user.email'])
    .where('user.email = :email', { email: EMAIL })
    .getOne();

  if (existing) {
    console.log(`[seed:superadmin] Account "${EMAIL}" already exists — skipping.`);
    await AppDataSource.destroy();
    return;
  }

  // 4. Create the super admin account
  const hashed = await bcrypt.hash(PASSWORD, 12);
  const user = userRepo.create({
    email: EMAIL,
    firstName: FIRST_NAME,
    lastName: LAST_NAME,
    password: hashed,
    organizationId: org.id,
    roleId: role.id,
    isActive: true,
    emailVerified: true,
  });

  await userRepo.save(user);
  console.log(`[seed:superadmin] Super admin account created: ${EMAIL}`);

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('[seed:superadmin] Failed:', err.message);
  process.exit(1);
});
