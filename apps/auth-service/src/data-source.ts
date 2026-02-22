import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './auth/entities/user.entity';
import { Organization } from './auth/entities/organization.entity';
import { UserOrganization } from './auth/entities/user-organization.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity'; // Updated Import
import { Invitation } from './auth/entities/invitation.entity';
import { Role } from './auth/entities/role.entity';
import { Permission } from './auth/entities/permission.entity';
import { OAuthAccount } from './auth/entities/oauth-account.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  synchronize: false,
  logging: true,
  entities: [
    User,
    Organization,
    UserOrganization,
    RefreshToken,
    Invitation,
    Role,
    Permission,
    OAuthAccount,
  ],
  migrations: ['apps/auth-service/src/migrations/*.ts'],
  subscribers: [],
});
