/**
 * Create Super Admin — Afronix Tracker
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/create-superadmin.ts
 *
 * This script creates a super_admin role (if it doesn't exist) and a user
 * assigned to that role. Only super_admin users can log into the Admin Panel.
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';
import * as dotenv from 'dotenv';

dotenv.config();

// Import entities directly — no service layer needed
import { User } from '../apps/auth-service/src/auth/entities/user.entity';
import { Role } from '../apps/auth-service/src/auth/entities/role.entity';
import { Organization } from '../apps/auth-service/src/auth/entities/organization.entity';
import { Permission } from '../apps/auth-service/src/auth/entities/permission.entity';
import { UserOrganization } from '../apps/auth-service/src/auth/entities/user-organization.entity';
import { Invitation } from '../apps/auth-service/src/auth/entities/invitation.entity';
import { OAuthAccount } from '../apps/auth-service/src/auth/entities/oauth-account.entity';
import { RefreshToken } from '../apps/auth-service/src/auth/entities/refresh-token.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [User, Role, Organization, Permission, UserOrganization, Invitation, OAuthAccount, RefreshToken],
  synchronize: true, // adds any missing columns on connect (safe for setup scripts)
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

function promptPassword(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let password = '';
    stdin.on('data', function handler(char: string) {
      if (char === '\r' || char === '\n') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', handler);
        process.stdout.write('\n');
        resolve(password);
      } else if (char === '\u0003') {
        // Ctrl+C
        process.exit();
      } else if (char === '\u007f') {
        // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        password += char;
        process.stdout.write('*');
      }
    });
  });
}

async function main() {
  console.log('\n========================================');
  console.log('  Afronix Tracker — Create Super Admin  ');
  console.log('========================================\n');

  await AppDataSource.initialize();
  console.log('Connected to database.\n');

  const roleRepo = AppDataSource.getRepository(Role);
  const userRepo = AppDataSource.getRepository(User);
  const orgRepo = AppDataSource.getRepository(Organization);

  // 1. Ensure the super_admin role exists
  let superAdminRole = await roleRepo.findOne({ where: { name: 'super_admin' } });
  if (!superAdminRole) {
    superAdminRole = roleRepo.create({
      name: 'super_admin',
      displayName: 'Super Admin',
      description: 'Full access to the Afronix admin panel. System role — do not delete.',
      isSystemRole: true,
      isActive: true,
    });
    await roleRepo.save(superAdminRole);
    console.log('Created super_admin role.\n');
  } else {
    console.log('super_admin role already exists.\n');
  }

  // 2. Ensure a system organization exists for super admins
  let systemOrg = await orgRepo.findOne({ where: { slug: 'afronix-system' } });
  if (!systemOrg) {
    systemOrg = orgRepo.create({
      name: 'Afronix System',
      slug: 'afronix-system',
      isActive: true,
    });
    await orgRepo.save(systemOrg);
    console.log('Created system organization.\n');
  }

  // 3. Collect user details
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const email = (await prompt(rl, 'Email: ')).trim().toLowerCase();

  if (!email || !email.includes('@')) {
    console.error('Invalid email address.');
    await AppDataSource.destroy();
    rl.close();
    process.exit(1);
  }

  // Check if user already exists
  const existing = await userRepo.findOne({ where: { email } });
  if (existing) {
    console.log(`\nUser with email "${email}" already exists.`);
    const update = (await prompt(rl, 'Update their role to super_admin? (yes/no): ')).trim().toLowerCase();
    if (update === 'yes' || update === 'y') {
      await userRepo.update(existing.id, { roleId: superAdminRole.id });
      console.log(`\nUser ${email} has been granted super_admin role.`);
    } else {
      console.log('No changes made.');
    }
    rl.close();
    await AppDataSource.destroy();
    process.exit(0);
  }

  const firstName = (await prompt(rl, 'First name: ')).trim();
  const lastName = (await prompt(rl, 'Last name: ')).trim();
  rl.close();

  const password = await promptPassword('Password: ');
  const confirmPassword = await promptPassword('Confirm password: ');

  if (password !== confirmPassword) {
    console.error('\nPasswords do not match.');
    await AppDataSource.destroy();
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('\nPassword must be at least 8 characters.');
    await AppDataSource.destroy();
    process.exit(1);
  }

  // 4. Hash and create user
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = userRepo.create({
    email,
    firstName,
    lastName,
    password: hashedPassword,
    organizationId: systemOrg.id,
    roleId: superAdminRole.id,
    isActive: true,
    emailVerified: true,
  });

  await userRepo.save(user);

  console.log('\n========================================');
  console.log(`  Super admin created successfully!`);
  console.log(`  Email: ${email}`);
  console.log(`  Panel: http://localhost:3006/admin`);
  console.log('========================================\n');

  await AppDataSource.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error('\nError:', err.message);
  process.exit(1);
});
